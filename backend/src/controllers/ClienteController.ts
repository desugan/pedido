import { Request, Response } from 'express';
import { ClienteService } from '../services/ClienteService';

export class ClienteController {
  private service = new ClienteService();

  async getAllClientes(_req: Request, res: Response): Promise<void> {
    try {
      const clientes = await this.service.getAllClientes();
      res.json(clientes);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async getClienteById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const cliente = await this.service.getClienteById(id);

      if (!cliente) {
        res.status(404).json({ error: 'Cliente não encontrado' });
        return;
      }

      res.json(cliente);
    } catch (error) {
      console.error('Erro ao buscar cliente:', error);
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(400).json({ error: message });
    }
  }

  async createCliente(req: Request, res: Response): Promise<void> {
    try {
      const clienteData = req.body;
      const cliente = await this.service.createCliente(clienteData);
      res.status(201).json(cliente);
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      const status = message.includes('obrigatórios') || message.includes('inválido') ? 400 : 500;
      res.status(status).json({ error: message });
    }
  }

  async updateCliente(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const clienteData = req.body;
      const cliente = await this.service.updateCliente(id, clienteData);
      res.json(cliente);
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      const status = message.includes('não encontrado') || message.includes('inválido') ? 404 : 500;
      res.status(status).json({ error: message });
    }
  }

  async deleteCliente(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const cliente = await this.service.deleteCliente(id);
      res.json({ message: 'Cliente deletado com sucesso', cliente });
    } catch (error) {
      console.error('Erro ao deletar cliente:', error);
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      const isNotFound = message.includes('não encontrado') || message.includes('inválido');
      const isBusinessRule = message.includes('não pode ser excluído') || message.includes('vinculado');
      const status = isNotFound ? 404 : isBusinessRule ? 400 : 500;
      res.status(status).json({ error: message });
    }
  }
}