const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');
const authMiddleware = require('../middleware/auth');

router.get('/pix-key', authMiddleware, configController.getPixKey);
router.put('/pix-key', authMiddleware, configController.setPixKey);
router.get('/pix-nome', authMiddleware, configController.getPixNome);
router.put('/pix-nome', authMiddleware, configController.setPixNome);

module.exports = router;