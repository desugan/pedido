import api from './api';
import { Cliente } from '../types';

export interface CreateClienteData {
  nome: string;
  status: string;
  limite_credito?: number;
}

export interface UpdateClienteData {
  nome?: string;
  status?: string;
  limite_credito?: number;
}

export const clienteService = {
  /**
   * Lista clientes paginados.
   * @param {number} page - Pagina.
   * @param {number} limit - Itens por pagina.
   * @param {string} [q] - Termo de busca.
   * @returns {Promise<{data: Cliente[], total: number}>}
   */
  async getAllClientes(page = 1, limit = 10, q?: string): Promise<{ data: Cliente[]; total: number }> {
    const params: any = { page, limit };
    if (q) params.q = q;
    const response = await api.get('/api/clientes', { params });
    return { data: response.data.data ?? [], total: response.data.total ?? 0 };
  },

  /**
   * Obtem um cliente pelo ID.
   * @param {number} id - ID do cliente.
   * @returns {Promise<Cliente>}
   */
  async getClienteById(id: number): Promise<Cliente> {
    const response = await api.get(`/api/clientes/${id}`);
    return response.data;
  },

  /**
   * Cria um novo cliente.
   * @param {CreateClienteData} data - Dados do cliente.
   * @returns {Promise<Cliente>}
   */
  async createCliente(data: CreateClienteData): Promise<Cliente> {
    const response = await api.post('/api/clientes', data);
    return response.data;
  },

  /**
   * Atualiza um cliente.
   * @param {number} id - ID do cliente.
   * @param {UpdateClienteData} data - Dados para atualizar.
   * @returns {Promise<Cliente>}
   */
  async updateCliente(id: number, data: UpdateClienteData): Promise<Cliente> {
    const response = await api.put(`/api/clientes/${id}`, data);
    return response.data;
  },

  /**
   * Deleta um cliente.
   * @param {number} id - ID do cliente.
   * @returns {Promise<void>}
   */
  async deleteCliente(id: number): Promise<void> {
    await api.delete(`/api/clientes/${id}`);
  },
};
