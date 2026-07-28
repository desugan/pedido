import api from './api';
import { mapperPedido, mapperItemPedido } from '../mapper/mapperPedido';

export interface CreateItemPedidoData {
  produtoId?: number;
  produtoNome: string;
  quantidade: number;
  precoUnitario: number;
}

export interface CreatePedidoData {
  clienteId: number;
  itens: CreateItemPedidoData[];
}

export interface ItemPedido {
  id?: number;
  pedidoId?: number;
  produtoId?: number;
  produtoNome: string;
  quantidade: number;
  precoUnitario: number;
  subtotal?: number;
}

export interface Pedido {
  id: number;
  clienteId: number;
  clienteNome?: string;
  status: 'confirmado' | 'em_pagamento' | 'pago' | 'cancelado';
  total: number;
  itens?: ItemPedido[];
  createdAt: string;
  updatedAt: string;
}

export const pedidoService = {
  /**
   * Lista pedidos disponiveis para pagamento.
   * @param {number} page - Pagina.
   * @param {number} limit - Itens por pagina.
   * @param {string} [q] - Termo de busca.
   * @param {number} [clienteId] - Filtrar por cliente.
   * @returns {Promise<{data: Pedido[], total: number}>}
   */
  async getPedidosParaPagamento(page = 1, limit = 10, q?: string, clienteId?: number): Promise<{ data: Pedido[]; total: number }> {
    const params: any = { page, limit };
    if (q) params.q = q;
    if (clienteId !== undefined) params.cliente_id = clienteId;
    const response = await api.get('/api/pedidos/para-pagamento', { params });
    return { data: (response.data.data || []).map(mapperPedido), total: response.data.total ?? 0 };
  },

  /**
   * Lista todos os pedidos paginados.
   * @param {number} page - Pagina.
   * @param {number} limit - Itens por pagina.
   * @param {string} [q] - Termo de busca.
   * @param {string} [status] - Filtrar por status.
   * @returns {Promise<{data: Pedido[], total: number}>}
   */
  async getAllPedidos(page = 1, limit = 10, q?: string, status?: string): Promise<{ data: Pedido[]; total: number }> {
    const params: any = { page, limit };
    if (q) params.q = q;
    if (status) params.status = status;
    const response = await api.get('/api/pedidos', { params });
    return { data: (response.data.data || []).map(mapperPedido), total: response.data.total ?? 0 };
  },

  /**
   * Obtem um pedido pelo ID.
   * @param {number} id - ID do pedido.
   * @returns {Promise<Pedido>}
   */
  async getPedidoById(id: number): Promise<Pedido> {
    const response = await api.get(`/api/pedidos/${id}`);
    return mapperPedido(response.data);
  },

  /**
   * Lista pedidos de um cliente.
   * @param {number} clienteId - ID do cliente.
   * @param {number} page - Pagina.
   * @param {number} limit - Itens por pagina.
   * @param {string} [status] - Filtrar por status.
   * @returns {Promise<{data: Pedido[], total: number}>}
   */
  async getPedidosByClienteId(clienteId: number, page = 1, limit = 10, status?: string): Promise<{ data: Pedido[]; total: number }> {
    const params: any = { page, limit };
    if (status) params.status = status;
    const response = await api.get(`/api/pedidos/cliente/${clienteId}`, { params });
    return { data: (response.data.data || []).map(mapperPedido), total: response.data.total ?? 0 };
  },

  /**
   * Cria um novo pedido.
   * @param {CreatePedidoData} data - Dados do pedido.
   * @returns {Promise<Pedido>}
   */
  async createPedido(data: CreatePedidoData): Promise<Pedido> {
    const payload = {
      cliente_id: data.clienteId,
      itens: data.itens.map(item => ({
        produto_id: item.produtoId,
        produto_nome: item.produtoNome,
        quantidade: item.quantidade,
        preco_unitario: item.precoUnitario,
      })),
    };
    const response = await api.post('/api/pedidos', payload);
    return response.data;
  },

  /**
   * Atualiza o status de um pedido.
   * @param {number} id - ID do pedido.
   * @param {string} status - Novo status.
   * @returns {Promise<Pedido>}
   */
  async updatePedidoStatus(id: number, status: string): Promise<Pedido> {
    const response = await api.patch(`/api/pedidos/${id}/status`, { status });
    return response.data;
  },

  /**
   * Deleta um pedido.
   * @param {number} id - ID do pedido.
   * @returns {Promise<void>}
   */
  async deletePedido(id: number): Promise<void> {
    await api.delete(`/api/pedidos/${id}`);
  },

  /**
   * Adiciona um item a um pedido.
   * @param {number} pedidoId - ID do pedido.
   * @param {CreateItemPedidoData} item - Dados do item.
   * @returns {Promise<ItemPedido>}
   */
  async addItemToPedido(pedidoId: number, item: CreateItemPedidoData): Promise<ItemPedido> {
    const response = await api.post(`/api/pedidos/${pedidoId}/itens`, item);
    return response.data;
  },

  /**
   * Remove um item de um pedido.
   * @param {number} pedidoId - ID do pedido.
   * @param {number} itemId - ID do item.
   * @returns {Promise<void>}
   */
  async removeItemFromPedido(pedidoId: number, itemId: number): Promise<void> {
    await api.delete(`/api/pedidos/${pedidoId}/itens/${itemId}`);
  },

  /**
   * Retorna os itens de um pedido.
   * @param {number} pedidoId - ID do pedido.
   * @returns {Promise<ItemPedido[]>}
   */
  async getItemsByPedidoId(pedidoId: number): Promise<ItemPedido[]> {
    const response = await api.get(`/api/pedidos/${pedidoId}/itens`);
    return (response.data || []).map(mapperItemPedido);
  },

  /**
   * Calcula o total de itens de um pedido.
   * @param {number} pedidoId - ID do pedido.
   * @returns {Promise<number>}
   */
  async calculateTotal(pedidoId: number): Promise<number> {
    const response = await api.get(`/api/pedidos/${pedidoId}/total`);
    return response.data.total;
  },
};
