import { PrismaClient } from '@prisma/client';
import { CreateProdutoInput, Produto, UpdateProdutoInput } from '../types/produto';

const prisma = new PrismaClient();

export class ProdutoRepository {
  async findAll(): Promise<Produto[]> {
    return prisma.produto.findMany({ orderBy: { id_produto: 'desc' } });
  }

  async findById(id: number): Promise<Produto | null> {
    return prisma.produto.findUnique({ where: { id_produto: id } });
  }

  async create(data: CreateProdutoInput): Promise<Produto> {
    return prisma.produto.create({ data: { ...data } });
  }

  async update(id: number, data: UpdateProdutoInput): Promise<Produto | null> {
    const existing = await prisma.produto.findUnique({ where: { id_produto: id } });
    if (!existing) return null;

    return prisma.produto.update({
      where: { id_produto: id },
      data,
    });
  }

  async delete(id: number): Promise<boolean> {
    const existing = await prisma.produto.findUnique({ where: { id_produto: id } });
    if (!existing) return false;

    try {
      await prisma.produto.delete({ where: { id_produto: id } });
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message.includes('Foreign key constraint')) {
        throw new Error('Não é possível excluir este produto, pois ele está vinculado a pedidos.');
      }
      throw error;
    }

    return true;
  }
}
