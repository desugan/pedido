import { FornecedorRepository } from '../repositories/FornecedorRepository';
import { CreateFornecedorInput, Fornecedor, UpdateFornecedorInput } from '../types/fornecedor';

export class FornecedorService {
  private repository = new FornecedorRepository();

  private normalizeText(value: string | undefined): string {
    return String(value || '').trim();
  }

  private hasValidCnpjLength(value: string | undefined): boolean {
    const digits = String(value || '').replace(/\D/g, '');
    return digits.length === 14;
  }

  async getAllFornecedores(): Promise<Fornecedor[]> {
    return this.repository.findAll();
  }

  async getFornecedorById(id: number): Promise<Fornecedor | null> {
    if (!id || id <= 0) throw new Error('ID inválido');
    return this.repository.findById(id);
  }

  async createFornecedor(data: CreateFornecedorInput): Promise<Fornecedor> {
    const razao = this.normalizeText(data.razao);
    const cnpj = this.normalizeText(data.cnpj);

    if (!razao || !cnpj) throw new Error('Razão social e CNPJ são obrigatórios');
    if (!this.hasValidCnpjLength(cnpj)) throw new Error('CNPJ deve conter 14 números');

    return this.repository.create({
      ...data,
      razao,
      cnpj,
    });
  }

  async updateFornecedor(id: number, data: UpdateFornecedorInput): Promise<Fornecedor | null> {
    if (!id || id <= 0) throw new Error('ID inválido');

    const payload: UpdateFornecedorInput = { ...data };

    if (data.razao !== undefined) {
      payload.razao = this.normalizeText(data.razao);
      if (!payload.razao) throw new Error('Razão social é obrigatória');
    }

    if (data.cnpj !== undefined) {
      payload.cnpj = this.normalizeText(data.cnpj);
      if (!payload.cnpj) throw new Error('CNPJ é obrigatório');
      if (!this.hasValidCnpjLength(payload.cnpj)) throw new Error('CNPJ deve conter 14 números');
    }

    return this.repository.update(id, payload);
  }

  async deleteFornecedor(id: number): Promise<boolean> {
    if (!id || id <= 0) throw new Error('ID inválido');
    return this.repository.delete(id);
  }
}
