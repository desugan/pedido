import { PrismaClient } from '@prisma/client';
import { CreateFornecedorInput, Fornecedor, UpdateFornecedorInput } from '../types/fornecedor';

const prisma = new PrismaClient();

function mapDbError(error: unknown): Error {
  const message = error instanceof Error ? error.message : '';
  if (message.includes("doesn't exist") || message.includes('Unknown table')) {
    return new Error('Tabela fornecedor não encontrada no banco atual.');
  }

  return error instanceof Error ? error : new Error('Erro de banco de dados');
}

export class FornecedorRepository {
  async findAll(): Promise<Fornecedor[]> {
    try {
      return await prisma.$queryRawUnsafe<Fornecedor[]>(
        'SELECT id_fornecedor, razao, cnpj, status, data, id_usuario FROM fornecedor ORDER BY id_fornecedor DESC'
      );
    } catch (error) {
      throw mapDbError(error);
    }
  }

  async findById(id: number): Promise<Fornecedor | null> {
    try {
      const items = await prisma.$queryRawUnsafe<Fornecedor[]>(
        'SELECT id_fornecedor, razao, cnpj, status, data, id_usuario FROM fornecedor WHERE id_fornecedor = ?',
        id
      );
      return items[0] || null;
    } catch (error) {
      throw mapDbError(error);
    }
  }

  async create(data: CreateFornecedorInput): Promise<Fornecedor> {
    try {
      await prisma.$executeRawUnsafe(
        'INSERT INTO fornecedor (razao, cnpj, status, data, id_usuario) VALUES (?, ?, ?, ?, ?)',
        data.razao,
        data.cnpj,
        data.status || 'ATIVO',
        data.data || new Date(),
        data.id_usuario || null
      );

      const inserted = await prisma.$queryRawUnsafe<Array<{ id: number }>>('SELECT LAST_INSERT_ID() AS id');
      const fornecedor = await this.findById(inserted[0].id);
      if (!fornecedor) throw new Error('Falha ao carregar fornecedor criado');
      return fornecedor;
    } catch (error) {
      throw mapDbError(error);
    }
  }

  async update(id: number, data: UpdateFornecedorInput): Promise<Fornecedor | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const payload = {
      razao: data.razao ?? existing.razao,
      cnpj: data.cnpj ?? existing.cnpj,
      status: data.status ?? existing.status,
      data: data.data ?? existing.data,
      id_usuario: data.id_usuario ?? existing.id_usuario,
    };

    try {
      await prisma.$executeRawUnsafe(
        'UPDATE fornecedor SET razao = ?, cnpj = ?, status = ?, data = ?, id_usuario = ? WHERE id_fornecedor = ?',
        payload.razao,
        payload.cnpj,
        payload.status,
        payload.data,
        payload.id_usuario,
        id
      );
      return this.findById(id);
    } catch (error) {
      throw mapDbError(error);
    }
  }

  async delete(id: number): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;

    try {
      await prisma.$executeRawUnsafe('DELETE FROM fornecedor WHERE id_fornecedor = ?', id);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message.includes('Foreign key constraint')) {
        throw new Error('Não é possível excluir este fornecedor, pois ele está vinculado a lançamentos.');
      }
      throw mapDbError(error);
    }
  }
}
