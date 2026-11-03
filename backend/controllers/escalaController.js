// Atende ao Caso de Uso "Gerar escala automática" (UC03) e Requisitos
// Funcionais RF03/RF04, aplicando as Regras de Negócio RN01 a RN05.
import { getDB } from '../config/db.js';
import { ObjectId } from 'mongodb';
import { gerarCultosDoMes, identificadorDisponibilidade } from '../utils/cultos.js';

function possuiRestricao(voluntario, dataCulto) {
  return (voluntario.restricoes || []).includes(dataCulto);
}

function estaDisponivel(voluntario, culto) {
  // CORREÇÃO: Se o voluntário não preencheu disponibilidades específicas, assumimos que está sempre disponível.
  if (!voluntario.disponibilidades || voluntario.disponibilidades.length === 0) {
      return true; 
  }
  const identificador = identificadorDisponibilidade(culto);
  return voluntario.disponibilidades.includes(identificador);
}

function escolherPorEquidade(candidatos, contagemDeEscalas) {
  return [...candidatos].sort((a, b) => {
    const contagemA = contagemDeEscalas.get(String(a._id)) || 0;
    const contagemB = contagemDeEscalas.get(String(b._id)) || 0;
    return contagemA - contagemB;
  })[0];
}

async function garantirCultosDoMes(db, ano, mes) {
  const cultosCalculados = gerarCultosDoMes(ano, mes);

  for (const culto of cultosCalculados) {
    await db.collection('escalas').updateOne(
      { data_culto: culto.data, horario: culto.horario },
      {
        $setOnInsert: {
          data_culto: culto.data,
          dia_semana: culto.diaSemana,
          horario: culto.horario,
          ministerios: [],
          status: 'rascunho',
          criado_em: new Date()
        }
      },
      { upsert: true }
    );
  }

  return db
    .collection('escalas')
    .find({ data_culto: { $regex: `^${ano}-${String(mes).padStart(2, '0')}` } })
    .sort({ data_culto: 1, horario: 1 })
    .toArray();
}

