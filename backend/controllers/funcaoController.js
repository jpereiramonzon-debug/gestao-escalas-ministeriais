// Cadastro central de Funções (ex.: Baixista, Baterista, Operador de Áudio).
// Existe para que o cadastro de Ministério (UC02) não dependa mais de
// texto digitado livremente: o coordenador cadastra a função uma única
// vez aqui, e depois só MARCA quais funções cada ministério exige.
// Isso elimina na raiz o antigo bug de digitação (ex.: "Baixista" com
// grafia diferente em cada ministério).
import { getDB } from '../config/db.js';
import { ObjectId } from 'mongodb';

export async function listarFuncoes(req, res) {
  try {
    const db = getDB();
    const funcoes = await db.collection('funcoes').find().sort({ nome: 1 }).toArray();
    res.status(200).json(funcoes);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar funções.' });
  }
}

export async function criarFuncao(req, res) {
  try {
    const { nome } = req.body;

    if (!nome || !nome.trim()) {
      return res.status(400).json({ error: 'O nome da função é obrigatório.' });
    }

    const db = getDB();

    const jaExiste = await db.collection('funcoes').findOne({ nome: nome.trim() });
    if (jaExiste) {
      return res.status(400).json({ error: `A função "${nome.trim()}" já está cadastrada.` });
    }

    const novaFuncao = {
      nome: nome.trim(),
      criado_em: new Date()
    };

    const resultado = await db.collection('funcoes').insertOne(novaFuncao);
    res.status(201).json({ _id: resultado.insertedId, ...novaFuncao });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao cadastrar função.' });
  }
}

export async function atualizarFuncao(req, res) {
  try {
    const { id } = req.params;
    const { nome } = req.body;

    if (!nome || !nome.trim()) {
      return res.status(400).json({ error: 'O nome da função é obrigatório.' });
    }

    const db = getDB();
    const funcaoAtual = await db.collection('funcoes').findOne({ _id: new ObjectId(id) });

    if (!funcaoAtual) {
      return res.status(404).json({ error: 'Função não encontrada.' });
    }

    const nomeNovo = nome.trim();

    const resultado = await db.collection('funcoes').updateOne(
      { _id: new ObjectId(id) },
      { $set: { nome: nomeNovo, atualizado_em: new Date() } }
    );

    if (resultado.matchedCount === 0) {
      return res.status(404).json({ error: 'Função não encontrada.' });
    }

    // Mantém consistência: se o nome da função mudou, atualiza também
    // essa mesma string onde ela já está referenciada (funcoes_obrigatorias
    // dos ministérios e funcoes dos voluntários), para não "quebrar" os
    // vínculos existentes.
    if (funcaoAtual.nome !== nomeNovo) {
      await db.collection('ministerios').updateMany(
        { funcoes_obrigatorias: funcaoAtual.nome },
        { $set: { 'funcoes_obrigatorias.$[elem]': nomeNovo } },
        { arrayFilters: [{ elem: funcaoAtual.nome }] }
      );
      await db.collection('voluntarios').updateMany(
        { funcoes: funcaoAtual.nome },
        { $set: { 'funcoes.$[elem]': nomeNovo } },
        { arrayFilters: [{ elem: funcaoAtual.nome }] }
      );
    }

    res.status(200).json({ message: 'Função atualizada com sucesso.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar função.' });
  }
}

export async function deletarFuncao(req, res) {
  try {
    const { id } = req.params;
    const db = getDB();

    const funcao = await db.collection('funcoes').findOne({ _id: new ObjectId(id) });
    if (!funcao) {
      return res.status(404).json({ error: 'Função não encontrada.' });
    }

    const ministerioUsando = await db.collection('ministerios').findOne({ funcoes_obrigatorias: funcao.nome });
    if (ministerioUsando) {
      return res.status(400).json({
        error: `Não é possível excluir: a função "${funcao.nome}" está em uso no ministério "${ministerioUsando.nome}".`
      });
    }

    await db.collection('funcoes').deleteOne({ _id: new ObjectId(id) });
    res.status(200).json({ message: 'Função removida com sucesso.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover função.' });
  }
}
