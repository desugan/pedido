import api from './api';

export interface CreatePagamentoData {
  valor: number;
  qrcode: string;
  chavepix: string;
  id_cliente: number;
  pedidoIds?: number[];
}

export interface Pagamento {
  id_pagamento: number;
  valor: number;
  qrcode: string;
  chavepix: string;
  status: 'pendente' | 'aprovado' | 'rejeitado' | 'cancelado' | 'excluido';
  data_criacao: string;
  id_cliente: number;
  data_pagamento?: string;
  cliente?: any;
  pagamentopedido?: any[];
}

export const pagamentoService = {
  async getAllPagamentos(status?: string): Promise<Pagamento[]> {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    const response = await api.get(`/api/pagamentos${query}`);
    return response.data;
  },

  async getPagamentoById(id: number): Promise<Pagamento> {
    const response = await api.get(`/api/pagamentos/${id}`);
    return response.data;
  },

  async getPagamentosByClienteId(clienteId: number): Promise<Pagamento[]> {
    const response = await api.get(`/api/pagamentos/cliente/${clienteId}`);
    return response.data;
  },

  async createPagamento(data: CreatePagamentoData): Promise<Pagamento> {
    const response = await api.post('/api/pagamentos', data);
    return response.data;
  },

  async updatePagamentoStatus(id: number, status: string): Promise<Pagamento> {
    const response = await api.patch(`/api/pagamentos/${id}/status`, { status });
    return response.data;
  },

  async deletePagamento(id: number): Promise<void> {
    await api.delete(`/api/pagamentos/${id}`);
  },
};