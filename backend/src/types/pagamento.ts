export interface Pagamento {
  id_pagamento: number;
  valor: number;
  qrcode: string;
  chavepix: string;
  status: 'pendente' | 'aprovado' | 'rejeitado' | 'cancelado' | 'excluido';
  data_criacao: Date;
  id_cliente: number;
  data_pagamento?: Date;
  cliente?: any;
  pagamentopedido?: any[];
}

export interface CreatePagamentoInput {
  valor: number;
  qrcode: string;
  chavepix: string;
  id_cliente: number;
  pedidoIds?: number[];
}

export interface UpdatePagamentoInput {
  status?: 'pendente' | 'aprovado' | 'rejeitado' | 'cancelado' | 'excluido';
  data_pagamento?: Date;
}

export interface PagamentoRepository {
  create(data: CreatePagamentoInput): Promise<Pagamento>;
  findById(id: number): Promise<Pagamento | null>;
  findByClienteId(clienteId: number): Promise<Pagamento[]>;
  findAll(status?: string): Promise<Pagamento[]>;
  update(id: number, data: UpdatePagamentoInput): Promise<Pagamento | null>;
  delete(id: number): Promise<boolean>;
}

export interface PagamentoService {
  createPagamento(data: CreatePagamentoInput): Promise<Pagamento>;
  getPagamentoById(id: number): Promise<Pagamento | null>;
  getPagamentosByClienteId(clienteId: number): Promise<Pagamento[]>;
  getAllPagamentos(status?: string): Promise<Pagamento[]>;
  updatePagamentoStatus(id: number, status: string): Promise<Pagamento | null>;
  deletePagamento(id: number): Promise<boolean>;
}
