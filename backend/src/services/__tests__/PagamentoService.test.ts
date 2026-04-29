import { PagamentoService, PagamentoRepository } from '../../types/pagamento';
import { createMockPagamento, createMockCreatePagamentoInput } from '../mocks';

describe('PagamentoService', () => {
  let service: PagamentoService;
  let mockRepository: jest.Mocked<PagamentoRepository>;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByPedidoId: jest.fn(),
      findByClienteId: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      getHistorico: jest.fn(),
    };

    service = {
      registrarPagamento: jest.fn(async (data) => {
        if (!data.pedidoId || data.pedidoId <= 0) {
          throw new Error('Pedido ID inválido');
        }
        if (!data.clienteId || data.clienteId <= 0) {
          throw new Error('Cliente ID inválido');
        }
        if (data.valor <= 0) {
          throw new Error('Valor deve ser maior que zero');
        }
        const validMetodos = ['dinheiro', 'cartao', 'pix'];
        if (!validMetodos.includes(data.metodo)) {
          throw new Error('Método de pagamento inválido');
        }
        return mockRepository.create(data);
      }),

      validarPagamento: jest.fn(async (id) => {
        const pagamento = await mockRepository.findById(id);
        if (!pagamento) throw new Error('Pagamento não encontrado');
        if (pagamento.status === 'confirmado') {
          throw new Error('Pagamento já está confirmado');
        }
        return mockRepository.update(id, { status: 'confirmado' });
      }),

      getPagamentoById: jest.fn(async (id) => {
        if (id <= 0) throw new Error('ID inválido');
        return mockRepository.findById(id);
      }),

      getPagamentosByPedidoId: jest.fn(async (pedidoId) => {
        if (pedidoId <= 0) throw new Error('Pedido ID inválido');
        return mockRepository.findByPedidoId(pedidoId);
      }),

      getPagamentosByClienteId: jest.fn(async (clienteId) => {
        if (clienteId <= 0) throw new Error('Cliente ID inválido');
        return mockRepository.findByClienteId(clienteId);
      }),

      getAllPagamentos: jest.fn(async (status?: string) => {
        return mockRepository.findAll(status);
      }),

      cancelarPagamento: jest.fn(async (id) => {
        const pagamento = await mockRepository.findById(id);
        if (!pagamento) throw new Error('Pagamento não encontrado');
        if (pagamento.status === 'cancelado') {
          throw new Error('Pagamento já está cancelado');
        }
        return mockRepository.update(id, { status: 'cancelado' });
      }),

      getHistoricoPagamentos: jest.fn(async (clienteId?: number, dataInicio?: Date, dataFim?: Date) => {
        return mockRepository.getHistorico(clienteId, dataInicio, dataFim);
      }),
    };
  });

  describe('registrarPagamento', () => {
    it('should register a new pagamento with valid data', async () => {
      const data = createMockCreatePagamentoInput();
      const mockPagamento = createMockPagamento();
      mockRepository.create.mockResolvedValue(mockPagamento);

      const result = await service.registrarPagamento(data);

      expect(result).toBeDefined();
      expect(result.valor).toBe(31.0);
      expect(mockRepository.create).toHaveBeenCalledWith(data);
    });

    it('should throw error if pedidoId is invalid', async () => {
      await expect(
        service.registrarPagamento({ ...createMockCreatePagamentoInput(), pedidoId: 0 })
      ).rejects.toThrow('Pedido ID inválido');
    });

    it('should throw error if clienteId is invalid', async () => {
      await expect(
        service.registrarPagamento({ ...createMockCreatePagamentoInput(), clienteId: 0 })
      ).rejects.toThrow('Cliente ID inválido');
    });

    it('should throw error if valor is invalid', async () => {
      await expect(
        service.registrarPagamento({ ...createMockCreatePagamentoInput(), valor: 0 })
      ).rejects.toThrow('Valor deve ser maior que zero');
    });

    it('should throw error if metodo is invalid', async () => {
      await expect(
        service.registrarPagamento({ ...createMockCreatePagamentoInput(), metodo: 'invalido' as any })
      ).rejects.toThrow('Método de pagamento inválido');
    });
  });

  describe('validarPagamento', () => {
    it('should validate and confirm a pagamento', async () => {
      const mockPagamento = createMockPagamento({ status: 'confirmado' });
      mockRepository.findById.mockResolvedValue(createMockPagamento({ status: 'pendente' }));
      mockRepository.update.mockResolvedValue(mockPagamento);

      const result = await service.validarPagamento(1);

      expect(result?.status).toBe('confirmado');
      expect(mockRepository.update).toHaveBeenCalledWith(1, { status: 'confirmado' });
    });

    it('should throw error if pagamento does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.validarPagamento(999)).rejects.toThrow('Pagamento não encontrado');
    });

    it('should throw error if pagamento is already confirmed', async () => {
      mockRepository.findById.mockResolvedValue(createMockPagamento({ status: 'confirmado' }));

      await expect(service.validarPagamento(1)).rejects.toThrow(
        'Pagamento já está confirmado'
      );
    });
  });

  describe('getPagamentoById', () => {
    it('should get pagamento by id', async () => {
      const mockPagamento = createMockPagamento();
      mockRepository.findById.mockResolvedValue(mockPagamento);

      const result = await service.getPagamentoById(1);

      expect(result).toEqual(mockPagamento);
    });

    it('should throw error for invalid id', async () => {
      await expect(service.getPagamentoById(0)).rejects.toThrow('ID inválido');
    });
  });

  describe('getPagamentosByPedidoId', () => {
    it('should get all pagamentos for a pedido', async () => {
      const mockPagamentos = [createMockPagamento({ id: 1 }), createMockPagamento({ id: 2 })];
      mockRepository.findByPedidoId.mockResolvedValue(mockPagamentos);

      const result = await service.getPagamentosByPedidoId(1);

      expect(result).toHaveLength(2);
    });

    it('should throw error for invalid pedidoId', async () => {
      await expect(service.getPagamentosByPedidoId(0)).rejects.toThrow('Pedido ID inválido');
    });
  });

  describe('getPagamentosByClienteId', () => {
    it('should get all pagamentos for a cliente', async () => {
      const mockPagamentos = [createMockPagamento({ id: 1 }), createMockPagamento({ id: 2 })];
      mockRepository.findByClienteId.mockResolvedValue(mockPagamentos);

      const result = await service.getPagamentosByClienteId(1);

      expect(result).toHaveLength(2);
    });

    it('should throw error for invalid clienteId', async () => {
      await expect(service.getPagamentosByClienteId(0)).rejects.toThrow('Cliente ID inválido');
    });
  });

  describe('getAllPagamentos', () => {
    it('should return all pagamentos', async () => {
      const mockPagamentos = [createMockPagamento({ id: 1 }), createMockPagamento({ id: 2 })];
      mockRepository.findAll.mockResolvedValue(mockPagamentos);

      const result = await service.getAllPagamentos();

      expect(result).toHaveLength(2);
    });

    it('should filter by status', async () => {
      const mockPagamentos = [createMockPagamento({ status: 'confirmado' })];
      mockRepository.findAll.mockResolvedValue(mockPagamentos);

      const result = await service.getAllPagamentos('confirmado');

      expect(mockRepository.findAll).toHaveBeenCalledWith('confirmado');
    });
  });

  describe('cancelarPagamento', () => {
    it('should cancel a pagamento', async () => {
      const mockPagamento = createMockPagamento({ status: 'cancelado' });
      mockRepository.findById.mockResolvedValue(createMockPagamento({ status: 'pendente' }));
      mockRepository.update.mockResolvedValue(mockPagamento);

      const result = await service.cancelarPagamento(1);

      expect(result?.status).toBe('cancelado');
      expect(mockRepository.update).toHaveBeenCalledWith(1, { status: 'cancelado' });
    });

    it('should throw error if pagamento does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.cancelarPagamento(999)).rejects.toThrow('Pagamento não encontrado');
    });

    it('should throw error if pagamento is already canceled', async () => {
      mockRepository.findById.mockResolvedValue(createMockPagamento({ status: 'cancelado' }));

      await expect(service.cancelarPagamento(1)).rejects.toThrow('Pagamento já está cancelado');
    });
  });

  describe('getHistoricoPagamentos', () => {
    it('should get pagamentos historico', async () => {
      const mockPagamentos = [createMockPagamento({ id: 1 }), createMockPagamento({ id: 2 })];
      mockRepository.getHistorico.mockResolvedValue(mockPagamentos);

      const result = await service.getHistoricoPagamentos(1);

      expect(result).toHaveLength(2);
      expect(mockRepository.getHistorico).toHaveBeenCalledWith(1, undefined, undefined);
    });

    it('should filter historico by date range', async () => {
      const dataInicio = new Date('2024-01-01');
      const dataFim = new Date('2024-12-31');
      const mockPagamentos = [createMockPagamento({ id: 1 })];
      mockRepository.getHistorico.mockResolvedValue(mockPagamentos);

      const result = await service.getHistoricoPagamentos(1, dataInicio, dataFim);

      expect(mockRepository.getHistorico).toHaveBeenCalledWith(1, dataInicio, dataFim);
    });
  });
});
