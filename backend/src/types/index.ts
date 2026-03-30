// Type definitions will be added during development

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: 'success' | 'error';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Export all entity types
export * from './cliente';
export * from './pedido';
export * from './pagamento';
export * from './relatorio';
export * from './produto';
export * from './usuario';
export * from './fornecedor';
export * from './lancamento';
