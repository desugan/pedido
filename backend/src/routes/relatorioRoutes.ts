import { Router } from 'express';
import { RelatorioController } from '../controllers/RelatorioController';

const router = Router();
const controller = new RelatorioController();

router.get('/pedidos', controller.relatorioPedidos.bind(controller));
router.get('/pagamentos', controller.relatorioPagamentos.bind(controller));
router.get('/clientes', controller.relatorioClientes.bind(controller));
router.get('/vendas', controller.relatorioVendas.bind(controller));
router.get('/usuario', controller.relatorioUsuario.bind(controller));

export default router;
