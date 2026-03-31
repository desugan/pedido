import { PedidoRepository } from '../repositories/PedidoRepository';
import { ClienteRepository } from '../repositories/ClienteRepository';
import {
  Pedido,
  CreatePedidoInput,
  ItemPedido,
  CreateItemPedidoInput,
} from '../types/pedido';

const allowedStatus = ['confirmado', 'pago', 'cancelado'];

export class PedidoService {
  private repository = new PedidoRepository();
  private clienteRepository = new ClienteRepository();

  private calculatePedidoTotal(itens: CreateItemPedidoInput[]): number {
    return itens.reduce((acc, item) => acc + item.quantidade * item.precoUnitario, 0);
  }

  private calculateSaldoRestante(cliente: any): number {
    const financeiroRaw = cliente?.financeiro;
    const financeiro = Array.isArray(financeiroRaw)
      ? financeiroRaw[0] || null
      : financeiroRaw;
    if (!financeiro) {
      return 0;
    }

    const limiteCredito = Number(financeiro.limite_credito ?? 0);
    const saldoUtilizado = Number(financeiro.saldo_utilizado ?? 0);

    return limiteCredito - saldoUtilizado;
  }

  async createPedido(data: CreatePedidoInput): Promise<Pedido> {
    if (!data.clienteId || data.clienteId <= 0) {
      throw new Error('Cliente ID inválido');
    }

    if (!data.itens || data.itens.length === 0) {
      throw new Error('Pedido deve ter pelo menos um item');
    }

    const cliente = await this.clienteRepository.findById(data.clienteId);
    if (!cliente) {
      throw new Error('Cliente não encontrado');
    }

    const totalPedido = this.calculatePedidoTotal(data.itens);
    const saldoRestante = this.calculateSaldoRestante(cliente);

    if (saldoRestante < totalPedido) {
      throw new Error(
        `Saldo restante insuficiente para este pedido. Disponível: R$ ${saldoRestante.toFixed(2)} | Pedido: R$ ${totalPedido.toFixed(2)}`
      );
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
