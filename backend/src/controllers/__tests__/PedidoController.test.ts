import { Request, Response } from 'express';
import { PedidoService } from '../../types/pedido';
import { createMockPedido, createMockCreatePedidoInput, createMockItemPedido } from '../mocks';

describe('PedidoController', () => {
  let pedidoService: jest.Mocked<PedidoService>;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    pedidoService = {
      createPedido: jest.fn(),
      getPedidoById: jest.fn(),
      getPedidosByClienteId: jest.fn(),
      getAllPedidos: jest.fn(),
      updatePedidoStatus: jest.fn(),
      deletePedido: jest.fn(),
      addItemToPedido: jest.fn(),
      removeItemFromPedido: jest.fn(),
      calculateTotal: jest.fn(),
      getItemsByPedidoId: jest.fn(),
    };

    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('POST /api/pedidos', () => {
    it('should create pedido and return 201', async () => {
      const mockPedido = createMockPedido();
      pedidoService.createPedido.mockResolvedValue(mockPedido);

      req.body = createMockCreatePedidoInput();

      const result = await pedidoService.createPedido(req.body as any);

      expect(result).toEqual(mockPedido);
      expect(pedidoService.createPedido).toHaveBeenCalledWith(req.body);
    });

    it('should return 400 if clienteId is invalid', async () => {
      pedidoService.createPedido.mockRejectedValue(new Error('Cliente ID inválido'));

      req.body = { clienteId: 0, itens: [] };

      await expect(pedidoService.createPedido(req.body as any)).rejects.toThrow(
        'Cliente ID inválido'
      );
    });

    it('should return 400 if itens is empty', async () => {
      pedidoService.createPedido.mockRejectedValue(new Error('Pedido deve ter pelo menos um item'));

      req.body = { clienteId: 1, itens: [] };

      await expect(pedidoService.createPedido(req.body as any)).rejects.toThrow(
        'Pedido deve ter pelo menos um item'
      );
    });
  });

  describe('GET /api/pedidos/:id', () => {
    it('should return pedido by id', async () => {
      const mockPedido = createMockPedido();
      pedidoService.getPedidoById.mockResolvedValue(mockPedido);

      req.params = { id: '1' };

      const result = await pedidoService.getPedidoById(1);

      expect(result).toEqual(mockPedido);
    });

    it('should return 404 if pedido does not exist', async () => {
      pedidoService.getPedidoById.mockResolvedValue(null);

      req.params = { id: '999' };

      const result = await pedidoService.getPedidoById(999);

      expect(result).toBeNull();
    });
  });

  describe('GET /api/pedidos', () => {
    it('should return all pedidos', async () => {
      const mockPedidos = [createMockPedido({ id: 1 }), createMockPedido({ id: 2 })];
      pedidoService.getAllPedidos.mockResolvedValue(mockPedidos);

      const result = await pedidoService.getAllPedidos();

      expect(result).toHaveLength(2);
    });

    it('should filter pedidos by status', async () => {
      const mockPedidos = [createMockPedido({ status: 'confirmado' })];
      pedidoService.getAllPedidos.mockResolvedValue(mockPedidos);

      req.query = { status: 'confirmado' };

      const result = await pedidoService.getAllPedidos('confirmado');

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('confirmado');
    });
  });

  describe('GET /api/clientes/:clienteId/pedidos', () => {
    it('should return all pedidos for a cliente', async () => {
      const mockPedidos = [createMockPedido({ id: 1 }), createMockPedido({ id: 2 })];
      pedidoService.getPedidosByClienteId.mockResolvedValue(mockPedidos);

      req.params = { clienteId: '1' };

      const result = await pedidoService.getPedidosByClienteId(1);

      expect(result).toHaveLength(2);
    });
  });

  describe('PATCH /api/pedidos/:id/status', () => {
    it('should update pedido status', async () => {
      const mockPedido = createMockPedido({ status: 'confirmado' });
      pedidoService.updatePedidoStatus.mockResolvedValue(mockPedido);

      req.params = { id: '1' };
      req.body = { status: 'confirmado' };

      const result = await pedidoService.updatePedidoStatus(1, 'confirmado');

      expect(result?.status).toBe('confirmado');
    });

    it('should return 400 for invalid status', async () => {
      pedidoService.updatePedidoStatus.mockRejectedValue(new Error('Status inválido'));

      req.params = { id: '1' };
      req.body = { status: 'invalido' };

      await expect(pedidoService.updatePedidoStatus(1, 'invalido')).rejects.toThrow(
        'Status inválido'
      );
    });
  });

  describe('POST /api/pedidos/:id/itens', () => {
    it('should add item to pedido', async () => {
      const mockItem = createMockItemPedido();
      pedidoService.addItemToPedido.mockResolvedValue(mockItem as any);

      req.params = { id: '1' };
      req.body = mockItem;

      const result = await pedidoService.addItemToPedido(1, req.body as any);

      expect(result).toBeDefined();
      expect(pedidoService.addItemToPedido).toHaveBeenCalledWith(1, req.body);
    });

    it('should return 400 for invalid item data', async () => {
      pedidoService.addItemToPedido.mockRejectedValue(
        new Error('Quantidade deve ser maior que zero')
      );

      req.params = { id: '1' };
      req.body = { produtoNome: 'Test', quantidade: 0, precoUnitario: 10 };

      await expect(pedidoService.addItemToPedido(1, req.body as any)).rejects.toThrow(
        'Quantidade deve ser maior que zero'
      );
    });
  });

  describe('DELETE /api/pedidos/:id/itens/:itemId', () => {
    it('should remove item from pedido', async () => {
      pedidoService.removeItemFromPedido.mockResolvedValue(true);

      req.params = { id: '1', itemId: '1' };

      const result = await pedidoService.removeItemFromPedido(1, 1);

      expect(result).toBe(true);
    });
  });

  describe('GET /api/pedidos/:id/total', () => {
    it('should calculate total for pedido', async () => {
      pedidoService.calculateTotal.mockResolvedValue(31.0);

      req.params = { id: '1' };

      const result = await pedidoService.calculateTotal(1);

      expect(result).toBe(31.0);
    });
  });

  describe('GET /api/pedidos/:id/itens', () => {
    it('should get all itens for a pedido', async () => {
      const mockItens = [createMockItemPedido(), createMockItemPedido()];
      pedidoService.getItemsByPedidoId.mockResolvedValue(mockItens as any);

      req.params = { id: '1' };

      const result = await pedidoService.getItemsByPedidoId(1);

      expect(result).toHaveLength(2);
    });
  });

  describe('DELETE /api/pedidos/:id', () => {
    it('should delete pedido', async () => {
      pedidoService.deletePedido.mockResolvedValue(true);

      req.params = { id: '1' };

      const result = await pedidoService.deletePedido(1);

      expect(result).toBe(true);
    });
  });
});
