// Atende ao Caso de Uso UC02 (Manter Ministérios) e Requisito Funcional RF02
import { getDB } from '../config/db.js';

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

    // RNF04 - Validação de segurança no back-end
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