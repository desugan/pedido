import api from './api';

export type TipoRelatorio = 'pedidos' | 'pagamentos' | 'clientes' | 'vendas' | 'usuario';

export interface RelatorioResponse {
  tipo: TipoRelatorio;
  periodo?: {
    dataInicio: string | null;
    dataFim: string | null;
  };
  totais: Record<string, number>;
  dados: unknown[];
  cliente?: {
    id_cliente: number;
    nome: string;
    status: string;
    limite_credito?: number;
    saldo_restante?: number;
    credito_utilizado?: number;
  } | null;
  pedidos?: unknown[];
  pagamentos?: unknown[];
}

function buildQuery(params: Record<string, string | undefined>): string {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  const raw = query.toString();
  return raw ? `?${raw}` : '';
}

export const relatorioService = {
  /**
   * Relatorio de pedidos.
   * @param {string} [dataInicio] - Data inicial.
   * @param {string} [dataFim] - Data final.
   * @param {string} [status] - Filtrar por status.
   * @returns {Promise<RelatorioResponse>}
   */
  async getRelatorioPedidos(dataInicio?: string, dataFim?: string, status?: string): Promise<RelatorioResponse> {
    const query = buildQuery({ dataInicio, dataFim, status });
    const response = await api.get(`/api/relatorios/pedidos${query}`);
    return response.data;
  },

  /**
   * Relatorio de pagamentos.
   * @param {string} [dataInicio] - Data inicial.
   * @param {string} [dataFim] - Data final.
   * @param {string} [status] - Filtrar por status.
   * @returns {Promise<RelatorioResponse>}
   */
  async getRelatorioPagamentos(dataInicio?: string, dataFim?: string, status?: string): Promise<RelatorioResponse> {
    const query = buildQuery({ dataInicio, dataFim, status });
    const response = await api.get(`/api/relatorios/pagamentos${query}`);
    return response.data;
  },

  /**
   * Relatorio de clientes.
   * @param {string} [status] - Filtrar por status.
   * @returns {Promise<RelatorioResponse>}
   */
  async getRelatorioClientes(status?: string): Promise<RelatorioResponse> {
    const query = buildQuery({ status });
    const response = await api.get(`/api/relatorios/clientes${query}`);
    return response.data;
  },

  /**
   * Relatorio de vendas.
   * @param {string} [dataInicio] - Data inicial.
   * @param {string} [dataFim] - Data final.
   * @returns {Promise<RelatorioResponse>}
   */
  async getRelatorioVendas(dataInicio?: string, dataFim?: string): Promise<RelatorioResponse> {
    const query = buildQuery({ dataInicio, dataFim });
    const response = await api.get(`/api/relatorios/vendas${query}`);
    return response.data;
  },

  /**
   * Relatorio detalhado de um cliente.
   * @param {number} id_cliente - ID do cliente.
   * @returns {Promise<RelatorioResponse>}
   */
  async getRelatorioUsuario(id_cliente: number): Promise<RelatorioResponse> {
    const response = await api.get(`/api/relatorios/usuario?id_cliente=${id_cliente}`);
    return response.data;
  },
};
