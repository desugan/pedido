import { PedidoRepository } from '../repositories/PedidoRepository';
import {
  Pedido,
  CreatePedidoInput,
  ItemPedido,
  CreateItemPedidoInput,
} from '../types/pedido';

const allowedStatus = ['pendente', 'confirmado', 'pronto', 'entregue', 'cancelado'];

export class PedidoService {
  private repository = new PedidoRepository();

  async createPedido(data: CreatePedidoInput): Promise<Pedido> {
    if (!data.clienteId || data.clienteId <= 0) {
      throw new Error('Cliente ID inválido');
    }

    if (!data.itens || data.itens.length === 0) {
      throw new Error('Pedido deve ter pelo menos um item');
    }

    return this.repository.create(data);
  }

  async getPedidoById(id: number): Promise<Pedido | null> {
    if (!id || id <= 0) {
      throw new Error('ID inválido');
    }

    return this.repository.findById(id);
  }

  async getPedidosByClienteId(clienteId: number): Promise<Pedido[]> {
    if (!clienteId || clienteId <= 0) {
      throw new Error('Cliente ID inválido');
    }

    return this.repository.findByClienteId(clienteId);
  }

  async getAllPedidos(status?: string): Promise<Pedido[]> {
    if (status && !allowedStatus.includes(status)) {
      throw new Error('Status inválido');
    }

    return this.repository.findAll(status);
  }

  async updatePedidoStatus(id: number, status: string): Promise<Pedido | null> {
    if (!id || id <= 0) {
      throw new Error('ID inválido');
    }

    if (!allowedStatus.includes(status)) {
      throw new Error('Status inválido');
    }

    return this.repository.update(id, { status: status as any });
  }

  async deletePedido(id: number): Promise<boolean> {
    if (!id || id <= 0) {
      throw new Error('ID inválido');
    }

    return this.repository.delete(id);
  }

  async addItemToPedido(pedidoId: number, item: CreateItemPedidoInput): Promise<ItemPedido> {
    if (!pedidoId || pedidoId <= 0) {
      throw new Error('Pedido ID inválido');
    }

    if (!item.quantidade || item.quantidade <= 0) {
      throw new Error('Quantidade deve ser maior que zero');
    }

    if (item.precoUnitario < 0) {
      throw new Error('Preço não pode ser negativo');
    }

    return this.repository.addItem(pedidoId, item);
  }

  async removeItemFromPedido(pedidoId: number, itemId: number): Promise<boolean> {
    if (!pedidoId || pedidoId <= 0) {
      throw new Error('Pedido ID inválido');
    }

    if (!itemId || itemId <= 0) {
      throw new Error('Item ID inválido');
    }

    return this.repository.removeItem(pedidoId, itemId);
  }

  async calculateTotal(pedidoId: number): Promise<number> {
    if (!pedidoId || pedidoId <= 0) {
      throw new Error('Pedido ID inválido');
    }

    return this.repository.calculateTotal(pedidoId);
  }

  async getItemsByPedidoId(pedidoId: number): Promise<ItemPedido[]> {
    if (!pedidoId || pedidoId <= 0) {
      throw new Error('Pedido ID inválido');
    }

    return this.repository.getItemsByPedidoId(pedidoId);
  }
}
