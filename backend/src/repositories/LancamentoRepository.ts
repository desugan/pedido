import { PrismaClient, Prisma } from '@prisma/client';
import { CreateLancamentoInput, Lancamento, LancamentoItem } from '../types/lancamento';

const prisma = new PrismaClient();

type IdRow = { id: number };

function mapDbError(error: unknown): Error {
  const message = error instanceof Error ? error.message : '';
  if (message.includes("doesn't exist") || message.includes('Unknown table')) {
    return new Error('Tabelas de lançamento não encontradas no banco atual (lancamento/lancamento_item).');
  }

  return error instanceof Error ? error : new Error('Erro de banco de dados');
}

export class LancamentoRepository {
  private async applyConfirmedStock(
    tx: Prisma.TransactionClient,
    idLancamento: number
  ): Promise<void> {
    const itens = await tx.$queryRawUnsafe<Array<{ id_produto: number; qtd: number; vlr_item: number }>>(
      'SELECT id_produto, qtd, vlr_item FROM lancamento_item WHERE id_lancamento = ?',
      idLancamento
    );

    for (const item of itens) {
      const produto = await tx.produto.findUnique({
        where: { id_produto: Number(item.id_produto) },
        select: { saldo: true, valor: true },
      });

      if (!produto) continue;

      const saldoAtual = Number(produto.saldo || 0);
      const valorAtual = Number(produto.valor || 0);
      const qtdEntrada = Number(item.qtd || 0);
      const valorEntrada = Number(item.vlr_item || 0);
      const novoSaldo = saldoAtual + qtdEntrada;
      const novoValor = novoSaldo > 0
        ? (((saldoAtual * valorAtual) + (qtdEntrada * valorEntrada)) / novoSaldo)
        : valorEntrada;

      await tx.produto.update({
        where: { id_produto: Number(item.id_produto) },
        data: {
          saldo: novoSaldo,
          oldvalor: valorAtual,
          valor: novoValor,
        },
      });
    }
  }

  private async revertConfirmedStock(
    tx: Prisma.TransactionClient,
    idLancamento: number
  ): Promise<void> {
    const itens = await tx.$queryRawUnsafe<Array<{ id_produto: number; qtd: number }>>(
      'SELECT id_produto, qtd FROM lancamento_item WHERE id_lancamento = ?',
      idLancamento
    );

    for (const item of itens) {
      const produto = await tx.produto.findUnique({
        where: { id_produto: Number(item.id_produto) },
        select: { saldo: true, oldvalor: true, valor: true },
      });

      if (!produto) continue;

      const saldoAtual = Number(produto.saldo || 0);
      const novoSaldo = Math.max(0, saldoAtual - Number(item.qtd || 0));
      const valorRevertido = produto.oldvalor ?? produto.valor;

      await tx.produto.update({
        where: { id_produto: Number(item.id_produto) },
        data: {
          saldo: novoSaldo,
          valor: valorRevertido,
        },
      });
    }
  }

  async findAll(): Promise<Lancamento[]> {
    try {
      return await prisma.$queryRawUnsafe<Lancamento[]>(
        `SELECT l.id_lancamento, l.id_fornecedor, f.razao AS fornecedor_nome, l.total,
          DATE_FORMAT(l.data, '%Y-%m-%d %H:%i:%s') AS data,
          l.status
         FROM lancamento l
         LEFT JOIN fornecedor f ON f.id_fornecedor = l.id_fornecedor
         ORDER BY l.id_lancamento DESC`
      );
    } catch (error) {
      throw mapDbError(error);
    }
  }

  async findById(id: number): Promise<Lancamento | null> {
    try {
      const rows = await prisma.$queryRawUnsafe<Lancamento[]>(
        `SELECT l.id_lancamento, l.id_fornecedor, f.razao AS fornecedor_nome, l.total,
                DATE_FORMAT(l.data, '%Y-%m-%d %H:%i:%s') AS data,
                l.status
         FROM lancamento l
         LEFT JOIN fornecedor f ON f.id_fornecedor = l.id_fornecedor
         WHERE l.id_lancamento = ?`,
        id
      );

      if (!rows[0]) return null;

      const itens = await prisma.$queryRawUnsafe<LancamentoItem[]>(
        `SELECT li.id_produto, p.nome AS produto_nome, li.qtd, li.vlr_item, li.vlr_total
         FROM lancamento_item li
         LEFT JOIN produto p ON p.id_produto = li.id_produto
         WHERE li.id_lancamento = ?`,
        id
      );

      return {
        ...rows[0],
        itens,
      };
    } catch (error) {
      throw mapDbError(error);
    }
  }

