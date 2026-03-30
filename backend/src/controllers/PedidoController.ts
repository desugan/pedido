import { Request, Response } from 'express';
import { PedidoService } from '../services/PedidoService';

export class PedidoController {
  private service = new PedidoService();

  async createPedido(req: Request, res: Response): Promise<void> {
    try {
      const pedido = await this.service.createPedido(req.body);
      res.status(201).json(pedido);
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(message.includes('inválido') || message.includes('deve') ? 400 : 500).json({ error: message });
    }
  }

  async getPedidoById(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const pedido = await this.service.getPedidoById(id);

      if (!pedido) {
        res.status(404).json({ error: 'Pedido não encontrado' });
        return;
      }

      res.json(pedido);
    } catch (error) {
      console.error('Erro ao buscar pedido:', error);
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(400).json({ error: message });
    }
  }

  async getAllPedidos(req: Request, res: Response): Promise<void> {
    try {
      const status = req.query.status as string | undefined;
      const pedidos = await this.service.getAllPedidos(status);
      res.json(pedidos);
    } catch (error) {
      console.error('Erro ao listar pedidos:', error);
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(400).json({ error: message });
    }
  }

  async getPedidosByClienteId(req: Request, res: Response): Promise<void> {
    try {
      const clienteId = Number(req.params.clienteId);
      const pedidos = await this.service.getPedidosByClienteId(clienteId);
      res.json(pedidos);
    } catch (error) {
      console.error('Erro ao buscar pedidos do cliente:', error);
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(400).json({ error: message });
    }
  }

  async updatePedidoStatus(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const status = req.body.status;
      const updated = await this.service.updatePedidoStatus(id, status);

      if (!updated) {
        res.status(404).json({ error: 'Pedido não encontrado' });
        return;
      }

      res.json(updated);
    } catch (error) {
      console.error('Erro ao atualizar status do pedido:', error);
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(400).json({ error: message });
    }
  }

  async deletePedido(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const success = await this.service.deletePedido(id);

      if (!success) {
        res.status(404).json({ error: 'Pedido não encontrado' });
        return;
      }

      res.json({ message: 'Pedido deletado com sucesso' });
    } catch (error) {
      console.error('Erro ao deletar pedido:', error);
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(400).json({ error: message });
    }
  }

  async addItemToPedido(req: Request, res: Response): Promise<void> {
    try {
      const pedidoId = Number(req.params.id);
      const item = req.body;
      const createdItem = await this.service.addItemToPedido(pedidoId, item);
      res.status(201).json(createdItem);
    } catch (error) {
      console.error('Erro ao adicionar item ao pedido:', error);
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(400).json({ error: message });
    }
  }

  async removeItemFromPedido(req: Request, res: Response): Promise<void> {
    try {
      const pedidoId = Number(req.params.id);
      const itemId = Number(req.params.itemId);
      const success = await this.service.removeItemFromPedido(pedidoId, itemId);

      if (!success) {
        res.status(404).json({ error: 'Item não encontrado no pedido' });
        return;
      }

      res.json({ message: 'Item removido com sucesso' });
    } catch (error) {
      console.error('Erro ao remover item do pedido:', error);
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(400).json({ error: message });
    }
  }

  async getItemsByPedidoId(req: Request, res: Response): Promise<void> {
    try {
      const pedidoId = Number(req.params.id);
      const itens = await this.service.getItemsByPedidoId(pedidoId);
      res.json(itens);
    } catch (error) {
      console.error('Erro ao buscar itens do pedido:', error);
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(400).json({ error: message });
    }
  }

  async calculateTotal(req: Request, res: Response): Promise<void> {
    try {
      const pedidoId = Number(req.params.id);
      const total = await this.service.calculateTotal(pedidoId);
      res.json({ total });
    } catch (error) {
      console.error('Erro ao calcular total do pedido:', error);
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(400).json({ error: message });
    }
  }
}
