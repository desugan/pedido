export interface LancamentoItemInput {
  id_produto: number;
  qtd: number;
  vlr_item: number;
  vlr_total?: number;
}

export interface Lancamento {
  id_lancamento: number;
  id_fornecedor: number;
  fornecedor_nome?: string | null;
  total: number;
  data: Date;
  status: string;
  itens?: LancamentoItem[];
}

export interface LancamentoItem {
  id_produto: number;
  produto_nome?: string | null;
  qtd: number;
  vlr_item: number;
  vlr_total: number;
}

export interface CreateLancamentoInput {
  id_fornecedor: number;
  data?: Date;
  status?: string;
  id_usuario?: number;
  documento?: string;
  chave?: string;
  itens: LancamentoItemInput[];
}
