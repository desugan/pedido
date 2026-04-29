export interface ApiResponse<T> {
  data: T;
  status: 'success' | 'error';
  message?: string;
}

export interface Cliente {
  id_cliente: number;
  nome: string;
  status: string;
  pagamento?: any[];
  pedido?: any[];
  financeiro?: any;
  limite_credito?: number;
  saldo_restante?: number;
  credito_utilizado?: number;
}

export interface CreateClienteData {
  nome: string;
  status: string;
}

export interface UpdateClienteData {
  nome?: string;
  status?: string;
}
