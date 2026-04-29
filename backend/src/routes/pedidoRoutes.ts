import { Router } from 'express';
import { PedidoController } from '../controllers/PedidoController';

const router = Router();
const controller = new PedidoController();

router.get('/', controller.getAllPedidos.bind(controller));
router.get('/:id', controller.getPedidoById.bind(controller));
router.post('/', controller.createPedido.bind(controller));
router.patch('/:id/status', controller.updatePedidoStatus.bind(controller));
router.delete('/:id', controller.deletePedido.bind(controller));
router.post('/:id/itens', controller.addItemToPedido.bind(controller));
router.delete('/:id/itens/:itemId', controller.removeItemFromPedido.bind(controller));
router.get('/:id/itens', controller.getItemsByPedidoId.bind(controller));
router.get('/:id/total', controller.calculateTotal.bind(controller));
router.get('/cliente/:clienteId', controller.getPedidosByClienteId.bind(controller));

export default router;
