import { PagamentoRepository } from '../repositories/PagamentoRepository';
import {
  Pagamento,
  CreatePagamentoInput,
  UpdatePagamentoInput,
} from '../types/pagamento';

const allowedStatus = ['pendente', 'aprovado', 'rejeitado', 'cancelado', 'excluido'];

export class PagamentoService {
  private repository = new PagamentoRepository();

  async createPagamento(data: CreatePagamentoInput): Promise<Pagamento> {
    if (!data.id_cliente || data.id_cliente <= 0) {
      throw new Error('Cliente ID inválido');
    }

    if (!data.valor || data.valor <= 0) {
      throw new Error('Valor deve ser maior que zero');
    }

    if (!data.qrcode || !data.chavepix) {
      throw new Error('QR Code e Chave PIX são obrigatórios');
    }

    if (data.pedidoIds?.some((pedidoId) => !pedidoId || pedidoId <= 0)) {
      throw new Error('Pedido ID inválido');
    }

    return this.repository.create(data);
  }

  async getPagamentoById(id: number): Promise<Pagamento | null> {
    if (!id || id <= 0) {
      throw new Error('ID inválido');
    }

    return this.repository.findById(id);
  }

  async getPagamentosByClienteId(clienteId: number): Promise<Pagamento[]> {
    if (!clienteId || clienteId <= 0) {
      throw new Error('Cliente ID inválido');
    }

    return this.repository.findByClienteId(clienteId);
  }

  async getAllPagamentos(status?: string): Promise<Pagamento[]> {
    if (status && !allowedStatus.includes(status)) {
      throw new Error('Status inválido');
    }

    return this.repository.findAll(status);
  }

  async updatePagamentoStatus(id: number, status: string): Promise<Pagamento | null> {
    if (!id || id <= 0) {
      throw new Error('ID inválido');
    }

    if (!allowedStatus.includes(status)) {
      throw new Error('Status inválido');
    }

    const updateData: UpdatePagamentoInput = { status: status as any };
    if (status === 'aprovado') {
      updateData.data_pagamento = new Date();
    }

    return this.repository.update(id, updateData);
  }

  async deletePagamento(id: number): Promise<boolean> {
    if (!id || id <= 0) {
      throw new Error('ID inválido');
    }

    return this.repository.delete(id);
  }
}