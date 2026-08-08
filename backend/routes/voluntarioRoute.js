// Atende ao UC01 (Manter Voluntários) - Requisito RF01 / Cap. 5 do TCC
import { Router } from 'express';
import { listarVoluntarios, criarVoluntario, deletarVoluntario } from '../controllers/voluntarioController.js';

const router = Router();

router.get('/', listarVoluntarios);
router.post('/', criarVoluntario);
router.delete('/:id', deletarVoluntario);

export default router;