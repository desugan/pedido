import { Router } from 'express';
import { ClienteController } from '../controllers/ClienteController';

const router = Router();
const clienteController = new ClienteController();

// GET /api/clientes - Listar todos os clientes
router.get('/', clienteController.getAllClientes.bind(clienteController));

// GET /api/clientes/:id - Buscar cliente por ID
router.get('/:id', clienteController.getClienteById.bind(clienteController));

// POST /api/clientes - Criar novo cliente
router.post('/', clienteController.createCliente.bind(clienteController));

// PUT /api/clientes/:id - Atualizar cliente
router.put('/:id', clienteController.updateCliente.bind(clienteController));

// DELETE /api/clientes/:id - Deletar cliente
router.delete('/:id', clienteController.deleteCliente.bind(clienteController));

export default router;