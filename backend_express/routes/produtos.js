const express = require('express');
const router = express.Router();
const produtoController = require('../controllers/produtoController');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, produtoController.getAll);
router.get('/:id', authMiddleware, produtoController.getById);
router.post('/', authMiddleware, produtoController.create);
router.put('/:id', authMiddleware, produtoController.update);

module.exports = router;