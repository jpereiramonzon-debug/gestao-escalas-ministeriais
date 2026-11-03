import { Router } from 'express';
import {
  listarFuncoes,
  criarFuncao,
  atualizarFuncao,
  deletarFuncao
} from '../controllers/funcaoController.js';

const router = Router();

router.get('/', listarFuncoes);
router.post('/', criarFuncao);
router.put('/:id', atualizarFuncao);
router.delete('/:id', deletarFuncao);

export default router;
