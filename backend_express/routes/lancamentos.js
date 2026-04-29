const express = require('express');
const router = express.Router();
const lancamentoController = require('../controllers/lancamentoController');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, lancamentoController.getAll);
router.get('/:id', authMiddleware, lancamentoController.getById);
router.post('/', authMiddleware, lancamentoController.create);
router.patch('/:id/status', authMiddleware, lancamentoController.updateStatus);

module.exports = router;