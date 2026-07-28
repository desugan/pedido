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
  /**
   * Lista fornecedores paginados.
   * @param {number} page - Pagina.
   * @param {number} limit - Itens por pagina.
   * @param {string} [q] - Termo de busca.
   * @returns {Promise<{data: Fornecedor[], total: number}>}
   */
  async getAll(page = 1, limit = 10, q?: string): Promise<{ data: Fornecedor[]; total: number }> {
    const params: any = { page, limit };
    if (q) params.q = q;
    const response = await api.get('/api/fornecedores', { params });
    return { data: response.data.data ?? [], total: response.data.total ?? 0 };
  },

  /**
   * Cria um novo fornecedor.
   * @param {CreateFornecedorData} data - Dados do fornecedor.
   * @returns {Promise<Fornecedor>}
   */
  async create(data: CreateFornecedorData): Promise<Fornecedor> {
    const response = await api.post('/api/fornecedores', data);
    return response.data;
  },

  /**
   * Atualiza um fornecedor.
   * @param {number} id - ID do fornecedor.
   * @param {Partial<CreateFornecedorData>} data - Dados para atualizar.
   * @returns {Promise<Fornecedor>}
   */
  async update(id: number, data: Partial<CreateFornecedorData>): Promise<Fornecedor> {
    const response = await api.put(`/api/fornecedores/${id}`, data);
    return response.data;
  },

  /**
   * Deleta um fornecedor.
   * @param {number} id - ID do fornecedor.
   * @returns {Promise<void>}
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/api/fornecedores/${id}`);
  },
};
