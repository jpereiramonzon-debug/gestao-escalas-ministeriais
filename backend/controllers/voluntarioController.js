// Atende ao Caso de Uso UC01 (Manter Voluntários) e Requisito Funcional RF01
// Modelagem NoSQL (Cap 4.4): Dados e disponibilidades como subdocumentos embutidos
import { getDB } from '../config/db.js';
import { ObjectId } from 'mongodb';

export async function listarVoluntarios(req, res) {
  try {
    const db = getDB();
    const voluntarios = await db.collection('voluntarios').find().toArray();
    res.status(200).json(voluntarios);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar voluntários.' });
  }
}

// RNF04 - Validação em camada: confirma que o ministério existe e que
// todas as funções informadas realmente pertencem a ele (evita
// "Baixista no Diaconato" quando Baixista só existe no Louvor).
async function validarMinisterioEFuncoes(db, nomeMinisterio, funcoes) {
  const ministerio = await db.collection('ministerios').findOne({ nome: nomeMinisterio });

  if (!ministerio) {
    return { valido: false, erro: `O ministério "${nomeMinisterio}" não existe. Cadastre-o antes.` };
  }

  const funcoesInvalidas = (funcoes || []).filter(
    (funcao) => !ministerio.funcoes_obrigatorias.includes(funcao)
  );

  if (funcoesInvalidas.length > 0) {
    return {
      valido: false,
      erro: `As funções [${funcoesInvalidas.join(', ')}] não existem no ministério "${nomeMinisterio}". Funções cadastradas nesse ministério: [${ministerio.funcoes_obrigatorias.join(', ')}]`
    };
  }

  return { valido: true };
}

export async function criarVoluntario(req, res) {
  try {
    const { nome, ministerios, funcoes, disponibilidades, restricoes } = req.body;

    if (!nome || !ministerios || ministerios.length === 0) {
      return res.status(400).json({ error: 'Nome e ao menos um ministério são obrigatórios.' });
    }

    const db = getDB();

    for (const nomeMinisterio of ministerios) {
      const validacao = await validarMinisterioEFuncoes(db, nomeMinisterio, funcoes);
      if (!validacao.valido) {
        return res.status(400).json({ error: validacao.erro });
      }
    }

    const novoVoluntario = {
      nome,
      ministerios: ministerios || [],
      funcoes: funcoes || [],
      disponibilidades: disponibilidades || [],
      restricoes: restricoes || [],
      criado_em: new Date()
    };

    const resultado = await db.collection('voluntarios').insertOne(novoVoluntario);
    res.status(201).json({ _id: resultado.insertedId, ...novoVoluntario });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao cadastrar voluntario.' });
  }
}

export async function atualizarVoluntario(req, res) {
  try {
    const { id } = req.params;
    const { nome, ministerios, funcoes, disponibilidades, restricoes } = req.body;

    if (!nome || !ministerios || ministerios.length === 0) {
      return res.status(400).json({ error: 'Nome e ao menos um ministério são obrigatórios.' });
    }

    const db = getDB();

    for (const nomeMinisterio of ministerios) {
      const validacao = await validarMinisterioEFuncoes(db, nomeMinisterio, funcoes);
      if (!validacao.valido) {
        return res.status(400).json({ error: validacao.erro });
      }
    }

    const resultado = await db.collection('voluntarios').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          nome,
          ministerios,
          funcoes: funcoes || [],
          disponibilidades: disponibilidades || [],
          restricoes: restricoes || [],
          atualizado_em: new Date()
        }
      }
    );

    if (resultado.matchedCount === 0) {
      return res.status(404).json({ error: 'Voluntário não encontrado.' });
    }

    res.status(200).json({ message: 'Voluntário atualizado com sucesso.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar voluntário.' });
  }
}

export async function deletarVoluntario(req, res) {
  try {
    const { id } = req.params;
    const db = getDB();
    const resultado = await db.collection('voluntarios').deleteOne({ _id: new ObjectId(id) });

    if (resultado.deletedCount === 0) {
      return res.status(404).json({ error: 'Voluntário não encontrado.' });
    }

    res.status(200).json({ message: 'Voluntário removido com sucesso.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover voluntário.' });
  }
}