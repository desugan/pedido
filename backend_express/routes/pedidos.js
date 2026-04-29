const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedidoController');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, pedidoController.getAll);
router.get('/cliente/:clienteId', authMiddleware, pedidoController.getByCliente);
router.get('/:id', authMiddleware, pedidoController.getById);
router.post('/', authMiddleware, pedidoController.create);
router.patch('/:id/status', authMiddleware, pedidoController.updateStatus);
router.delete('/:id', authMiddleware, pedidoController.delete);
router.get('/:id/itens', authMiddleware, pedidoController.getItens);
router.post('/:id/itens', authMiddleware, pedidoController.addItem);
router.delete('/:id/itens/:itemId', authMiddleware, pedidoController.removeItem);
router.get('/:id/total', authMiddleware, pedidoController.getTotal);

module.exports = router;