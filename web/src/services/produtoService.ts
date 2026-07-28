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

export interface ProdutoResumo {
  total_produtos: number;
  total_estoque: number;
  valor_estoque: number;
}

export const produtoService = {
  /**
   * Lista produtos paginados.
   * @param {number} page - Pagina.
   * @param {number} limit - Itens por pagina.
   * @param {string} [q] - Termo de busca.
   * @returns {Promise<{data: Produto[], total: number}>}
   */
  async getAll(page = 1, limit = 10, q?: string): Promise<{ data: Produto[]; total: number }> {
    const params: any = { page, limit };
    if (q) params.q = q;
    const response = await api.get('/api/produtos', { params });
    return { data: response.data.data ?? [], total: response.data.total ?? 0 };
  },

  /**
   * Retorna resumo de indicadores de produtos.
   * @returns {Promise<ProdutoResumo>}
   */
  async getResumo(): Promise<ProdutoResumo> {
    const response = await api.get('/api/produtos/resumo');
    return response.data;
  },

  /**
   * Cria um novo produto.
   * @param {CreateProdutoData} data - Dados do produto.
   * @returns {Promise<Produto>}
   */
  async create(data: CreateProdutoData): Promise<Produto> {
    const response = await api.post('/api/produtos', data);
    return response.data;
  },

  /**
   * Atualiza um produto.
   * @param {number} id - ID do produto.
   * @param {Partial<CreateProdutoData>} data - Dados para atualizar.
   * @returns {Promise<Produto>}
   */
  async update(id: number, data: Partial<CreateProdutoData>): Promise<Produto> {
    const response = await api.put(`/api/produtos/${id}`, data);
    return response.data;
  },

  /**
   * Deleta um produto.
   * @param {number} id - ID do produto.
   * @returns {Promise<void>}
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/api/produtos/${id}`);
  },
};
