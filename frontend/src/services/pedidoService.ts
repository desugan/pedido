import api from './api';

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
  async getAllPedidos(status?: string): Promise<Pedido[]> {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    const response = await api.get(`/api/pedidos${query}`);
    return response.data;
  },

  async getPedidoById(id: number): Promise<Pedido> {
    const response = await api.get(`/api/pedidos/${id}`);
    return response.data;
  },

  async getPedidosByClienteId(clienteId: number): Promise<Pedido[]> {
    const response = await api.get(`/api/pedidos/cliente/${clienteId}`);
    return response.data;
  },

  async createPedido(data: CreatePedidoData): Promise<Pedido> {
    const response = await api.post('/api/pedidos', data);
    return response.data;
  },

  async updatePedidoStatus(id: number, status: string): Promise<Pedido> {
    const response = await api.patch(`/api/pedidos/${id}/status`, { status });
    return response.data;
  },

  async deletePedido(id: number): Promise<void> {
    await api.delete(`/api/pedidos/${id}`);
  },

  async addItemToPedido(pedidoId: number, item: CreateItemPedidoData): Promise<ItemPedido> {
    const response = await api.post(`/api/pedidos/${pedidoId}/itens`, item);
    return response.data;
  },

  async removeItemFromPedido(pedidoId: number, itemId: number): Promise<void> {
    await api.delete(`/api/pedidos/${pedidoId}/itens/${itemId}`);
  },

  async getItemsByPedidoId(pedidoId: number): Promise<ItemPedido[]> {
    const response = await api.get(`/api/pedidos/${pedidoId}/itens`);
    return response.data;
  },

  async calculateTotal(pedidoId: number): Promise<number> {
    const response = await api.get(`/api/pedidos/${pedidoId}/total`);
    return response.data.total;
  },
};