require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const pagination = require('./middleware/pagination');

const routes = require('./routes');
const authRoutes = require('./routes/auth');
const usuarioRoutes = require('./routes/usuarios');
const clienteRoutes = require('./routes/clientes');
const produtoRoutes = require('./routes/produtos');
const pedidoRoutes = require('./routes/pedidos');
const fornecedorRoutes = require('./routes/fornecedores');
const lancamentoRoutes = require('./routes/lancamentos');
const pagamentoRoutes = require('./routes/pagamentos');
const relatorioRoutes = require('./routes/relatorios');
const configRoutes = require('./routes/config');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(compression());
app.use(cors());
app.use(express.json());

const paginatedRoutes = [
  '/api/usuarios',
  '/api/clientes',
  '/api/produtos',
  '/api/pedidos',
  '/api/fornecedores',
  '/api/lancamentos',
  '/api/pagamentos'
];

app.use((req, res, next) => {
  if (paginatedRoutes.some(r => req.path.startsWith(r))) {
    return pagination(50, 100)(req, res, next);
  }
  next();
});

app.use('/api', routes);
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/produtos', produtoRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/fornecedores', fornecedorRoutes);
app.use('/api/lancamentos', lancamentoRoutes);
app.use('/api/pagamentos', pagamentoRoutes);
app.use('/api/relatorios', relatorioRoutes);
app.use('/api/config', configRoutes);

app.get('/health', (req, res) => {
  res.json({ api: true, database: true, status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ api: true, database: true, status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/debug/tables', async (req, res) => {
  const prisma = require('./db/prisma');
  try {
    const [usuario, perfil, pedido_item, lancamento_item, pagamentopedido, financeiro] = await Promise.all([
      prisma.$queryRaw`DESCRIBE usuario`,
      prisma.$queryRaw`DESCRIBE perfil`,
      prisma.$queryRaw`DESCRIBE pedido_item`,
      prisma.$queryRaw`DESCRIBE lancamento_item`,
      prisma.$queryRaw`DESCRIBE pagamentopedido`,
      prisma.$queryRaw`DESCRIBE financeiro`
    ]);
    res.json({ usuario, perfil, pedido_item, lancamento_item, pagamentopedido, financeiro });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/debug/rel-usuario', async (req, res) => {
  const prisma = require('./db/prisma');
  try {
    const id_cliente = parseInt(req.query.id_cliente) || 1;
    const cliente = await prisma.cliente.findUnique({ where: { id_cliente } });
    res.json({ cliente });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/debug/lancamento-item', async (req, res) => {
  const prisma = require('./db/prisma');
  try {
    const result = await prisma.$queryRaw`DESCRIBE lancamento_item`;
    res.json({ lancamento_item: result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/debug/pagamento-status', async (req, res) => {
  const prisma = require('./db/prisma');
  try {
    const result = await prisma.$queryRaw`DESCRIBE pagamento`;
    res.json({ pagamento: result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/debug/test-create', async (req, res) => {
  const prisma = require('./db/prisma');
  try {
    const { id_cliente, valor, qrcode, chavepix, pedidoIds } = req.body;
    res.json({ received: { id_cliente, valor, qrcode, chavepix, pedidoIds } });
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

app.get('/api/debug/delete-pagamentos', async (req, res) => {
  const prisma = require('./db/prisma');
  try {
    // Delete pagamentopedido first
    await prisma.$queryRaw`DELETE FROM pagamentopedido WHERE id_pagamento >= 478 AND id_pagamento <= 490`;
    // Then delete pagamentos
    await prisma.$queryRaw`DELETE FROM pagamento WHERE id_pagamento >= 478 AND id_pagamento <= 490`;
    res.json({ success: true, message: 'Deleted pagamentos 478-490' });
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});