export async function statusDoMes(req, res) {
  try {
    const { ano, mes } = req.params;
    const db = getDB();

    const todosMinisterios = await db.collection('ministerios').find().toArray();
    const cultosDoMes = await garantirCultosDoMes(db, Number(ano), Number(mes));

    const idsProcessados = new Set();
    cultosDoMes.forEach((culto) => {
      culto.ministerios.forEach((min) => idsProcessados.add(String(min.ministerio_id)));
    });

    const ministeriosComStatus = todosMinisterios.map((min) => {
      let finalizado = false;
      for (const culto of cultosDoMes) {
        const bloco = culto.ministerios.find((m) => String(m.ministerio_id) === String(min._id));
        if (bloco) {
          finalizado = bloco.finalizado === true;
          break;
        }
      }

      return {
        _id: min._id,
        nome: min.nome,
        processado: idsProcessados.has(String(min._id)),
        finalizado
      };
    });

    res.status(200).json({
      total_cultos: cultosDoMes.length,
      ministerios: ministeriosComStatus
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar status do mês.' });
  }
}

export async function gerarParaMinisterio(req, res) {
  try {
    const { ano, mes, ministerio_id } = req.body;

    if (!ano || !mes || !ministerio_id) {
      return res.status(400).json({ error: 'Informe ano, mês e ministerio_id.' });
    }

    const db = getDB();
    const ministerio = await db.collection('ministerios').findOne({ _id: new ObjectId(ministerio_id) });

    if (!ministerio) {
      return res.status(404).json({ error: 'Ministério não encontrado.' });
    }

    const voluntarios = await db.collection('voluntarios').find().toArray();
    const cultosDoMes = await garantirCultosDoMes(db, Number(ano), Number(mes));

    const contagemDeEscalas = new Map();
    const resultado = [];

    for (const cultoDoc of cultosDoMes) {
      const jaExisteEsteMinisterio = cultoDoc.ministerios.some(
        (min) => String(min.ministerio_id) === String(ministerio._id)
      );
      
      if (jaExisteEsteMinisterio) {
        resultado.push({ data_culto: cultoDoc.data_culto, horario: cultoDoc.horario, aviso: 'Já processado, pulado.' });
        continue;
      }

      const voluntariosJaUsados = new Set();
      cultoDoc.ministerios.forEach((min) => {
        min.vagas_preenchidas.forEach((vaga) => {
          if (vaga.voluntario_id) voluntariosJaUsados.add(String(vaga.voluntario_id));
        });
      });

      const culto = { data: cultoDoc.data_culto, diaSemana: cultoDoc.dia_semana, horario: cultoDoc.horario };
      const vagasPreenchidas = [];

      for (const funcao of ministerio.funcoes_obrigatorias) {
        const candidatos = voluntarios.filter((voluntario) => {
          const pertenceAoMinisterio = (voluntario.ministerios || []).includes(ministerio.nome);
          const temAFuncao = (voluntario.funcoes || []).includes(funcao);
          const disponivel = estaDisponivel(voluntario, culto);
          const semRestricao = !possuiRestricao(voluntario, culto.data);
          const naoUsadoAinda = !voluntariosJaUsados.has(String(voluntario._id));

          return pertenceAoMinisterio && temAFuncao && disponivel && semRestricao && naoUsadoAinda;
        });

        if (candidatos.length === 0) {
          vagasPreenchidas.push({ funcao, voluntario_id: null, nome: 'VAGO' });
          continue;
        }

        const escolhido = escolherPorEquidade(candidatos, contagemDeEscalas);

        vagasPreenchidas.push({ funcao, voluntario_id: escolhido._id, nome: escolhido.nome });
        voluntariosJaUsados.add(String(escolhido._id));
        contagemDeEscalas.set(String(escolhido._id), (contagemDeEscalas.get(String(escolhido._id)) || 0) + 1);
      }

      const blocoMinisterio = {
        ministerio_id: ministerio._id,
        ministerio_nome: ministerio.nome,
        vagas_preenchidas: vagasPreenchidas,
        finalizado: false
      };

      await db.collection('escalas').updateOne(
        { _id: cultoDoc._id },
        { $push: { ministerios: blocoMinisterio }, $set: { atualizado_em: new Date() } }
      );

      resultado.push({ data_culto: cultoDoc.data_culto, horario: cultoDoc.horario, vagas_preenchidas: vagasPreenchidas });
    }

    res.status(201).json({
      message: `Ministério "${ministerio.nome}" processado para ${cultosDoMes.length} cultos.`,
      resultado
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao gerar escala do ministério.' });
  }
}

export async function desfazerMinisterio(req, res) {
  try {
    const { ano, mes, ministerioId } = req.params;
    const db = getDB();

    await db.collection('escalas').updateMany(
      { data_culto: { $regex: `^${ano}-${String(mes).padStart(2, '0')}` } },
      { $pull: { ministerios: { ministerio_id: new ObjectId(ministerioId) } } }
    );

    res.status(200).json({ message: 'Ministério removido da escala deste mês. Pode gerar novamente.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao desfazer ministério.' });
  }
}

export async function finalizarMinisterio(req, res) {
  try {
    const { ano, mes, ministerioId } = req.params;
    const db = getDB();

    const cultosDoMes = await db
      .collection('escalas')
      .find({ data_culto: { $regex: `^${ano}-${String(mes).padStart(2, '0')}` } })
      .sort({ data_culto: 1, horario: 1 })
      .toArray();

    const vagasAbertas = [];
    let ministerioFoiGerado = false;

    cultosDoMes.forEach((culto) => {
      const bloco = culto.ministerios.find((m) => String(m.ministerio_id) === ministerioId);
      if (!bloco) return;
      ministerioFoiGerado = true;

      bloco.vagas_preenchidas.forEach((vaga) => {
        if (vaga.nome === 'VAGO') {
          vagasAbertas.push(`${culto.data_culto} (${vaga.funcao})`);
        }
      });
    });

    if (!ministerioFoiGerado) {
      return res.status(400).json({ error: 'Gere a escala deste ministério antes de finalizar.' });
    }

    if (vagasAbertas.length > 0) {
      return res.status(400).json({
        error: `Não é possível finalizar: ainda há vagas em aberto em: ${vagasAbertas.join(', ')}`
      });
    }

    await db.collection('escalas').updateMany(
      {
        data_culto: { $regex: `^${ano}-${String(mes).padStart(2, '0')}` },
        'ministerios.ministerio_id': new ObjectId(ministerioId)
      },
      { $set: { 'ministerios.$[elem].finalizado': true } },
      { arrayFilters: [{ 'elem.ministerio_id': new ObjectId(ministerioId) }] }
    );

    res.status(200).json({ message: 'Ministério finalizado com sucesso para todo o mês.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao finalizar ministério.' });
  }
}

export async function reabrirMinisterio(req, res) {
  try {
    const { ano, mes, ministerioId } = req.params;
    const db = getDB();

    await db.collection('escalas').updateMany(
      {
        data_culto: { $regex: `^${ano}-${String(mes).padStart(2, '0')}` },
        'ministerios.ministerio_id': new ObjectId(ministerioId)
      },
      { $set: { 'ministerios.$[elem].finalizado': false } },
      { arrayFilters: [{ 'elem.ministerio_id': new ObjectId(ministerioId) }] }
    );

    res.status(200).json({ message: 'Ministério reaberto para edição.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao reabrir ministério.' });
  }
}

export async function listarEscalas(req, res) {
  try {
    const db = getDB();
    const { ano, mes } = req.query;

    const filtro = {};
    if (ano && mes) {
      const prefixo = `${ano}-${String(mes).padStart(2, '0')}`;
      filtro.data_culto = { $regex: `^${prefixo}` };
    }

    const escalas = await db.collection('escalas').find(filtro).sort({ data_culto: 1, horario: 1 }).toArray();
    res.status(200).json(escalas);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar escalas.' });
  }
}

export async function substituirVoluntarioNaVaga(req, res) {
  try {
    const { escalaId, ministerioId, funcao } = req.params;
    const { novo_voluntario_id, novo_nome, forcar } = req.body;

    const db = getDB();
    const escala = await db.collection('escalas').findOne({ _id: new ObjectId(escalaId) });

    if (!escala) {
      return res.status(404).json({ error: 'Escala não encontrada.' });
    }

    const blocoMinisterio = escala.ministerios.find((min) => String(min.ministerio_id) === ministerioId);
    if (blocoMinisterio && blocoMinisterio.finalizado) {
      return res.status(400).json({
        error: 'Este ministério já foi finalizado neste mês. Reabra-o para poder editar as vagas.'
      });
    }

    const hoje = new Date().toISOString().slice(0, 10);
    const ehEscalaPassada = escala.data_culto < hoje;
    if (ehEscalaPassada && !forcar) {
      return res.status(403).json({
        error: 'Esta escala já ocorreu. Envie "forcar: true" para confirmar a edição retroativa.'
      });
    }

    const ministerios = escala.ministerios.map((min) => {
      if (String(min.ministerio_id) !== ministerioId) return min;

      const vagas = min.vagas_preenchidas.map((vaga) => {
        if (vaga.funcao !== funcao) return vaga;
        return {
          funcao,
          voluntario_id: novo_voluntario_id ? new ObjectId(novo_voluntario_id) : null,
          nome: novo_nome || 'VAGO'
        };
      });

      return { ...min, vagas_preenchidas: vagas };
    });

    await db.collection('escalas').updateOne(
      { _id: new ObjectId(escalaId) },
      { $set: { ministerios, editado_em: new Date() } }
    );

    res.status(200).json({ message: 'Vaga atualizada com sucesso.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao substituir voluntário na vaga.' });
  }
}