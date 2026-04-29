import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import clienteRoutes from './routes/clienteRoutes';
import pedidoRoutes from './routes/pedidoRoutes';
import pagamentoRoutes from './routes/pagamentoRoutes';
import relatorioRoutes from './routes/relatorioRoutes';
import authRoutes from './routes/authRoutes';
import produtoRoutes from './routes/produtoRoutes';
import usuarioRoutes from './routes/usuarioRoutes';
import fornecedorRoutes from './routes/fornecedorRoutes';
import lancamentoRoutes from './routes/lancamentoRoutes';
import configRoutes from './routes/configRoutes';
import { ensureParityTables } from './utils/bootstrapTables';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const prisma = new PrismaClient();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', async (_req: express.Request, res: express.Response) => {
  let database = false;

  try {
    await prisma.$queryRawUnsafe('SELECT 1');
    database = true;
  } catch {
    database = false;
  }

  res.status(database ? 200 : 503).json({
    api: true,
    database,
    status: database ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/clientes', clienteRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/pagamentos', pagamentoRoutes);
app.use('/api/relatorios', relatorioRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/produtos', produtoRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/fornecedores', fornecedorRoutes);
app.use('/api/lancamentos', lancamentoRoutes);
app.use('/api/config', configRoutes);

// Error handling
app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

async function startServer(): Promise<void> {
  try {
    await ensureParityTables();
    console.log('✓ Parity tables checked/created');
  } catch (error) {
    console.error('⚠ Falha ao verificar/criar tabelas de paridade:', error);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✓ Server running on http://0.0.0.0:${PORT}`);
    console.log(`✓ Accessible at http://192.168.1.49:${PORT}`);
    console.log(`✓ Environment: ${process.env.NODE_ENV}`);
  });
}

void startServer();
