import { PrismaClient } from '@prisma/client';
import {
  Pedido,
  CreatePedidoInput,
  UpdatePedidoInput,
  ItemPedido,
  CreateItemPedidoInput,
} from '../types/pedido';

const prisma = new PrismaClient();

export class PedidoRepository {
  private async adjustEstoquePedido(
    tx: any,
    pedidoId: number,
    operation: 'add' | 'subtract'
  ): Promise<void> {
    const itens = await tx.pedido_item.findMany({
      where: { id_pedido: pedidoId },
      select: { id_produto: true, qtd: true },
    });

    for (const item of itens) {
      const quantidade = Number(item.qtd || 0);
      if (quantidade <= 0) continue;

      const produto = await tx.produto.findUnique({
        where: { id_produto: item.id_produto },
        select: { saldo: true },
      });

      if (!produto) continue;

      if (operation === 'subtract') {
        if (Number(produto.saldo || 0) < quantidade) {
          throw new Error(`Estoque insuficiente para o produto ${item.id_produto}`);
        }

        await tx.produto.update({
          where: { id_produto: item.id_produto },
          data: { saldo: { decrement: quantidade } },
        });
      } else {
        await tx.produto.update({
          where: { id_produto: item.id_produto },
          data: { saldo: { increment: quantidade } },
        });
      }
    }
  }

  private async ensureFinanceiro(tx: any, clienteId: number): Promise<void> {
    await tx.$executeRawUnsafe(
      `INSERT INTO financeiro (id_cliente, limite_credito, saldo_utilizado, ultimo_limite, data_criacao, usuario_alteracao)
       VALUES (?, 0, 0, 0, NOW(), 'SISTEMA')
       ON DUPLICATE KEY UPDATE id_cliente = VALUES(id_cliente)`,
      clienteId
    );
  }

  private async adjustSaldoUtilizado(
    tx: any,
    clienteId: number,
    amount: number,
    operation: 'add' | 'subtract'
  ): Promise<void> {
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
    const valor = Number(amount || 0);
    const novoSaldo = operation === 'add'
      ? atual + valor
      : Math.max(atual - valor, 0);

    await tx.$executeRawUnsafe(
      'UPDATE financeiro SET saldo_utilizado = ?, usuario_alteracao = ? WHERE id_cliente = ?',
      novoSaldo,
      'SISTEMA',
      clienteId
    );
  }

  async findAll(status?: string): Promise<Pedido[]> {
    const where = status ? { status } : {};

    const pedidos = await prisma.pedido.findMany({
      where,
      orderBy: { id_pedido: 'desc' },
      include: {
        cliente: { select: { nome: true } },
        pedido_item: true,
      },
    });

    return pedidos.map((pedido) => ({
      id: pedido.id_pedido,
      clienteId: pedido.id_cliente,
      clienteNome: pedido.cliente?.nome || undefined,
      status: pedido.status as any,
      total: pedido.total,
      createdAt: pedido.data,
      updatedAt: pedido.data,
      itens: pedido.pedido_item.map((item) => ({
        id: item.id_item_pedido,
        pedidoId: item.id_pedido,
        produtoNome: '',
        quantidade: item.qtd,
        precoUnitario: item.vlr_item,
        subtotal: item.vlr_total,
      })),
    }));
  }

  async findById(id: number): Promise<Pedido | null> {
    const pedido = await prisma.pedido.findUnique({
      where: { id_pedido: id },
      include: {
        cliente: { select: { nome: true } },
        pedido_item: true,
      },
    });

    if (!pedido) return null;

    return {
      id: pedido.id_pedido,
      clienteId: pedido.id_cliente,
      clienteNome: pedido.cliente?.nome || undefined,
      status: pedido.status as any,
      total: pedido.total,
      createdAt: pedido.data,
      updatedAt: pedido.data,
      itens: pedido.pedido_item.map((item) => ({
        id: item.id_item_pedido,
        pedidoId: item.id_pedido,
        produtoNome: '',
        quantidade: item.qtd,
        precoUnitario: item.vlr_item,
        subtotal: item.vlr_total,
      })),
    };
  }

  async findByClienteId(clienteId: number): Promise<Pedido[]> {
    const pedidos = await prisma.pedido.findMany({
      where: { id_cliente: clienteId },
      orderBy: { id_pedido: 'desc' },
      include: {
        cliente: { select: { nome: true } },
        pedido_item: true,
      },
    });

    return pedidos.map((pedido) => ({
      id: pedido.id_pedido,
      clienteId: pedido.id_cliente,
      clienteNome: pedido.cliente?.nome || undefined,
      status: pedido.status as any,
      total: pedido.total,
      createdAt: pedido.data,
      updatedAt: pedido.data,
      itens: pedido.pedido_item.map((item) => ({
        id: item.id_item_pedido,
        pedidoId: item.id_pedido,
        produtoNome: '',
        quantidade: item.qtd,
        precoUnitario: item.vlr_item,
        subtotal: item.vlr_total,
      })),
    }));
  }

