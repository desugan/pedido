import { Cliente, CreateClienteInput } from './types/cliente';
import { Pedido, CreatePedidoInput, ItemPedido } from './types/pedido';
import { Pagamento, CreatePagamentoInput } from './types/pagamento';

export const mockClienteData: CreateClienteInput = {
  nome: 'João Silva',
  // Compatibilidade com testes legados
  email: 'joao@example.com',
  telefone: '11999999999',
  endereco: 'Rua das Flores, 123',
  status: 'ATIVO',
  limite_credito: 500,
} as unknown as CreateClienteInput;

export const mockClienteData2: CreateClienteInput = {
  nome: 'Maria Santos',
  // Compatibilidade com testes legados
  email: 'maria@example.com',
  telefone: '11988888888',
  endereco: 'Avenida Principal, 456',
  status: 'ATIVO',
  limite_credito: 300,
} as unknown as CreateClienteInput;

export const createMockCliente = (overrides?: Partial<Cliente>): Cliente => {
  return {
    // Campos atuais
    id_cliente: 1,
    nome: 'João Silva',
    status: 'ATIVO',
    // Compatibilidade com testes legados
    id: 1,
    email: 'joao@example.com',
    telefone: '11999999999',
    endereco: 'Rua das Flores, 123',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as unknown as Cliente;
};

export const createMockItemPedido = (overrides?: Partial<ItemPedido>): ItemPedido => {
  return {
    produtoNome: 'Cerveja Artesanal',
    quantidade: 2,
    precoUnitario: 15.5,
    ...overrides,
  };
};

export const createMockPedido = (overrides?: Partial<Pedido>): Pedido => {
  return {
    id: 1,
    clienteId: 1,
    status: 'pendente',
    total: 31.0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
};

export const createMockPagamento = (overrides?: Partial<Pagamento>): Pagamento => {
  return {
    // Campos atuais
    id_pagamento: 1,
    id_cliente: 1,
    valor: 31.0,
    qrcode: 'QRCODE_EXEMPLO',
    chavepix: 'chave-pix-exemplo',
    status: 'pendente',
    data_criacao: new Date(),
    // Compatibilidade com testes legados
    id: 1,
    pedidoId: 1,
    clienteId: 1,
    metodo: 'dinheiro',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as unknown as Pagamento;
};

export const createMockCreatePedidoInput = (overrides?: Partial<CreatePedidoInput>): CreatePedidoInput => {
  return {
    clienteId: 1,
    itens: [
      {
        produtoNome: 'Cerveja Artesanal',
        quantidade: 2,
        precoUnitario: 15.5,
      },
    ],
    ...overrides,
  };
};

export const createMockCreatePagamentoInput = (overrides?: Partial<CreatePagamentoInput>): CreatePagamentoInput => {
  return {
    id_cliente: 1,
    valor: 31.0,
    qrcode: 'QRCODE_EXEMPLO',
    chavepix: 'chave-pix-exemplo',
    pedidoIds: [1],
    // Compatibilidade com testes legados
    pedidoId: 1,
    clienteId: 1,
    metodo: 'dinheiro',
    ...overrides,
  } as unknown as CreatePagamentoInput;
};
