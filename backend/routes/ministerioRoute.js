// Atende ao UC02 (Manter Ministérios) - Requisito RF02 / Cap. 5 do TCC
import { Router } from 'express';
import { listarMinisterios, criarMinisterio } from '../controllers/ministerioController.js';

const router = Router();

router.get('/', listarMinisterios);
router.post('/', criarMinisterio);

export default router;