  async create(data: CreatePedidoInput): Promise<Pedido> {
    const total = data.itens.reduce((acc, item) => acc + item.quantidade * item.precoUnitario, 0);

    const pedido = await prisma.$transaction(async (tx) => {
      const created = await tx.pedido.create({
        data: {
          id_cliente: data.clienteId,
          total,
          data: new Date(),
          status: 'pendente',
        },
      });

      for (const item of data.itens) {
        let produto = await tx.produto.findFirst({ where: { nome: item.produtoNome } });
        if (!produto) {
          produto = await tx.produto.create({
            data: {
              nome: item.produtoNome,
              valor: item.precoUnitario,
              marca: 'indefinida',
              saldo: item.quantidade,
            },
          });
        }

        await tx.pedido_item.create({
          data: {
            id_pedido: created.id_pedido,
            id_produto: produto.id_produto,
            qtd: item.quantidade,
            vlr_item: item.precoUnitario,
            vlr_total: item.quantidade * item.precoUnitario,
          },
        });
      }

      // Reserve stock immediately after order creation (including pending status).
      await this.adjustEstoquePedido(tx, created.id_pedido, 'subtract');

      // Reserve credit as soon as the order is created.
      await this.adjustSaldoUtilizado(tx, data.clienteId, total, 'add');

      return created;
    });

    return this.findById(pedido.id_pedido) as Promise<Pedido>;
  }

  async update(id: number, data: UpdatePedidoInput): Promise<Pedido | null> {
    const pedidoAtual = await prisma.pedido.findUnique({ where: { id_pedido: id } });
    if (!pedidoAtual) return null;

    const pedidoAtualizado = await prisma.$transaction(async (tx) => {
      const updated = await tx.pedido.update({
        where: { id_pedido: id },
        data: { ...data },
        include: {
          cliente: { select: { nome: true } },
          pedido_item: true,
        },
      });

      const oldStatus = String(pedidoAtual.status || '').toLowerCase();
      const newStatus = String(updated.status || '').toLowerCase();

      const oldFinalized = oldStatus === 'cancelado' || oldStatus === 'pago';
      const newFinalized = newStatus === 'cancelado' || newStatus === 'pago';

      if (!oldFinalized && newFinalized) {
        await this.adjustSaldoUtilizado(
          tx,
          updated.id_cliente,
          Number(updated.total || 0),
          'subtract'
        );
      }

      if (oldFinalized && !newFinalized) {
        await this.adjustSaldoUtilizado(
          tx,
          updated.id_cliente,
          Number(updated.total || 0),
          'add'
        );
      }

      const oldReservaEstoque = ['pendente', 'confirmado', 'em_pagamento', 'pago'].includes(oldStatus);
      const newReservaEstoque = ['pendente', 'confirmado', 'em_pagamento', 'pago'].includes(newStatus);

      if (!oldReservaEstoque && newReservaEstoque) {
        await this.adjustEstoquePedido(tx, id, 'subtract');
      }

      if (oldReservaEstoque && !newReservaEstoque) {
        await this.adjustEstoquePedido(tx, id, 'add');
      }

      return updated;
    });

    return {
      id: pedidoAtualizado.id_pedido,
      clienteId: pedidoAtualizado.id_cliente,
      clienteNome: pedidoAtualizado.cliente?.nome || undefined,
      status: pedidoAtualizado.status as any,
      total: pedidoAtualizado.total,
      createdAt: pedidoAtualizado.data,
      updatedAt: pedidoAtualizado.data,
      itens: pedidoAtualizado.pedido_item.map((item) => ({
        id: item.id_item_pedido,
        pedidoId: item.id_pedido,
        produtoNome: '',
        quantidade: item.qtd,
        precoUnitario: item.vlr_item,
        subtotal: item.vlr_total,
      })),
    };
  }

  async delete(id: number): Promise<boolean> {
    const pedido = await prisma.pedido.findUnique({
      where: { id_pedido: id },
      include: { pedido_item: true },
    });
    if (!pedido) return false;

    await prisma.$transaction(async (tx) => {
      const status = String(pedido.status || '').toLowerCase();
      const total = Number(pedido.total || 0);

      if (!['cancelado', 'pago'].includes(status)) {
        await this.adjustSaldoUtilizado(tx, pedido.id_cliente, total, 'subtract');
      }

      if (['pendente', 'confirmado', 'em_pagamento', 'pago'].includes(status)) {
        await this.adjustEstoquePedido(tx, id, 'add');
      }

      await tx.pedido_item.deleteMany({ where: { id_pedido: id } });
      await tx.pedido.delete({ where: { id_pedido: id } });
    });

    return true;
  }

