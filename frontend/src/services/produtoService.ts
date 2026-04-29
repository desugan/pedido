import api from './api';

export interface Produto {
  id_produto: number;
  nome: string;
  valor: number;
  oldvalor?: number | null;
  marca: string;
  saldo: number;
}

export interface CreateProdutoData {
  nome: string;
  valor: number;
  marca: string;
  saldo: number;
}

export const produtoService = {
  async getAll(): Promise<Produto[]> {
    const timestamp = Date.now();
    const response = await api.get(`/api/produtos?_t=${timestamp}`);
    console.log('produtoService.getAll: fetched', response.data.length, 'produtos');
    return response.data;
  },

  async create(data: CreateProdutoData): Promise<Produto> {
    const response = await api.post('/api/produtos', data);
    return response.data;
  },

  async update(id: number, data: Partial<CreateProdutoData>): Promise<Produto> {
    const response = await api.put(`/api/produtos/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/api/produtos/${id}`);
  },
};
