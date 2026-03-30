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
  itens?: LancamentoItem[];
}

export const lancamentoService = {
  async getAll(): Promise<Lancamento[]> {
    const response = await api.get('/api/lancamentos');
    return response.data;
  },

  async getById(id: number): Promise<Lancamento> {
    const response = await api.get(`/api/lancamentos/${id}`);
    return response.data;
  },

  async create(data: CreateLancamentoData): Promise<Lancamento> {
    const response = await api.post('/api/lancamentos', data);
    return response.data;
  },

  async updateStatus(id: number, status: string): Promise<Lancamento> {
    const response = await api.patch(`/api/lancamentos/${id}/status`, { status });
    return response.data;
  },
};
