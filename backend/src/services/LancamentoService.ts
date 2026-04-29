import { LancamentoRepository } from '../repositories/LancamentoRepository';
import { CreateLancamentoInput, Lancamento } from '../types/lancamento';

export class LancamentoService {
  private repository = new LancamentoRepository();
  private allowedStatus = ['PENDENTE', 'CONFIRMADO', 'CANCELADO'];

  async getAllLancamentos(): Promise<Lancamento[]> {
    return this.repository.findAll();
  }

  async getLancamentoById(id: number): Promise<Lancamento | null> {
    if (!id || id <= 0) throw new Error('ID inválido');
    return this.repository.findById(id);
  }

  async createLancamento(data: CreateLancamentoInput): Promise<Lancamento> {
    if (!data.id_fornecedor || data.id_fornecedor <= 0) {
      throw new Error('Fornecedor é obrigatório');
    }

    if (!data.itens?.length) {
      throw new Error('Informe pelo menos um item');
    }

    const hasInvalid = data.itens.some((item) => item.id_produto <= 0 || item.qtd <= 0 || item.vlr_item <= 0);
    if (hasInvalid) {
      throw new Error('Itens inválidos no lançamento');
    }

    return this.repository.create(data);
  }

  async updateStatus(id: number, status: string): Promise<Lancamento | null> {
    if (!id || id <= 0) {
      throw new Error('ID inválido');
    }

    const normalizedStatus = (status || '').trim().toUpperCase();
    if (!this.allowedStatus.includes(normalizedStatus)) {
      throw new Error('Status inválido');
    }

    return this.repository.updateStatus(id, normalizedStatus);
  }
}
