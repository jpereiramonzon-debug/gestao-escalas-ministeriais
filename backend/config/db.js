import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ [ERRO] A variável MONGO_URI não está definida no arquivo .env');
  process.exit(1);
}

console.log(MONGO_URI);
const client = new MongoClient(MONGO_URI);
let dbInstance = null;

export async function connectDB() {
  if (dbInstance) return dbInstance;

  try {
    await client.connect();
    dbInstance = client.db('gestao_escalas');
    console.log('✅ [MongoDB Atlas] Conectado com sucesso ao banco de dados NoSQL!');
    return dbInstance;
  } catch (error) {
    console.error('❌ [MongoDB Atlas] Erro crítico na conexão com o banco de dados:', error);
    process.exit(1);
  }
}

export function getDB() {
  if (!dbInstance) throw new Error('O banco de dados não foi inicializado.');
  return dbInstance;
}