import { ClienteRepository } from '../repositories/ClienteRepository';
import { Cliente, CreateClienteInput, UpdateClienteInput } from '../types/cliente';

export class ClienteService {
  private repository = new ClienteRepository();

  async getAllClientes(): Promise<Cliente[]> {
    return this.repository.findAll();
  }

  async getClienteById(id: number): Promise<Cliente | null> {
    if (!id || id <= 0) {
      throw new Error('ID do cliente inválido');
    }

    const cliente = await this.repository.findById(id);
    if (!cliente) {
      throw new Error('Cliente não encontrado');
    }

    return cliente;
  }

  async createCliente(data: CreateClienteInput): Promise<Cliente> {
    if (!data.nome) {
      throw new Error('Nome é obrigatório');
    }

    if (!data.status) {
      data.status = 'ativo'; // default
    }

    if (typeof data.limite_credito !== 'undefined') {
      const limite = Number(data.limite_credito);
      if (Number.isNaN(limite) || limite < 0) {
        throw new Error('Limite de crédito inválido');
      }
      data.limite_credito = limite;
    }

    return this.repository.create(data);
  }

  async updateCliente(id: number, data: UpdateClienteInput): Promise<Cliente> {
    if (!id || id <= 0) {
      throw new Error('ID do cliente inválido');
    }

    // Verificar se cliente existe
    await this.getClienteById(id);

    const statusSolicitado = String(data.status || '').trim().toUpperCase();
    if (statusSolicitado) {
      const pedidosPendentes = await this.repository.countPedidosPendentes(id);

      // If there are pending orders, client cannot be regularized to ATIVO.
      if (statusSolicitado === 'ATIVO' && pedidosPendentes > 0) {
        throw new Error('Não é possível regularizar: cliente possui pedidos pendentes');
      }

      // If trying to inactivate while pending orders exist, keep as INADIMPLENTE.
      if (statusSolicitado === 'INATIVO' && pedidosPendentes > 0) {
        data.status = 'INADIMPLENTE';
      }
    }

    if (typeof data.limite_credito !== 'undefined') {
      const limite = Number(data.limite_credito);
      if (Number.isNaN(limite) || limite < 0) {
        throw new Error('Limite de crédito inválido');
      }
      data.limite_credito = limite;
    }

    return this.repository.update(id, data);
  }

  async deleteCliente(id: number): Promise<Cliente> {
    if (!id || id <= 0) {
      throw new Error('ID do cliente inválido');
    }

    // Verificar se cliente existe
    await this.getClienteById(id);

    const [usuarios, pedidos, pagamentos] = await Promise.all([
      this.repository.countUsuarios(id),
      this.repository.countPedidos(id),
      this.repository.countPagamentos(id),
    ]);

    if (usuarios > 0) {
      throw new Error('Cliente possui usuários vinculados e não pode ser excluído');
    }

    if (pedidos > 0 || pagamentos > 0) {
      throw new Error('Cliente possui pedidos/pagamentos vinculados e não pode ser excluído');
    }

    return this.repository.delete(id);
  }
}