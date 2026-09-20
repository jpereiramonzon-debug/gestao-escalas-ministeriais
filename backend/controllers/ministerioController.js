// Atende ao Caso de Uso UC02 (Manter Ministérios) e Requisito Funcional RF02
import { getDB } from '../config/db.js';
import { ObjectId } from 'mongodb';

export async function listarMinisterios(req, res) {
  try {
    const db = getDB();
    const ministerios = await db.collection('ministerios').find().toArray();
    res.status(200).json(ministerios);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar ministérios.' });
  }
}

export async function criarMinisterio(req, res) {
  try {
    const { nome, funcoes_obrigatorias } = req.body;

    if (!nome || !Array.isArray(funcoes_obrigatorias) || funcoes_obrigatorias.length === 0) {
      return res.status(400).json({ error: 'Nome e funções obrigatórias são requeridos.' });
    }

    const db = getDB();
    const novoMinisterio = {
      nome,
      funcoes_obrigatorias,
      criado_em: new Date()
    };

    const resultado = await db.collection('ministerios').insertOne(novoMinisterio);
    res.status(201).json({ _id: resultado.insertedId, ...novoMinisterio });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao cadastrar ministério.' });
  }
}

export async function atualizarMinisterio(req, res) {
  try {
    const { id } = req.params;
    const { nome, funcoes_obrigatorias } = req.body;

    if (!nome || !Array.isArray(funcoes_obrigatorias) || funcoes_obrigatorias.length === 0) {
      return res.status(400).json({ error: 'Nome e funções obrigatórias são requeridos.' });
    }

    const db = getDB();
    const resultado = await db.collection('ministerios').updateOne(
      { _id: new ObjectId(id) },
      { $set: { nome, funcoes_obrigatorias, atualizado_em: new Date() } }
    );

    if (resultado.matchedCount === 0) {
      return res.status(404).json({ error: 'Ministério não encontrado.' });
    }

    res.status(200).json({ message: 'Ministério atualizado com sucesso.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar ministério.' });
  }
}

export async function deletarMinisterio(req, res) {
  try {
    const { id } = req.params;
    const db = getDB();
    const resultado = await db.collection('ministerios').deleteOne({ _id: new ObjectId(id) });

    if (resultado.deletedCount === 0) {
      return res.status(404).json({ error: 'Ministério não encontrado.' });
    }

    res.status(200).json({ message: 'Ministério removido com sucesso.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover ministério.' });
  }
}