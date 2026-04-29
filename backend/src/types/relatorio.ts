export interface Relatorio {
  id: number;
  tipo: 'pedidos' | 'pagamentos' | 'clientes' | 'vendas';
  titulo: string;
  dataInicio: Date;
  dataFim: Date;
  filtros?: Record<string, unknown>;
  dados: unknown[];
  totais: RelatorioTotais;
  createdAt: Date;
}

export interface RelatorioTotais {
  quantidade: number;
  valorTotal: number;
  valorMedio?: number;
  statusCount?: Record<string, number>;
}

export interface CreateRelatorioInput {
  tipo: 'pedidos' | 'pagamentos' | 'clientes' | 'vendas';
  dataInicio: Date;
  dataFim: Date;
  filtros?: Record<string, unknown>;
}

export interface FiltroRelatorio {
  dataInicio?: Date;
  dataFim?: Date;
  status?: string;
  clienteId?: number;
  metodo?: string;
  minValor?: number;
  maxValor?: number;
}

export interface RelatorioRepository {
  save(relatorio: Relatorio): Promise<Relatorio>;
  findById(id: number): Promise<Relatorio | null>;
  findAll(tipo?: string): Promise<Relatorio[]>;
  delete(id: number): Promise<boolean>;
}

export interface RelatorioService {
  gerarRelatorioPedidos(dataInicio: Date, dataFim: Date, filtros?: FiltroRelatorio): Promise<Relatorio>;
  gerarRelatorioPagamentos(dataInicio: Date, dataFim: Date, filtros?: FiltroRelatorio): Promise<Relatorio>;
  gerarRelatorioClientes(dataInicio: Date, dataFim: Date, filtros?: FiltroRelatorio): Promise<Relatorio>;
  gerarRelatorioVendas(dataInicio: Date, dataFim: Date, filtros?: FiltroRelatorio): Promise<Relatorio>;
  filtrarDados(dados: unknown[], filtros: FiltroRelatorio): unknown[];
  calcularTotais(dados: unknown[], tipo: string): RelatorioTotais;
}
