export interface Produto {
  id_produto: number;
  nome: string;
  valor: number;
  oldvalor?: number | null;
  marca: string;
  saldo: number;
  data_compra?: Date | null;
  qtd_ultima_compra?: number | null;
}

export interface CreateProdutoInput {
  nome: string;
  valor: number;
  marca: string;
  saldo: number;
  data_compra?: Date;
  qtd_ultima_compra?: number;
}

export interface UpdateProdutoInput {
  nome?: string;
  valor?: number;
  marca?: string;
  saldo?: number;
  data_compra?: Date;
  qtd_ultima_compra?: number;
}
