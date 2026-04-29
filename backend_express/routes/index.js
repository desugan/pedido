const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'API Express rodando!' });
});

router.get('/exemplo', (req, res) => {
  res.json({ data: 'Exemplo de rota' });
});

module.exports = router;