import api from './api';

export interface Fornecedor {
  id_fornecedor: number;
  razao: string;
  cnpj: string;
  status: string;
  data?: string | null;
  id_usuario?: number | null;
}

export interface CreateFornecedorData {
  razao: string;
  cnpj: string;
  status?: string;
  id_usuario?: number;
}

export const fornecedorService = {
  async getAll(): Promise<Fornecedor[]> {
    const response = await api.get('/api/fornecedores');
    return response.data;
  },

  async create(data: CreateFornecedorData): Promise<Fornecedor> {
    const response = await api.post('/api/fornecedores', data);
    return response.data;
  },

  async update(id: number, data: Partial<CreateFornecedorData>): Promise<Fornecedor> {
    const response = await api.put(`/api/fornecedores/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/api/fornecedores/${id}`);
  },
};
