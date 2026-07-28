import api from './api';
import { mapperPagamento } from '../mapper/mapperPagamento';

export interface CreatePagamentoData {
  valor: number;
  qrcode: string;
  chavepix: string;
  id_cliente: number;
  pedidoIds?: number[];
}

export interface Pagamento {
  id_pagamento: number;
  pedidoId: number | null;
  pedidoIds: number[];
  data: string | null;
  valor: number;
  status: string;
  clienteNome: string;
  chavepix: string;
  qrcode: string;
}

export const pagamentoService = {
  /**
   * Lista pagamentos paginados.
   * @param {number} page - Pagina.
   * @param {number} limit - Itens por pagina.
   * @param {string} [q] - Termo de busca.
   * @param {string} [status] - Filtrar por status.
   * @returns {Promise<{data: Pagamento[], total: number}>}
   */
  async getAllPagamentos(page = 1, limit = 10, q?: string, status?: string): Promise<{ data: Pagamento[]; total: number }> {
    const params: any = { page, limit };
    if (q) params.q = q;
    if (status) params.status = status;
    const response = await api.get('/api/pagamentos', { params });
    return { data: (response.data.data || []).map(mapperPagamento), total: response.data.total ?? 0 };
  },

  /**
   * Obtem um pagamento pelo ID.
   * @param {number} id - ID do pagamento.
   * @returns {Promise<Pagamento>}
   */
  async getPagamentoById(id: number): Promise<Pagamento> {
    const response = await api.get(`/api/pagamentos/${id}`);
    return mapperPagamento(response.data);
  },

  /**
   * Lista pagamentos de um cliente.
   * @param {number} clienteId - ID do cliente.
   * @returns {Promise<Pagamento[]>}
   */
  async getPagamentosByClienteId(clienteId: number): Promise<Pagamento[]> {
    const response = await api.get(`/api/pagamentos/cliente/${clienteId}`);
    return (response.data || []).map(mapperPagamento);
  },

  /**
   * Cria um novo pagamento.
   * @param {CreatePagamentoData} data - Dados do pagamento.
   * @returns {Promise<Pagamento>}
   */
  async createPagamento(data: CreatePagamentoData): Promise<Pagamento> {
    const payload: any = {
      valor: data.valor,
      qrcode: data.qrcode || '',
      chavepix: data.chavepix || '',
      id_cliente: data.id_cliente,
      pedido_ids: data.pedidoIds,
    };
    const response = await api.post('/api/pagamentos', payload);
    return response.data;
  },

  /**
   * Atualiza o status de um pagamento.
   * @param {number} id - ID do pagamento.
   * @param {string} status - Novo status.
   * @returns {Promise<Pagamento>}
   */
  async updatePagamentoStatus(id: number, status: string): Promise<Pagamento> {
    const response = await api.patch(`/api/pagamentos/${id}/status`, { status });
    return response.data;
  },

  /**
   * Deleta um pagamento.
   * @param {number} id - ID do pagamento.
   * @returns {Promise<void>}
   */
  async deletePagamento(id: number): Promise<void> {
    await api.delete(`/api/pagamentos/${id}`);
  },
};
