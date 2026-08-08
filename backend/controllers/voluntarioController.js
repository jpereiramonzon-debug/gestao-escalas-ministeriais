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

export async function criarVoluntario(req, res) {
  try {
    const { nome, ministerios, funcoes, disponibilidades, restricoes } = req.body;

    // RNF04 - Validação no Back-end
    if (!nome || !ministerios || ministerios.length === 0) {
      return res.status(400).json({ error: 'Nome e ao menos um ministério são obrigatórios.' });
    }

    const db = getDB();
    const novoVoluntario = {
      nome,
      ministerios: ministerios || [],
      funcoes: funcoes || [],
      disponibilidades: disponibilidades || [], // Subdocumentos embutidos
      restricoes: restricoes || [],             // Subdocumentos embutidos
      criado_em: new Date()
    };

    const resultado = await db.collection('voluntarios').insertOne(novoVoluntario);
    res.status(201).json({ _id: resultado.insertedId, ...novoVoluntario });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao cadastrar voluntario.' });
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