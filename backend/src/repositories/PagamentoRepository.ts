import { PrismaClient } from '@prisma/client';
import {
  Pagamento,
  CreatePagamentoInput,
  UpdatePagamentoInput,
} from '../types/pagamento';

const prisma = new PrismaClient();

export class PagamentoRepository {
  private async ensureFinanceiro(tx: any, clienteId: number): Promise<void> {
    await tx.$executeRawUnsafe(
      `INSERT INTO financeiro (id_cliente, limite_credito, saldo_utilizado, ultimo_limite, data_criacao, usuario_alteracao)
       VALUES (?, 0, 0, 0, NOW(), 'SISTEMA')
       ON DUPLICATE KEY UPDATE id_cliente = VALUES(id_cliente)`,
      clienteId
    );
  }

  private async subtractSaldoUtilizado(tx: any, clienteId: number, amount: number): Promise<void> {
    await this.ensureFinanceiro(tx, clienteId);

    const financeiroRows = await tx.$queryRawUnsafe(
      'SELECT saldo_utilizado FROM financeiro WHERE id_cliente = ? LIMIT 1',
      clienteId
    ) as Array<{ saldo_utilizado: number }>;
    const financeiro = financeiroRows[0];
    if (!financeiro) {
      return;
    }

    const atual = Number(financeiro.saldo_utilizado || 0);
    const novoSaldo = Math.max(atual - Number(amount || 0), 0);

    await tx.$executeRawUnsafe(
      'UPDATE financeiro SET saldo_utilizado = ?, usuario_alteracao = ? WHERE id_cliente = ?',
      novoSaldo,
      'SISTEMA',
      clienteId
    );
  }

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

    const pagamentoAtualizado = await prisma.$transaction(async (tx) => {
      const updated = await tx.pagamento.update({
        where: { id_pagamento: id },
        data: updateData,
        include: {
          cliente: true,
          pagamentopedido: true,
        },
      });

      if (data.status === 'aprovado') {
        const pedidoIds = updated.pagamentopedido.map((pp) => pp.id_pedido);
        if (pedidoIds.length) {
          const pedidosAtuais = await tx.pedido.findMany({
            where: { id_pedido: { in: pedidoIds } },
            select: { id_pedido: true, id_cliente: true, total: true, status: true },
          });

          await tx.pedido.updateMany({
            where: { id_pedido: { in: pedidoIds } },
            data: { status: 'pago' },
          });

          const consumoPorCliente = pedidosAtuais.reduce((acc, pedido) => {
            const statusAtual = String(pedido.status || '').toLowerCase();
            if (statusAtual === 'pago' || statusAtual === 'cancelado') {
              return acc;
            }

            const clienteId = Number(pedido.id_cliente);
            acc[clienteId] = (acc[clienteId] || 0) + Number(pedido.total || 0);
            return acc;
          }, {} as Record<number, number>);

          for (const [clienteIdStr, valor] of Object.entries(consumoPorCliente)) {
            await this.subtractSaldoUtilizado(tx, Number(clienteIdStr), Number(valor || 0));
          }
        }
      }

      return updated;
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