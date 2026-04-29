export interface Cliente {
  id_cliente: number;
  nome: string;
  status: string;
  pagamento?: any[]; // relation
  pedido?: any[]; // relation
}

export interface CreateClienteInput {
  nome: string;
  status: string;
}

export interface UpdateClienteInput {
  nome?: string;
  status?: string;
}

export interface ClienteRepository {
  create(data: CreateClienteInput): Promise<Cliente>;
  findById(id: number): Promise<Cliente | null>;
  findByEmail(email: string): Promise<Cliente | null>;
  update(id: number, data: UpdateClienteInput): Promise<Cliente | null>;
  findAll(): Promise<Cliente[]>;
  delete(id: number): Promise<boolean>;
}

export interface ClienteService {
  createCliente(data: CreateClienteInput): Promise<Cliente>;
  getClienteById(id: number): Promise<Cliente | null>;
  getClienteByEmail(email: string): Promise<Cliente | null>;
  updateCliente(id: number, data: UpdateClienteInput): Promise<Cliente | null>;
  getAllClientes(): Promise<Cliente[]>;
  deleteCliente(id: number): Promise<boolean>;
}