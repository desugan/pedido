import { Router } from 'express';
import { LancamentoController } from '../controllers/LancamentoController';

const router = Router();
const controller = new LancamentoController();

router.get('/', controller.getAll.bind(controller));
router.get('/:id', controller.getById.bind(controller));
router.post('/', controller.create.bind(controller));
router.patch('/:id/status', controller.updateStatus.bind(controller));

export default router;
