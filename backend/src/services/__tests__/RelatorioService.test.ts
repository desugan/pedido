import { RelatorioService, FiltroRelatorio } from '../../types/relatorio';
import { createMockPedido, createMockPagamento, createMockCliente } from '../mocks';

describe('RelatorioService', () => {
  let service: RelatorioService;

  beforeEach(() => {
    service = {
      gerarRelatorioPedidos: jest.fn(async (dataInicio, dataFim, filtros) => {
        if (dataInicio > dataFim) {
          throw new Error('Data de início não pode ser maior que data de fim');
        }

        const mockPedidos = [
          { ...createMockPedido(), createdAt: new Date('2024-06-15') },
          { ...createMockPedido({ id: 2, status: 'confirmado' }), createdAt: new Date('2024-06-16') },
          { ...createMockPedido({ id: 3, status: 'pronto' }), createdAt: new Date('2024-06-17') },
        ];

        let dados = mockPedidos.filter(
          (p) => p.createdAt >= dataInicio && p.createdAt <= dataFim
        );

        if (filtros) {
          dados = service.filtrarDados(dados, filtros);
        }

        const totais = service.calcularTotais(dados, 'pedidos');

        return {
          id: 1,
          tipo: 'pedidos',
          titulo: `Relatório de Pedidos (${dataInicio.toLocaleDateString()} - ${dataFim.toLocaleDateString()})`,
          dataInicio,
          dataFim,
          filtros,
          dados,
          totais,
          createdAt: new Date(),
        };
      }),

      gerarRelatorioPagamentos: jest.fn(async (dataInicio, dataFim, filtros) => {
        if (dataInicio > dataFim) {
          throw new Error('Data de início não pode ser maior que data de fim');
        }

        const mockPagamentos = [
          { ...createMockPagamento(), createdAt: new Date('2024-06-15') },
          { ...createMockPagamento({ id: 2, status: 'confirmado' }), createdAt: new Date('2024-06-16') },
          { ...createMockPagamento({ id: 3, status: 'recusado' }), createdAt: new Date('2024-06-17') },
        ];

        let dados = mockPagamentos.filter(
          (p) => p.createdAt >= dataInicio && p.createdAt <= dataFim
        );

        if (filtros) {
          dados = service.filtrarDados(dados, filtros);
        }

        const totais = service.calcularTotais(dados, 'pagamentos');

        return {
          id: 2,
          tipo: 'pagamentos',
          titulo: `Relatório de Pagamentos (${dataInicio.toLocaleDateString()} - ${dataFim.toLocaleDateString()})`,
          dataInicio,
          dataFim,
          filtros,
          dados,
          totais,
          createdAt: new Date(),
        };
      }),

      gerarRelatorioClientes: jest.fn(async (dataInicio, dataFim, filtros) => {
        if (dataInicio > dataFim) {
          throw new Error('Data de início não pode ser maior que data de fim');
        }

        const mockClientes = [
          { ...createMockCliente(), createdAt: new Date('2024-06-15') },
          { ...createMockCliente({ id: 2, email: 'maria@example.com' }), createdAt: new Date('2024-06-16') },
        ];

        let dados = mockClientes.filter(
          (c) => c.createdAt >= dataInicio && c.createdAt <= dataFim
        );

        if (filtros) {
          dados = service.filtrarDados(dados, filtros);
        }

        const totais = service.calcularTotais(dados, 'clientes');

        return {
          id: 3,
          tipo: 'clientes',
          titulo: `Relatório de Clientes (${dataInicio.toLocaleDateString()} - ${dataFim.toLocaleDateString()})`,
          dataInicio,
          dataFim,
          filtros,
          dados,
          totais,
          createdAt: new Date(),
        };
      }),

      gerarRelatorioVendas: jest.fn(async (dataInicio, dataFim, filtros) => {
        if (dataInicio > dataFim) {
          throw new Error('Data de início não pode ser maior que data de fim');
        }

        const mockVendas = [
          {
            id: 1,
            pedidoId: 1,
            valor: 31.0,
            data: new Date('2024-06-15'),
            status: 'entregue',
          },
          {
            id: 2,
            pedidoId: 2,
            valor: 45.5,
            data: new Date('2024-06-16'),
            status: 'entregue',
          },
          {
            id: 3,
            pedidoId: 3,
            valor: 22.0,
            data: new Date('2024-06-17'),
            status: 'pendente',
          },
        ];

        let dados = mockVendas.filter((v) => v.data >= dataInicio && v.data <= dataFim);

        if (filtros) {
          dados = service.filtrarDados(dados, filtros);
        }

        const totais = service.calcularTotais(dados, 'vendas');

        return {
          id: 4,
          tipo: 'vendas',
          titulo: `Relatório de Vendas (${dataInicio.toLocaleDateString()} - ${dataFim.toLocaleDateString()})`,
          dataInicio,
          dataFim,
          filtros,
          dados,
          totais,
          createdAt: new Date(),
        };
      }),

      filtrarDados: jest.fn((dados: unknown[], filtros: FiltroRelatorio) => {
        let resultado = dados;

        if (filtros.status) {
          resultado = resultado.filter((item: any) => item.status === filtros.status);
        }

        if (filtros.minValor !== undefined) {
          resultado = resultado.filter((item: any) => item.valor >= (filtros.minValor || 0));
        }

        if (filtros.maxValor !== undefined) {
          resultado = resultado.filter((item: any) => item.valor <= (filtros.maxValor || Infinity));
        }

        if (filtros.clienteId) {
          resultado = resultado.filter((item: any) => item.clienteId === filtros.clienteId);
        }

        return resultado;
      }),

      calcularTotais: jest.fn((dados: unknown[], tipo: string) => {
        const quantidade = dados.length;
        let valorTotal = 0;

        if (tipo === 'pedidos' || tipo === 'vendas') {
          valorTotal = (dados as any[]).reduce((sum, item) => sum + (item.total || item.valor || 0), 0);
        } else if (tipo === 'pagamentos') {
          valorTotal = (dados as any[]).reduce((sum, item) => sum + item.valor, 0);
        }

        const valorMedio = quantidade > 0 ? valorTotal / quantidade : 0;

        const statusCount: Record<string, number> = {};
        (dados as any[]).forEach((item) => {
          if (item.status) {
            statusCount[item.status] = (statusCount[item.status] || 0) + 1;
          }
        });

        return {
          quantidade,
          valorTotal,
          valorMedio,
          statusCount: Object.keys(statusCount).length > 0 ? statusCount : undefined,
        };
      }),
    };
  });

  describe('gerarRelatorioPedidos', () => {
    it('should generate pedidos report for date range', async () => {
      const dataInicio = new Date('2024-06-01');
      const dataFim = new Date('2024-06-30');

      const result = await service.gerarRelatorioPedidos(dataInicio, dataFim);

      expect(result.tipo).toBe('pedidos');
      expect(result.dataInicio).toEqual(dataInicio);
      expect(result.dataFim).toEqual(dataFim);
      expect(result.dados).toBeDefined();
      expect(result.totais).toBeDefined();
    });

    it('should apply filters to pedidos report', async () => {
      const dataInicio = new Date('2024-06-01');
      const dataFim = new Date('2024-06-30');
      const filtros: FiltroRelatorio = { status: 'confirmado' };

      const result = await service.gerarRelatorioPedidos(dataInicio, dataFim, filtros);

      expect(result.filtros).toEqual(filtros);
    });

    it('should throw error if data range is invalid', async () => {
      const dataInicio = new Date('2024-06-30');
      const dataFim = new Date('2024-06-01');

      await expect(service.gerarRelatorioPedidos(dataInicio, dataFim)).rejects.toThrow(
        'Data de início não pode ser maior que data de fim'
      );
    });
  });

  describe('gerarRelatorioPagamentos', () => {
    it('should generate pagamentos report for date range', async () => {
      const dataInicio = new Date('2024-06-01');
      const dataFim = new Date('2024-06-30');

      const result = await service.gerarRelatorioPagamentos(dataInicio, dataFim);

      expect(result.tipo).toBe('pagamentos');
      expect(result.dados).toBeDefined();
      expect(result.totais).toBeDefined();
    });

    it('should apply filters to pagamentos report', async () => {
      const dataInicio = new Date('2024-06-01');
      const dataFim = new Date('2024-06-30');
      const filtros: FiltroRelatorio = { status: 'confirmado', minValor: 20 };

      const result = await service.gerarRelatorioPagamentos(dataInicio, dataFim, filtros);

      expect(result.filtros).toEqual(filtros);
    });
  });

  describe('gerarRelatorioClientes', () => {
    it('should generate clientes report for date range', async () => {
      const dataInicio = new Date('2024-06-01');
      const dataFim = new Date('2024-06-30');

      const result = await service.gerarRelatorioClientes(dataInicio, dataFim);

      expect(result.tipo).toBe('clientes');
      expect(result.dados).toBeDefined();
      expect(result.totais).toBeDefined();
    });
  });

  describe('gerarRelatorioVendas', () => {
    it('should generate vendas report for date range', async () => {
      const dataInicio = new Date('2024-06-01');
      const dataFim = new Date('2024-06-30');

      const result = await service.gerarRelatorioVendas(dataInicio, dataFim);

      expect(result.tipo).toBe('vendas');
      expect(result.dados).toBeDefined();
      expect(result.totais.valorTotal).toBeGreaterThan(0);
    });

    it('should apply valor filter to vendas report', async () => {
      const dataInicio = new Date('2024-06-01');
      const dataFim = new Date('2024-06-30');
      const filtros: FiltroRelatorio = { minValor: 30 };

      const result = await service.gerarRelatorioVendas(dataInicio, dataFim, filtros);

      expect(result.dados.length).toBeGreaterThan(0);
    });
  });

  describe('filtrarDados', () => {
    it('should filter by status', () => {
      const dados = [
        { status: 'pendente', valor: 10 },
        { status: 'confirmado', valor: 20 },
        { status: 'pendente', valor: 15 },
      ];

      const result = service.filtrarDados(dados, { status: 'pendente' });

      expect(result).toHaveLength(2);
      expect((result[0] as any).status).toBe('pendente');
    });

    it('should filter by minValor', () => {
      const dados = [
        { valor: 10 },
        { valor: 20 },
        { valor: 15 },
      ];

      const result = service.filtrarDados(dados, { minValor: 15 });

      expect(result).toHaveLength(2);
      expect((result[0] as any).valor).toBeGreaterThanOrEqual(15);
    });

    it('should filter by maxValor', () => {
      const dados = [
        { valor: 10 },
        { valor: 20 },
        { valor: 15 },
      ];

      const result = service.filtrarDados(dados, { maxValor: 15 });

      expect(result).toHaveLength(2);
      expect((result[1] as any).valor).toBeLessThanOrEqual(15);
    });

    it('should filter by multiple criteria', () => {
      const dados = [
        { status: 'pendente', valor: 10 },
        { status: 'confirmado', valor: 20 },
        { status: 'pendente', valor: 25 },
      ];

      const result = service.filtrarDados(dados, { status: 'pendente', minValor: 15 });

      expect(result).toHaveLength(1);
      expect((result[0] as any).valor).toBe(25);
    });
  });

  describe('calcularTotais', () => {
    it('should calculate totais for pedidos', () => {
      const dados = [
        { id: 1, total: 31.0, status: 'pendente' },
        { id: 2, total: 45.5, status: 'confirmado' },
        { id: 3, total: 22.0, status: 'pronto' },
      ];

      const result = service.calcularTotais(dados, 'pedidos');

      expect(result.quantidade).toBe(3);
      expect(result.valorTotal).toBe(98.5);
      expect(result.valorMedio).toBeCloseTo(32.83, 1);
      expect(result.statusCount?.pendente).toBe(1);
    });

    it('should calculate totais for pagamentos', () => {
      const dados = [
        { valor: 31.0, status: 'confirmado' },
        { valor: 45.5, status: 'confirmado' },
        { valor: 22.0, status: 'recusado' },
      ];

      const result = service.calcularTotais(dados, 'pagamentos');

      expect(result.quantidade).toBe(3);
      expect(result.valorTotal).toBe(98.5);
      expect(result.statusCount?.confirmado).toBe(2);
    });

    it('should return zero for empty dados', () => {
      const result = service.calcularTotais([], 'pedidos');

      expect(result.quantidade).toBe(0);
      expect(result.valorTotal).toBe(0);
      expect(result.valorMedio).toBe(0);
    });
  });
});
