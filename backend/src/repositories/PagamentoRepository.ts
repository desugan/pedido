import { PrismaClient } from '@prisma/client';
import {
  Pagamento,
  CreatePagamentoInput,
  UpdatePagamentoInput,
} from '../types/pagamento';

const prisma = new PrismaClient();

export class PagamentoRepository {
  async findAll(status?: string): Promise<Pagamento[]> {
    const where = status ? { status } : {};

    const pagamentos = await prisma.pagamento.findMany({
      where,
      orderBy: { id_pagamento: 'desc' },
      include: {
        cliente: true,
        pagamentopedido: true,
      },
    });

    return pagamentos.map((pagamento) => ({
      id_pagamento: pagamento.id_pagamento,
      valor: pagamento.valor,
      qrcode: pagamento.qrcode,
      chavepix: pagamento.chavepix,
      status: pagamento.status as any,
      data_criacao: pagamento.data_criacao,
      id_cliente: pagamento.id_cliente,
      data_pagamento: pagamento.data_pagamento || undefined,
      cliente: pagamento.cliente,
      pagamentopedido: pagamento.pagamentopedido,
    }));
  }

  async findById(id: number): Promise<Pagamento | null> {
    const pagamento = await prisma.pagamento.findUnique({
      where: { id_pagamento: id },
      include: {
        cliente: true,
        pagamentopedido: true,
      },
    });

    if (!pagamento) return null;

    return {
      id_pagamento: pagamento.id_pagamento,
      valor: pagamento.valor,
      qrcode: pagamento.qrcode,
      chavepix: pagamento.chavepix,
      status: pagamento.status as any,
      data_criacao: pagamento.data_criacao,
      id_cliente: pagamento.id_cliente,
      data_pagamento: pagamento.data_pagamento || undefined,
      cliente: pagamento.cliente,
      pagamentopedido: pagamento.pagamentopedido,
    };
  }

  async findByClienteId(clienteId: number): Promise<Pagamento[]> {
    const pagamentos = await prisma.pagamento.findMany({
      where: { id_cliente: clienteId },
      orderBy: { id_pagamento: 'desc' },
      include: {
        cliente: true,
        pagamentopedido: true,
      },
    });

    return pagamentos.map((pagamento) => ({
      id_pagamento: pagamento.id_pagamento,
      valor: pagamento.valor,
      qrcode: pagamento.qrcode,
      chavepix: pagamento.chavepix,
      status: pagamento.status as any,
      data_criacao: pagamento.data_criacao,
      id_cliente: pagamento.id_cliente,
      data_pagamento: pagamento.data_pagamento || undefined,
      cliente: pagamento.cliente,
      pagamentopedido: pagamento.pagamentopedido,
    }));
  }

  async create(data: CreatePagamentoInput): Promise<Pagamento> {
    const pagamento = await prisma.$transaction(async (tx) => {
      const created = await tx.pagamento.create({
        data: {
          valor: data.valor,
          qrcode: data.qrcode,
          chavepix: data.chavepix,
          status: 'pendente',
          data_criacao: new Date(),
          id_cliente: data.id_cliente,
        },
      });

      const uniquePedidoIds = [...new Set((data.pedidoIds || []).filter((id) => id > 0))];

      if (uniquePedidoIds.length) {
        await tx.pagamentopedido.createMany({
          data: uniquePedidoIds.map((pedidoId) => ({
            id_pedido: pedidoId,
            id_pagamento: created.id_pagamento,
          })),
        });
      }

      return tx.pagamento.findUniqueOrThrow({
        where: { id_pagamento: created.id_pagamento },
        include: {
          cliente: true,
          pagamentopedido: true,
        },
      });
    });

    return {
      id_pagamento: pagamento.id_pagamento,
      valor: pagamento.valor,
      qrcode: pagamento.qrcode,
      chavepix: pagamento.chavepix,
      status: pagamento.status as any,
      data_criacao: pagamento.data_criacao,
      id_cliente: pagamento.id_cliente,
      data_pagamento: pagamento.data_pagamento || undefined,
      cliente: pagamento.cliente,
      pagamentopedido: pagamento.pagamentopedido,
    };
  }

  async update(id: number, data: UpdatePagamentoInput): Promise<Pagamento | null> {
    const pagamentoAtual = await prisma.pagamento.findUnique({ where: { id_pagamento: id } });
    if (!pagamentoAtual) return null;

    const updateData: any = { ...data };
    if (data.status === 'aprovado' && !data.data_pagamento) {
      updateData.data_pagamento = new Date();
    }

    const pagamentoAtualizado = await prisma.pagamento.update({
      where: { id_pagamento: id },
      data: updateData,
      include: {
        cliente: true,
        pagamentopedido: true,
      },
    });

    return {
      id_pagamento: pagamentoAtualizado.id_pagamento,
      valor: pagamentoAtualizado.valor,
      qrcode: pagamentoAtualizado.qrcode,
      chavepix: pagamentoAtualizado.chavepix,
      status: pagamentoAtualizado.status as any,
      data_criacao: pagamentoAtualizado.data_criacao,
      id_cliente: pagamentoAtualizado.id_cliente,
      data_pagamento: pagamentoAtualizado.data_pagamento || undefined,
      cliente: pagamentoAtualizado.cliente,
      pagamentopedido: pagamentoAtualizado.pagamentopedido,
    };
  }

  async delete(id: number): Promise<boolean> {
    const pagamento = await prisma.pagamento.findUnique({ where: { id_pagamento: id } });
    if (!pagamento) return false;

    await prisma.pagamento.update({
      where: { id_pagamento: id },
      data: { status: 'excluido' },
    });

    return true;
  }
}