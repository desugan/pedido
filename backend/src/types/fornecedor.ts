export interface Fornecedor {
  id_fornecedor: number;
  razao: string;
  cnpj: string;
  status: string;
  data?: Date | null;
}

export interface CreateFornecedorInput {
  razao: string;
  cnpj: string;
  status?: string;
  data?: Date;
}

export interface UpdateFornecedorInput {
  razao?: string;
  cnpj?: string;
  status?: string;
  data?: Date;
}
