import { PedidoService, PedidoRepository } from '../../types/pedido';
import { createMockPedido, createMockCreatePedidoInput, createMockItemPedido } from '../mocks';

describe('PedidoService', () => {
  let service: PedidoService;
  let mockRepository: jest.Mocked<PedidoRepository>;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByClienteId: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      addItem: jest.fn(),
      removeItem: jest.fn(),
      getItemsByPedidoId: jest.fn(),
    };

    service = {
      createPedido: jest.fn(async (data) => {
        if (!data.clienteId || data.clienteId <= 0) {
          throw new Error('Cliente ID inválido');
        }
        if (!data.itens || data.itens.length === 0) {
          throw new Error('Pedido deve ter pelo menos um item');
        }
        return mockRepository.create(data);
      }),

      getPedidoById: jest.fn(async (id) => {
        if (id <= 0) throw new Error('ID inválido');
        return mockRepository.findById(id);
      }),

      getPedidosByClienteId: jest.fn(async (clienteId) => {
        if (clienteId <= 0) throw new Error('Cliente ID inválido');
        return mockRepository.findByClienteId(clienteId);
      }),

      getAllPedidos: jest.fn(async (status?: string) => {
        return mockRepository.findAll(status);
      }),

      updatePedidoStatus: jest.fn(async (id, status) => {
        if (id <= 0) throw new Error('ID inválido');
        const validStatuses = ['pendente', 'confirmado', 'pronto', 'entregue', 'cancelado'];
        if (!validStatuses.includes(status)) {
          throw new Error('Status inválido');
        }
        return mockRepository.update(id, { status });
      }),

      deletePedido: jest.fn(async (id) => {
        if (id <= 0) throw new Error('ID inválido');
        return mockRepository.delete(id);
      }),

      addItemToPedido: jest.fn(async (pedidoId, item) => {
        if (pedidoId <= 0) throw new Error('Pedido ID inválido');
        if (item.quantidade <= 0) throw new Error('Quantidade deve ser maior que zero');
        if (item.precoUnitario < 0) throw new Error('Preço não pode ser negativo');

        const pedido = await mockRepository.findById(pedidoId);
        if (!pedido) throw new Error('Pedido não encontrado');

        return mockRepository.addItem(pedidoId, item);
      }),

      removeItemFromPedido: jest.fn(async (pedidoId, itemId) => {
        if (pedidoId <= 0) throw new Error('Pedido ID inválido');
        if (itemId <= 0) throw new Error('Item ID inválido');

        return mockRepository.removeItem(pedidoId, itemId);
      }),

      calculateTotal: jest.fn(async (pedidoId) => {
        const pedido = await mockRepository.findById(pedidoId);
        if (!pedido) throw new Error('Pedido não encontrado');
        return pedido.total;
      }),

      getItemsByPedidoId: jest.fn(async (pedidoId) => {
        if (pedidoId <= 0) throw new Error('Pedido ID inválido');
        return mockRepository.getItemsByPedidoId(pedidoId);
      }),
    };
  });

  describe('createPedido', () => {
    it('should create a new pedido with valid data', async () => {
      const data = createMockCreatePedidoInput();
      const mockPedido = createMockPedido();
      mockRepository.create.mockResolvedValue(mockPedido);

      const result = await service.createPedido(data);

      expect(result).toBeDefined();
      expect(result.clienteId).toBe(1);
      expect(mockRepository.create).toHaveBeenCalledWith(data);
    });

    it('should throw error if clienteId is invalid', async () => {
      await expect(service.createPedido({ clienteId: 0, itens: [] })).rejects.toThrow(
        'Cliente ID inválido'
      );
    });

    it('should throw error if pedido has no itens', async () => {
      await expect(service.createPedido({ clienteId: 1, itens: [] })).rejects.toThrow(
        'Pedido deve ter pelo menos um item'
      );
    });
  });

  describe('getPedidoById', () => {
    it('should get pedido by id', async () => {
      const mockPedido = createMockPedido();
      mockRepository.findById.mockResolvedValue(mockPedido);

      const result = await service.getPedidoById(1);

      expect(result).toEqual(mockPedido);
      expect(mockRepository.findById).toHaveBeenCalledWith(1);
    });

    it('should throw error for invalid id', async () => {
      await expect(service.getPedidoById(0)).rejects.toThrow('ID inválido');
    });

    it('should return null if pedido does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const result = await service.getPedidoById(999);

      expect(result).toBeNull();
    });
  });

  describe('getPedidosByClienteId', () => {
    it('should get all pedidos for a cliente', async () => {
      const mockPedidos = [createMockPedido({ id: 1 }), createMockPedido({ id: 2 })];
      mockRepository.findByClienteId.mockResolvedValue(mockPedidos);

      const result = await service.getPedidosByClienteId(1);

      expect(result).toHaveLength(2);
      expect(mockRepository.findByClienteId).toHaveBeenCalledWith(1);
    });

    it('should throw error for invalid clienteId', async () => {
      await expect(service.getPedidosByClienteId(0)).rejects.toThrow('Cliente ID inválido');
    });
  });

  describe('getAllPedidos', () => {
    it('should return all pedidos', async () => {
      const mockPedidos = [createMockPedido({ id: 1 }), createMockPedido({ id: 2 })];
      mockRepository.findAll.mockResolvedValue(mockPedidos);

      const result = await service.getAllPedidos();

      expect(result).toHaveLength(2);
    });

    it('should filter by status', async () => {
      const mockPedidos = [createMockPedido({ status: 'confirmado' })];
      mockRepository.findAll.mockResolvedValue(mockPedidos);

      const result = await service.getAllPedidos('confirmado');

      expect(mockRepository.findAll).toHaveBeenCalledWith('confirmado');
    });
  });

  describe('updatePedidoStatus', () => {
    it('should update pedido status to valid value', async () => {
      const mockPedido = createMockPedido({ status: 'confirmado' });
      mockRepository.update.mockResolvedValue(mockPedido);

      const result = await service.updatePedidoStatus(1, 'confirmado');

      expect(result?.status).toBe('confirmado');
    });

    it('should throw error for invalid status', async () => {
      await expect(service.updatePedidoStatus(1, 'invalido')).rejects.toThrow('Status inválido');
    });

    it('should reject status transitions that are invalid', async () => {
      const validStatuses = ['pendente', 'confirmado', 'pronto', 'entregue', 'cancelado'];
      const invalidStatus = 'unknown_status';

      await expect(service.updatePedidoStatus(1, invalidStatus)).rejects.toThrow('Status inválido');
    });
  });

  describe('addItemToPedido', () => {
    it('should add item to existing pedido', async () => {
      const mockPedido = createMockPedido();
      const mockItem = createMockItemPedido();
      mockRepository.findById.mockResolvedValue(mockPedido);
      mockRepository.addItem.mockResolvedValue(mockItem as any);

      const result = await service.addItemToPedido(1, mockItem);

      expect(result).toBeDefined();
      expect(mockRepository.addItem).toHaveBeenCalledWith(1, mockItem);
    });

    it('should throw error if quantidade is invalid', async () => {
      const item = createMockItemPedido({ quantidade: 0 });

      await expect(service.addItemToPedido(1, item)).rejects.toThrow(
        'Quantidade deve ser maior que zero'
      );
    });

    it('should throw error if preco is negative', async () => {
      const item = createMockItemPedido({ precoUnitario: -10 });

      await expect(service.addItemToPedido(1, item)).rejects.toThrow('Preço não pode ser negativo');
    });

    it('should throw error if pedido does not exist', async () => {
      const item = createMockItemPedido();
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.addItemToPedido(999, item)).rejects.toThrow('Pedido não encontrado');
    });
  });

  describe('removeItemFromPedido', () => {
    it('should remove item from pedido', async () => {
      mockRepository.removeItem.mockResolvedValue(true);

      const result = await service.removeItemFromPedido(1, 1);

      expect(result).toBe(true);
      expect(mockRepository.removeItem).toHaveBeenCalledWith(1, 1);
    });

    it('should throw error for invalid pedidoId', async () => {
      await expect(service.removeItemFromPedido(0, 1)).rejects.toThrow('Pedido ID inválido');
    });

    it('should throw error for invalid itemId', async () => {
      await expect(service.removeItemFromPedido(1, 0)).rejects.toThrow('Item ID inválido');
    });
  });

  describe('calculateTotal', () => {
    it('should calculate total for pedido', async () => {
      const mockPedido = createMockPedido({ total: 31.0 });
      mockRepository.findById.mockResolvedValue(mockPedido);

      const result = await service.calculateTotal(1);

      expect(result).toBe(31.0);
    });

    it('should throw error if pedido does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.calculateTotal(999)).rejects.toThrow('Pedido não encontrado');
    });
  });

  describe('getItemsByPedidoId', () => {
    it('should get all itens for a pedido', async () => {
      const mockItens = [createMockItemPedido(), createMockItemPedido()];
      mockRepository.getItemsByPedidoId.mockResolvedValue(mockItens as any);

      const result = await service.getItemsByPedidoId(1);

      expect(result).toHaveLength(2);
      expect(mockRepository.getItemsByPedidoId).toHaveBeenCalledWith(1);
    });

    it('should throw error for invalid pedidoId', async () => {
      await expect(service.getItemsByPedidoId(0)).rejects.toThrow('Pedido ID inválido');
    });
  });
});
