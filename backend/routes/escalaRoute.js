import express from 'express';
import {
  statusDoMes,
  gerarParaMinisterio,
  desfazerMinisterio,
  finalizarMinisterio,
  reabrirMinisterio,
  listarEscalas,
  substituirVoluntarioNaVaga
} from '../controllers/escalaController.js';

const router = express.Router();

// Rotas básicas
router.get('/', listarEscalas);
router.post('/gerar', gerarParaMinisterio);

// Rotas com parâmetros de mês e ano
router.get('/mes/:ano/:mes/status', statusDoMes);
router.delete('/mes/:ano/:mes/ministerio/:ministerioId', desfazerMinisterio);
router.post('/mes/:ano/:mes/ministerio/:ministerioId/finalizar', finalizarMinisterio);
router.post('/mes/:ano/:mes/ministerio/:ministerioId/reabrir', reabrirMinisterio);

// Rota de edição de vaga
router.put('/:escalaId/ministerio/:ministerioId/funcao/:funcao', substituirVoluntarioNaVaga);

export default router;