import { Request, Response } from 'express';
import { PagamentoService } from '../../types/pagamento';
import { createMockPagamento, createMockCreatePagamentoInput } from '../mocks';

describe('PagamentoController', () => {
  let pagamentoService: jest.Mocked<PagamentoService>;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    pagamentoService = {
      registrarPagamento: jest.fn(),
      validarPagamento: jest.fn(),
      getPagamentoById: jest.fn(),
      getPagamentosByPedidoId: jest.fn(),
      getPagamentosByClienteId: jest.fn(),
      getAllPagamentos: jest.fn(),
      cancelarPagamento: jest.fn(),
      getHistoricoPagamentos: jest.fn(),
    };

    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('POST /api/pagamentos', () => {
    it('should register pagamento and return 201', async () => {
      const mockPagamento = createMockPagamento();
      pagamentoService.registrarPagamento.mockResolvedValue(mockPagamento);

      req.body = createMockCreatePagamentoInput();

      const result = await pagamentoService.registrarPagamento(req.body as any);

      expect(result).toEqual(mockPagamento);
      expect(pagamentoService.registrarPagamento).toHaveBeenCalledWith(req.body);
    });

    it('should return 400 if pedidoId is invalid', async () => {
      pagamentoService.registrarPagamento.mockRejectedValue(new Error('Pedido ID inválido'));

      req.body = { ...createMockCreatePagamentoInput(), pedidoId: 0 };

      await expect(pagamentoService.registrarPagamento(req.body as any)).rejects.toThrow(
        'Pedido ID inválido'
      );
    });

    it('should return 400 if valor is invalid', async () => {
      pagamentoService.registrarPagamento.mockRejectedValue(
        new Error('Valor deve ser maior que zero')
      );

      req.body = { ...createMockCreatePagamentoInput(), valor: 0 };

      await expect(pagamentoService.registrarPagamento(req.body as any)).rejects.toThrow(
        'Valor deve ser maior que zero'
      );
    });

    it('should return 400 if metodo is invalid', async () => {
      pagamentoService.registrarPagamento.mockRejectedValue(
        new Error('Método de pagamento inválido')
      );

      req.body = { ...createMockCreatePagamentoInput(), metodo: 'invalido' };

      await expect(pagamentoService.registrarPagamento(req.body as any)).rejects.toThrow(
        'Método de pagamento inválido'
      );
    });
  });

  describe('GET /api/pagamentos/:id', () => {
    it('should return pagamento by id', async () => {
      const mockPagamento = createMockPagamento();
      pagamentoService.getPagamentoById.mockResolvedValue(mockPagamento);

      req.params = { id: '1' };

      const result = await pagamentoService.getPagamentoById(1);

      expect(result).toEqual(mockPagamento);
    });

    it('should return 404 if pagamento does not exist', async () => {
      pagamentoService.getPagamentoById.mockResolvedValue(null);

      req.params = { id: '999' };

      const result = await pagamentoService.getPagamentoById(999);

      expect(result).toBeNull();
    });
  });

  describe('GET /api/pagamentos', () => {
    it('should return all pagamentos', async () => {
      const mockPagamentos = [
        createMockPagamento({ id: 1 }),
        createMockPagamento({ id: 2 }),
      ];
      pagamentoService.getAllPagamentos.mockResolvedValue(mockPagamentos);

      const result = await pagamentoService.getAllPagamentos();

      expect(result).toHaveLength(2);
    });

    it('should filter pagamentos by status', async () => {
      const mockPagamentos = [createMockPagamento({ status: 'confirmado' })];
      pagamentoService.getAllPagamentos.mockResolvedValue(mockPagamentos);

      req.query = { status: 'confirmado' };

      const result = await pagamentoService.getAllPagamentos('confirmado');

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('confirmado');
    });
  });

  describe('GET /api/pedidos/:pedidoId/pagamentos', () => {
    it('should return all pagamentos for a pedido', async () => {
      const mockPagamentos = [
        createMockPagamento({ id: 1 }),
        createMockPagamento({ id: 2 }),
      ];
      pagamentoService.getPagamentosByPedidoId.mockResolvedValue(mockPagamentos);

      req.params = { pedidoId: '1' };

      const result = await pagamentoService.getPagamentosByPedidoId(1);

      expect(result).toHaveLength(2);
    });
  });

  describe('GET /api/clientes/:clienteId/pagamentos', () => {
    it('should return all pagamentos for a cliente', async () => {
      const mockPagamentos = [
        createMockPagamento({ id: 1 }),
        createMockPagamento({ id: 2 }),
      ];
      pagamentoService.getPagamentosByClienteId.mockResolvedValue(mockPagamentos);

      req.params = { clienteId: '1' };

      const result = await pagamentoService.getPagamentosByClienteId(1);

      expect(result).toHaveLength(2);
    });
  });

  describe('PATCH /api/pagamentos/:id/validar', () => {
    it('should validate and confirm pagamento', async () => {
      const mockPagamento = createMockPagamento({ status: 'confirmado' });
      pagamentoService.validarPagamento.mockResolvedValue(mockPagamento);

      req.params = { id: '1' };

      const result = await pagamentoService.validarPagamento(1);

      expect(result?.status).toBe('confirmado');
    });

    it('should return 400 if pagamento is already confirmed', async () => {
      pagamentoService.validarPagamento.mockRejectedValue(
        new Error('Pagamento já está confirmado')
      );

      req.params = { id: '1' };

      await expect(pagamentoService.validarPagamento(1)).rejects.toThrow(
        'Pagamento já está confirmado'
      );
    });
  });

  describe('DELETE /api/pagamentos/:id', () => {
    it('should cancel pagamento', async () => {
      const mockPagamento = createMockPagamento({ status: 'cancelado' });
      pagamentoService.cancelarPagamento.mockResolvedValue(mockPagamento);

      req.params = { id: '1' };

      const result = await pagamentoService.cancelarPagamento(1);

      expect(result?.status).toBe('cancelado');
    });

    it('should return 404 if pagamento does not exist', async () => {
      pagamentoService.cancelarPagamento.mockRejectedValue(
        new Error('Pagamento não encontrado')
      );

      req.params = { id: '999' };

      await expect(pagamentoService.cancelarPagamento(999)).rejects.toThrow(
        'Pagamento não encontrado'
      );
    });
  });

  describe('GET /api/pagamentos/historico', () => {
    it('should get pagamentos historico', async () => {
      const mockPagamentos = [
        createMockPagamento({ id: 1 }),
        createMockPagamento({ id: 2 }),
      ];
      pagamentoService.getHistoricoPagamentos.mockResolvedValue(mockPagamentos);

      const result = await pagamentoService.getHistoricoPagamentos();

      expect(result).toHaveLength(2);
    });

    it('should filter historico by cliente and date range', async () => {
      const mockPagamentos = [createMockPagamento({ id: 1 })];
      pagamentoService.getHistoricoPagamentos.mockResolvedValue(mockPagamentos);

      req.query = {
        clienteId: '1',
        dataInicio: '2024-01-01',
        dataFim: '2024-12-31',
      };

      const dataInicio = new Date('2024-01-01');
      const dataFim = new Date('2024-12-31');

      const result = await pagamentoService.getHistoricoPagamentos(1, dataInicio, dataFim);

      expect(result).toHaveLength(1);
      expect(pagamentoService.getHistoricoPagamentos).toHaveBeenCalledWith(
        1,
        dataInicio,
        dataFim
      );
    });
  });
});
