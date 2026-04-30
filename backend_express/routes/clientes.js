const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, clienteController.getAll);
router.get('/:id', authMiddleware, clienteController.getById);
router.post('/', authMiddleware, clienteController.create);
router.put('/:id', authMiddleware, clienteController.update);

module.exports = router;