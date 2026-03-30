export interface Fornecedor {
  id_fornecedor: number;
  razao: string;
  cnpj: string;
  status: string;
  data?: Date | null;
  id_usuario?: number | null;
}

export interface CreateFornecedorInput {
  razao: string;
  cnpj: string;
  status?: string;
  data?: Date;
  id_usuario?: number;
}

export interface UpdateFornecedorInput {
  razao?: string;
  cnpj?: string;
  status?: string;
  data?: Date;
  id_usuario?: number;
}
