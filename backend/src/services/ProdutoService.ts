import { ProdutoRepository } from '../repositories/ProdutoRepository';
import { CreateProdutoInput, Produto, UpdateProdutoInput } from '../types/produto';

export class ProdutoService {
  private repository = new ProdutoRepository();

  async getAllProdutos(): Promise<Produto[]> {
    return this.repository.findAll();
  }

  async getProdutoById(id: number): Promise<Produto | null> {
    if (!id || id <= 0) throw new Error('ID inválido');
    return this.repository.findById(id);
  }

  async createProduto(data: CreateProdutoInput): Promise<Produto> {
    if (!data.nome || !data.marca) throw new Error('Nome e marca são obrigatórios');
    if (data.valor <= 0) throw new Error('Valor deve ser maior que zero');
    if (data.saldo < 0) throw new Error('Saldo não pode ser negativo');

    return this.repository.create(data);
  }

  async updateProduto(id: number, data: UpdateProdutoInput): Promise<Produto | null> {
    if (!id || id <= 0) throw new Error('ID inválido');
    if (typeof data.valor === 'number' && data.valor <= 0) throw new Error('Valor deve ser maior que zero');
    if (typeof data.saldo === 'number' && data.saldo < 0) throw new Error('Saldo não pode ser negativo');

    return this.repository.update(id, data);
  }

  async deleteProduto(id: number): Promise<boolean> {
    if (!id || id <= 0) throw new Error('ID inválido');
    return this.repository.delete(id);
  }
}
