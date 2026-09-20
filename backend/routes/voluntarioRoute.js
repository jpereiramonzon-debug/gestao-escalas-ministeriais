import { Router } from 'express';
import {
  listarVoluntarios,
  criarVoluntario,
  atualizarVoluntario,
  deletarVoluntario
} from '../controllers/voluntarioController.js';

const router = Router();

router.get('/', listarVoluntarios);
router.post('/', criarVoluntario);
router.put('/:id', atualizarVoluntario);
router.delete('/:id', deletarVoluntario);

export default router;