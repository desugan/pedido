import { PagamentoRepository } from '../../types/pagamento';
import { createMockPagamento, createMockCreatePagamentoInput } from '../mocks';

describe('PagamentoRepository', () => {
  let repository: PagamentoRepository;
  let mockPagamentos: Map<number, any>;
  let nextId = 1;

  beforeEach(() => {
    mockPagamentos = new Map();
    nextId = 1;

    repository = {
      create: jest.fn(async (data) => {
        const pagamento = {
          id: nextId++,
          ...data,
          status: 'pendente',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mockPagamentos.set(pagamento.id, pagamento);
        return pagamento;
      }),

      findById: jest.fn(async (id) => {
        return mockPagamentos.get(id) || null;
      }),

      findByPedidoId: jest.fn(async (pedidoId) => {
        return Array.from(mockPagamentos.values()).filter((p) => p.pedidoId === pedidoId);
      }),

      findByClienteId: jest.fn(async (clienteId) => {
        return Array.from(mockPagamentos.values()).filter((p) => p.clienteId === clienteId);
      }),

      findAll: jest.fn(async (status?: string) => {
        const pagamentos = Array.from(mockPagamentos.values());
        if (status) {
          return pagamentos.filter((p) => p.status === status);
        }
        return pagamentos;
      }),

      update: jest.fn(async (id, data) => {
        const pagamento = mockPagamentos.get(id);
        if (!pagamento) return null;
        const updated = { ...pagamento, ...data, updatedAt: new Date() };
        mockPagamentos.set(id, updated);
        return updated;
      }),

      delete: jest.fn(async (id) => {
        const exists = mockPagamentos.has(id);
        mockPagamentos.delete(id);
        return exists;
      }),

      getHistorico: jest.fn(async (clienteId?: number, dataInicio?: Date, dataFim?: Date) => {
        let historico = Array.from(mockPagamentos.values());

        if (clienteId) {
          historico = historico.filter((p) => p.clienteId === clienteId);
        }

        if (dataInicio) {
          historico = historico.filter((p) => new Date(p.createdAt) >= dataInicio);
        }

        if (dataFim) {
          historico = historico.filter((p) => new Date(p.createdAt) <= dataFim);
        }

        return historico;
      }),
    };
  });

  describe('create', () => {
    it('should create a new pagamento', async () => {
      const data = createMockCreatePagamentoInput();
      const result = await repository.create(data);

      expect(result.id).toBeDefined();
      expect(result.pedidoId).toBe(1);
      expect(result.clienteId).toBe(1);
      expect(result.valor).toBe(31.0);
      expect(result.status).toBe('pendente');
    });

    it('should set timestamps on creation', async () => {
      const data = createMockCreatePagamentoInput();
      const result = await repository.create(data);

      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });
  });

  describe('findById', () => {
    it('should find pagamento by id', async () => {
      const data = createMockCreatePagamentoInput();
      await repository.create(data);

      const result = await repository.findById(1);

      expect(result).not.toBeNull();
      expect(result?.valor).toBe(31.0);
    });

    it('should return null if pagamento does not exist', async () => {
      const result = await repository.findById(999);
      expect(result).toBeNull();
    });
  });

  describe('findByPedidoId', () => {
    it('should find all pagamentos for a pedido', async () => {
      const data = createMockCreatePagamentoInput();
      await repository.create(data);
      await repository.create(data);

      const result = await repository.findByPedidoId(1);

      expect(result).toHaveLength(2);
    });

    it('should return empty array if pedido has no pagamentos', async () => {
      const result = await repository.findByPedidoId(999);
      expect(result).toEqual([]);
    });
  });

  describe('findByClienteId', () => {
    it('should find all pagamentos for a cliente', async () => {
      const data = createMockCreatePagamentoInput();
      await repository.create(data);
      await repository.create(data);

      const result = await repository.findByClienteId(1);

      expect(result).toHaveLength(2);
    });

    it('should return empty array if cliente has no pagamentos', async () => {
      const result = await repository.findByClienteId(999);
      expect(result).toEqual([]);
    });
  });

  describe('findAll', () => {
    it('should return all pagamentos', async () => {
      const data = createMockCreatePagamentoInput();
      await repository.create(data);
      await repository.create(data);

      const result = await repository.findAll();

      expect(result).toHaveLength(2);
    });

    it('should filter by status', async () => {
      const data = createMockCreatePagamentoInput();
      const pag1 = await repository.create(data);
      const pag2 = await repository.create(data);

      await repository.update(pag2.id, { status: 'confirmado' });

      const confirmados = await repository.findAll('confirmado');

      expect(confirmados).toHaveLength(1);
      expect(confirmados[0].status).toBe('confirmado');
    });
  });

  describe('update', () => {
    it('should update pagamento status', async () => {
      const data = createMockCreatePagamentoInput();
      await repository.create(data);

      const result = await repository.update(1, { status: 'confirmado' });

      expect(result?.status).toBe('confirmado');
    });

    it('should return null if pagamento does not exist', async () => {
      const result = await repository.update(999, { status: 'confirmado' });
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete pagamento', async () => {
      const data = createMockCreatePagamentoInput();
      await repository.create(data);

      const result = await repository.delete(1);

      expect(result).toBe(true);
      const findResult = await repository.findById(1);
      expect(findResult).toBeNull();
    });

    it('should return false if pagamento does not exist', async () => {
      const result = await repository.delete(999);
      expect(result).toBe(false);
    });
  });

  describe('getHistorico', () => {
    it('should get historico without filters', async () => {
      const data = createMockCreatePagamentoInput();
      await repository.create(data);
      await repository.create(data);

      const result = await repository.getHistorico();

      expect(result).toHaveLength(2);
    });

    it('should filter historico by clienteId', async () => {
      const data1 = createMockCreatePagamentoInput();
      const data2 = createMockCreatePagamentoInput({ clienteId: 2 });

      await repository.create(data1);
      await repository.create(data2);

      const result = await repository.getHistorico(1);

      expect(result).toHaveLength(1);
      expect(result[0].clienteId).toBe(1);
    });

    it('should filter historico by date range', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const data = createMockCreatePagamentoInput();
      await repository.create(data);

      const result = await repository.getHistorico(undefined, yesterday, tomorrow);

      expect(result.length).toBeGreaterThan(0);
    });
  });
});
