export interface ItemPedido {
  id?: number;
  pedidoId?: number;
  produtoNome: string;
  quantidade: number;
  precoUnitario: number;
  subtotal?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateItemPedidoInput {
  produtoNome: string;
  quantidade: number;
  precoUnitario: number;
}

export interface Pedido {
  id: number;
  clienteId: number;
  clienteNome?: string;
  status: 'pendente' | 'confirmado' | 'em_pagamento' | 'pago' | 'cancelado';
  total: number;
  itens?: ItemPedido[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePedidoInput {
  clienteId: number;
  itens: CreateItemPedidoInput[];
}

export interface UpdatePedidoInput {
  status?: 'pendente' | 'confirmado' | 'em_pagamento' | 'pago' | 'cancelado';
}

export interface PedidoRepository {
  create(data: CreatePedidoInput): Promise<Pedido>;
  findById(id: number): Promise<Pedido | null>;
  findByClienteId(clienteId: number): Promise<Pedido[]>;
  findAll(status?: string): Promise<Pedido[]>;
  update(id: number, data: UpdatePedidoInput): Promise<Pedido | null>;
  delete(id: number): Promise<boolean>;
  addItem(pedidoId: number, item: CreateItemPedidoInput): Promise<ItemPedido>;
  removeItem(pedidoId: number, itemId: number): Promise<boolean>;
  getItemsByPedidoId(pedidoId: number): Promise<ItemPedido[]>;
}

export interface PedidoService {
  createPedido(data: CreatePedidoInput): Promise<Pedido>;
  getPedidoById(id: number): Promise<Pedido | null>;
  getPedidosByClienteId(clienteId: number): Promise<Pedido[]>;
  getAllPedidos(status?: string): Promise<Pedido[]>;
  updatePedidoStatus(id: number, status: string): Promise<Pedido | null>;
  deletePedido(id: number): Promise<boolean>;
  addItemToPedido(pedidoId: number, item: CreateItemPedidoInput): Promise<ItemPedido>;
  removeItemFromPedido(pedidoId: number, itemId: number): Promise<boolean>;
  calculateTotal(pedidoId: number): Promise<number>;
  getItemsByPedidoId(pedidoId: number): Promise<ItemPedido[]>;
}
