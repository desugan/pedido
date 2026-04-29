const express = require('express');
const router = express.Router();
const relatorioController = require('../controllers/relatorioController');
const authMiddleware = require('../middleware/auth');

router.get('/pedidos', authMiddleware, relatorioController.relPedidos);
router.get('/pagamentos', authMiddleware, relatorioController.relPagamentos);
router.get('/clientes', authMiddleware, relatorioController.relClientes);
router.get('/vendas', authMiddleware, relatorioController.relVendas);
router.get('/usuario', authMiddleware, relatorioController.relUsuario);

module.exports = router;