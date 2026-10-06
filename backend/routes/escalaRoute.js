import { Router } from 'express';
import {
  statusDoMes,
  gerarParaMinisterio,
  desfazerMinisterio,
  listarEscalas,
  substituirVoluntarioNaVaga,
  finalizarEscala
} from '../controllers/escalaController.js';

const router = Router();

router.get('/mes/:ano/:mes/status', statusDoMes);
router.post('/gerar-ministerio', gerarParaMinisterio);
router.delete('/mes/:ano/:mes/ministerio/:ministerioId', desfazerMinisterio);
router.get('/', listarEscalas);
router.put('/:escalaId/ministerio/:ministerioId/funcao/:funcao', substituirVoluntarioNaVaga);
router.post('/:escalaId/finalizar', finalizarEscala);

export default router;