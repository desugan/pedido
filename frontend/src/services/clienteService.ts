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
  async getAllClientes(): Promise<Cliente[]> {
    const response = await api.get('/api/clientes');
    return response.data;
  },

  async getClienteById(id: number): Promise<Cliente> {
    const response = await api.get(`/api/clientes/${id}`);
    return response.data;
  },

  async createCliente(data: CreateClienteData): Promise<Cliente> {
    const response = await api.post('/api/clientes', data);
    return response.data;
  },

  async updateCliente(id: number, data: UpdateClienteData): Promise<Cliente> {
    const response = await api.put(`/api/clientes/${id}`, data);
    return response.data;
  },

  async deleteCliente(id: number): Promise<void> {
    await api.delete(`/api/clientes/${id}`);
  },
};