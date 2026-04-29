import { Cliente, CreateClienteInput } from '../types/cliente';
import { Pedido, CreatePedidoInput, ItemPedido } from '../types/pedido';
import { Pagamento, CreatePagamentoInput } from '../types/pagamento';

export const mockClienteData: CreateClienteInput = {
  nome: 'João Silva',
  email: 'joao@example.com',
  telefone: '11999999999',
  endereco: 'Rua das Flores, 123',
};

export const mockClienteData2: CreateClienteInput = {
  nome: 'Maria Santos',
  email: 'maria@example.com',
  telefone: '11988888888',
  endereco: 'Avenida Principal, 456',
};

export const createMockCliente = (overrides?: Partial<Cliente>): Cliente => {
  return {
    id: 1,
    nome: 'João Silva',
    email: 'joao@example.com',
    telefone: '11999999999',
    endereco: 'Rua das Flores, 123',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
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
    id: 1,
    pedidoId: 1,
    clienteId: 1,
    valor: 31.0,
    metodo: 'dinheiro',
    status: 'pendente',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
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
    pedidoId: 1,
    clienteId: 1,
    valor: 31.0,
    metodo: 'dinheiro',
    ...overrides,
  };
};
