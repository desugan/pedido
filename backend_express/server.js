require('dotenv').config();
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
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});