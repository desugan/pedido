import { Router } from 'express';
import { PagamentoController } from '../controllers/PagamentoController';

const router = Router();
const controller = new PagamentoController();

router.get('/', controller.getAllPagamentos.bind(controller));
router.get('/cliente/:clienteId', controller.getPagamentosByClienteId.bind(controller));
router.get('/:id', controller.getPagamentoById.bind(controller));
router.post('/', controller.createPagamento.bind(controller));
router.patch('/:id/status', controller.updatePagamentoStatus.bind(controller));
router.delete('/:id', controller.deletePagamento.bind(controller));

export default router;