import { Router } from 'express';
import {
  listarMinisterios,
  criarMinisterio,
  atualizarMinisterio,
  deletarMinisterio
} from '../controllers/ministerioController.js';

const router = Router();

router.get('/', listarMinisterios);
router.post('/', criarMinisterio);
router.put('/:id', atualizarMinisterio);
router.delete('/:id', deletarMinisterio);

export default router;