import api from './api';

export interface LancamentoItemData {
  id_produto: number;
  qtd: number;
  vlr_item: number;
  vlr_total?: number;
}

export interface CreateLancamentoData {
  id_fornecedor: number;
  data?: string;
  status?: string;
  documento?: string;
  id_usuario?: number;
  itens: LancamentoItemData[];
}

export interface LancamentoItem {
  id_produto: number;
  produto_nome?: string | null;
  qtd: number;
  vlr_item: number;
  vlr_total: number;
}

export interface Lancamento {
  id_lancamento: number;
  id_fornecedor: number;
  fornecedor_nome?: string | null;
  total: number;
  data: string;
  status: string;
  documento?: string | null;
  itens?: LancamentoItem[];
}

export const lancamentoService = {
  /**
   * Lista lancamentos paginados.
   * @param {number} page - Pagina.
   * @param {number} limit - Itens por pagina.
   * @param {string} [q] - Termo de busca.
   * @returns {Promise<{data: Lancamento[], total: number}>}
   */
  async getAll(page = 1, limit = 10, q?: string): Promise<{ data: Lancamento[]; total: number }> {
    const params: any = { page, limit };
    if (q) params.q = q;
    const response = await api.get('/api/lancamentos', { params });
    return { data: response.data.data ?? [], total: response.data.total ?? 0 };
  },

  /**
   * Obtem um lancamento pelo ID.
   * @param {number} id - ID do lancamento.
   * @returns {Promise<Lancamento>}
   */
  async getById(id: number): Promise<Lancamento> {
    const response = await api.get(`/api/lancamentos/${id}`);
    return response.data;
  },

  /**
   * Cria um novo lancamento.
   * @param {CreateLancamentoData} data - Dados do lancamento.
   * @returns {Promise<Lancamento>}
   */
  async create(data: CreateLancamentoData): Promise<Lancamento> {
    const response = await api.post('/api/lancamentos', data);
    return response.data;
  },

  /**
   * Atualiza o status de um lancamento.
   * @param {number} id - ID do lancamento.
   * @param {string} status - Novo status.
   * @returns {Promise<Lancamento>}
   */
  async updateStatus(id: number, status: string): Promise<Lancamento> {
    const response = await api.patch(`/api/lancamentos/${id}/status`, { status });
    return response.data;
  },
};