  async create(data: CreateLancamentoInput): Promise<Lancamento> {
    try {
      const idLancamento = await prisma.$transaction(async (tx) => {
        const total = data.itens.reduce((acc, item) => acc + (item.vlr_total ?? item.qtd * item.vlr_item), 0);

        const lancamentoColumns = await tx.$queryRawUnsafe<Array<{ COLUMN_NAME: string }>>(
          `SELECT COLUMN_NAME
           FROM INFORMATION_SCHEMA.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'lancamento'`
        );
        const hasColumn = (columnName: string) => lancamentoColumns.some((c) => c.COLUMN_NAME === columnName);

        const dataRef = data.data || new Date();
        let idUsuarioRef = data.id_usuario ?? null;

        if (hasColumn('id_usuario') && !idUsuarioRef) {
          const firstUser = await tx.$queryRawUnsafe<IdRow[]>('SELECT id_usuario AS id FROM usuario ORDER BY id_usuario ASC LIMIT 1');
          idUsuarioRef = firstUser[0]?.id ?? null;
        }

        const columns = ['id_fornecedor', 'total', 'data'];
        const values: Array<number | string | Date | null> = [data.id_fornecedor, total, dataRef];

        if (hasColumn('status')) {
          columns.push('status');
          values.push(data.status || 'PENDENTE');
        }
        if (hasColumn('documento')) {
          columns.push('documento');
          values.push((data.documento || `LAN-${Date.now()}`).slice(0, 45));
        }
        if (hasColumn('chave')) {
          columns.push('chave');
          values.push(data.chave || null);
        }
        if (hasColumn('id_usuario')) {
          columns.push('id_usuario');
          values.push(idUsuarioRef);
        }
        if (hasColumn('data_lancamento')) {
          columns.push('data_lancamento');
          values.push(dataRef);
        }

        await tx.$executeRawUnsafe(
          `INSERT INTO lancamento (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
          ...values
        );

        const inserted = await tx.$queryRawUnsafe<IdRow[]>('SELECT LAST_INSERT_ID() AS id');
        const lancamentoId = inserted[0].id;

        for (const item of data.itens) {
          const totalItem = item.vlr_total ?? item.qtd * item.vlr_item;

          await tx.$executeRawUnsafe(
            'INSERT INTO lancamento_item (id_lancamento, id_produto, qtd, vlr_item, vlr_total) VALUES (?, ?, ?, ?, ?)',
            lancamentoId,
            item.id_produto,
            item.qtd,
            item.vlr_item,
            totalItem
          );
        }

        if (String(data.status || '').trim().toUpperCase() === 'CONFIRMADO') {
          await this.applyConfirmedStock(tx, lancamentoId);
        }

        return lancamentoId;
      });

      const lancamento = await this.findById(idLancamento);
      if (!lancamento) throw new Error('Falha ao carregar lançamento criado');
      return lancamento;
    } catch (error) {
      throw mapDbError(error);
    }
  }

  async updateStatus(id: number, status: string): Promise<Lancamento | null> {
    try {
      await prisma.$transaction(async (tx) => {
        const currentRows = await tx.$queryRawUnsafe<Array<{ status: string }>>(
          'SELECT status FROM lancamento WHERE id_lancamento = ?',
          id
        );

        if (!currentRows[0]) {
          return;
        }

        const currentStatus = String(currentRows[0].status || '').toUpperCase();
        const nextStatus = String(status || '').toUpperCase();

        if (currentStatus === nextStatus) {
          return;
        }

        if (currentStatus === 'CONFIRMADO' && nextStatus === 'PENDENTE') {
          throw new Error('Não é permitido voltar um lançamento confirmado para pendente. Cancele o lançamento para reverter o estoque.');
        }

        if (nextStatus === 'CONFIRMADO' && currentStatus !== 'CONFIRMADO') {
          await this.applyConfirmedStock(tx, id);
        }

        if (nextStatus === 'CANCELADO' && currentStatus === 'CONFIRMADO') {
          await this.revertConfirmedStock(tx, id);
        }

        await tx.$executeRawUnsafe(
          'UPDATE lancamento SET status = ? WHERE id_lancamento = ?',
          status,
          id
        );
      });

      return this.findById(id);
    } catch (error) {
      throw mapDbError(error);
    }
  }
}
