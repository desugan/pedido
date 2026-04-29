const express = require('express');
const router = express.Router();
const fornecedorController = require('../controllers/fornecedorController');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, fornecedorController.getAll);
router.get('/:id', authMiddleware, fornecedorController.getById);
router.post('/', authMiddleware, fornecedorController.create);
router.put('/:id', authMiddleware, fornecedorController.update);
router.delete('/:id', authMiddleware, fornecedorController.delete);

module.exports = router;