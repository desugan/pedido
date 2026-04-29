import { PrismaClient } from '@prisma/client';
import { Cliente } from '../types/cliente';

const prisma = new PrismaClient();

export class ClienteRepository {
  async findAll(): Promise<Cliente[]> {
    return prisma.cliente.findMany({
      orderBy: { id_cliente: 'desc' },
      include: {
        pagamento: true,
        pedido: true,
      },
    });
  }

  async findById(id: number): Promise<Cliente | null> {
    return prisma.cliente.findUnique({
      where: { id_cliente: id },
      include: {
        pagamento: true,
        pedido: true,
      },
    });
  }

  async create(data: Omit<Cliente, 'id_cliente'>): Promise<Cliente> {
    return prisma.cliente.create({
      data,
      include: {
        pagamento: true,
        pedido: true,
      },
    });
  }

  async update(id: number, data: Partial<Omit<Cliente, 'id_cliente'>>): Promise<Cliente> {
    return prisma.cliente.update({
      where: { id_cliente: id },
      data,
      include: {
        pagamento: true,
        pedido: true,
      },
    });
  }

  async delete(id: number): Promise<Cliente> {
    return prisma.cliente.delete({
      where: { id_cliente: id },
      include: {
        pagamento: true,
        pedido: true,
      },
    });
  }

  async countUsuarios(id_cliente: number): Promise<number> {
    return prisma.usuario.count({ where: { id_cliente } });
  }

  async countPedidos(id_cliente: number): Promise<number> {
    return prisma.pedido.count({ where: { id_cliente } });
  }

  async countPagamentos(id_cliente: number): Promise<number> {
    return prisma.pagamento.count({ where: { id_cliente } });
  }

  async countPedidosPendentes(id_cliente: number): Promise<number> {
    return prisma.pedido.count({
      where: {
        id_cliente,
        OR: [
          { status: 'pendente' },
          { status: 'PENDENTE' },
          { status: 'aberto' },
          { status: 'ABERTO' },
        ],
      },
    });
  }
}