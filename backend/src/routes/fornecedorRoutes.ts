import { Router } from 'express';
import { FornecedorController } from '../controllers/FornecedorController';

const router = Router();
const controller = new FornecedorController();

router.get('/', controller.getAll.bind(controller));
router.get('/:id', controller.getById.bind(controller));
router.post('/', controller.create.bind(controller));
router.put('/:id', controller.update.bind(controller));
router.delete('/:id', controller.delete.bind(controller));

export default router;
