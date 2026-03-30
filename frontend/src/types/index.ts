// Type definitions will be added during development

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
}

export interface CreateClienteData {
  nome: string;
  status: string;
}

export interface UpdateClienteData {
  nome?: string;
  status?: string;
}