  async addItem(pedidoId: number, item: CreateItemPedidoInput): Promise<ItemPedido> {
    const pedidoItem = await prisma.$transaction(async (tx) => {
      let produto = await tx.produto.findFirst({ where: { nome: item.produtoNome } });
      if (!produto) {
        produto = await tx.produto.create({
          data: {
            nome: item.produtoNome,
            valor: item.precoUnitario,
            marca: 'indefinida',
            saldo: item.quantidade,
          },
        });
      }

      const novoItem = await tx.pedido_item.create({
        data: {
          id_pedido: pedidoId,
          id_produto: produto.id_produto,
          qtd: item.quantidade,
          vlr_item: item.precoUnitario,
          vlr_total: item.quantidade * item.precoUnitario,
        },
      });

      const pedidoAtual = await tx.pedido.findUnique({
        where: { id_pedido: pedidoId },
        select: { status: true, id_cliente: true },
      });

      if (!pedidoAtual) {
        throw new Error('Pedido não encontrado');
      }

      const novosItens = await tx.pedido_item.findMany({ where: { id_pedido: pedidoId } });
      const novoTotal = novosItens.reduce((acc, current) => acc + Number(current.vlr_total || 0), 0);
      await tx.pedido.update({ where: { id_pedido: pedidoId }, data: { total: novoTotal } });

      const status = String(pedidoAtual.status || '').toLowerCase();
      const subtotalItem = Number(item.quantidade || 0) * Number(item.precoUnitario || 0);

      if (!['cancelado', 'pago'].includes(status)) {
        await this.adjustSaldoUtilizado(tx, pedidoAtual.id_cliente, subtotalItem, 'add');
      }

      if (['pendente', 'confirmado', 'em_pagamento', 'pago'].includes(status)) {
        const produtoAtual = await tx.produto.findUnique({
          where: { id_produto: produto.id_produto },
          select: { saldo: true },
        });

        if (!produtoAtual || Number(produtoAtual.saldo || 0) < Number(item.quantidade || 0)) {
          throw new Error('Estoque insuficiente para adicionar item ao pedido');
        }

        await tx.produto.update({
          where: { id_produto: produto.id_produto },
          data: { saldo: { decrement: Number(item.quantidade || 0) } },
        });
      }

      return novoItem;
    });

    return {
      id: pedidoItem.id_item_pedido,
      pedidoId: pedidoItem.id_pedido,
      produtoNome: item.produtoNome,
      quantidade: pedidoItem.qtd,
      precoUnitario: pedidoItem.vlr_item,
      subtotal: pedidoItem.vlr_total,
    };
  }

  async removeItem(pedidoId: number, itemId: number): Promise<boolean> {
    const item = await prisma.pedido_item.findFirst({ where: { id_item_pedido: itemId, id_pedido: pedidoId } });
    if (!item) return false;

    await prisma.$transaction(async (tx) => {
      const pedido = await tx.pedido.findUnique({
        where: { id_pedido: pedidoId },
        select: { id_cliente: true, status: true },
      });

      if (!pedido) {
        throw new Error('Pedido não encontrado');
      }

      await tx.pedido_item.delete({ where: { id_item_pedido: itemId } });

      const novosItens = await tx.pedido_item.findMany({ where: { id_pedido: pedidoId } });
      const novoTotal = novosItens.reduce((acc, current) => acc + Number(current.vlr_total || 0), 0);
      await tx.pedido.update({ where: { id_pedido: pedidoId }, data: { total: novoTotal } });

      const status = String(pedido.status || '').toLowerCase();
      const subtotal = Number(item.vlr_total || 0);

      if (!['cancelado', 'pago'].includes(status)) {
        await this.adjustSaldoUtilizado(tx, pedido.id_cliente, subtotal, 'subtract');
      }

      if (['pendente', 'confirmado', 'em_pagamento', 'pago'].includes(status)) {
        await tx.produto.update({
          where: { id_produto: item.id_produto },
          data: { saldo: { increment: Number(item.qtd || 0) } },
        });
      }
    });

    return true;
  }

  async getItemsByPedidoId(pedidoId: number): Promise<ItemPedido[]> {
    type RawItem = {
      id: number;
      pedidoId: number;
      produtoNome: string | null;
      quantidade: number;
      precoUnitario: number;
      subtotal: number;
    };

    const itens = await prisma.$queryRawUnsafe<RawItem[]>(
      `SELECT
         pi.id_item_pedido AS id,
         pi.id_pedido AS pedidoId,
         p.nome AS produtoNome,
         pi.qtd AS quantidade,
         pi.vlr_item AS precoUnitario,
         pi.vlr_total AS subtotal
       FROM pedido_item pi
       LEFT JOIN produto p ON p.id_produto = pi.id_produto
       WHERE pi.id_pedido = ?
       ORDER BY pi.id_item_pedido ASC`,
      pedidoId
    );

    return itens.map((item) => ({
      id: item.id,
      pedidoId: item.pedidoId,
      produtoNome: item.produtoNome || '',
      quantidade: Number(item.quantidade),
      precoUnitario: Number(item.precoUnitario),
      subtotal: Number(item.subtotal),
    }));
  }

  async calculateTotal(pedidoId: number): Promise<number> {
    const itens = await prisma.pedido_item.findMany({ where: { id_pedido: pedidoId } });
    return itens.reduce((acc, item) => acc + item.vlr_total, 0);
  }
}