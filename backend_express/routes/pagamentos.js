const express = require('express');
const router = express.Router();
const pagamentoController = require('../controllers/pagamentoController');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, pagamentoController.getAll);
router.get('/cliente/:clienteId', authMiddleware, pagamentoController.getByCliente);
router.get('/:id', authMiddleware, pagamentoController.getById);
router.post('/', authMiddleware, pagamentoController.create);
router.patch('/:id/status', authMiddleware, pagamentoController.updateStatus);

module.exports = router;