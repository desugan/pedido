import { Router } from 'express';
import { UsuarioController } from '../controllers/UsuarioController';

const router = Router();
const controller = new UsuarioController();

router.get('/', controller.getAll.bind(controller));
router.get('/perfis', controller.getPerfis.bind(controller));
router.get('/:id', controller.getById.bind(controller));
router.post('/', controller.create.bind(controller));
router.put('/:id', controller.update.bind(controller));
router.delete('/:id', controller.delete.bind(controller));
router.post('/:id/reset-senha', controller.resetSenha.bind(controller));

export default router;
