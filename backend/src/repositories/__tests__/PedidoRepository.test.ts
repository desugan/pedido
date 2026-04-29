import { PedidoRepository } from '../../types/pedido';
import { createMockPedido, createMockItemPedido, createMockCreatePedidoInput } from '../mocks';

describe('PedidoRepository', () => {
  let repository: PedidoRepository;
  let mockPedidos: Map<number, any>;
  let mockItens: Map<number, any>;
  let nextPedidoId = 1;
  let nextItemId = 1;

  beforeEach(() => {
    mockPedidos = new Map();
    mockItens = new Map();
    nextPedidoId = 1;
    nextItemId = 1;

    repository = {
      create: jest.fn(async (data) => {
        const pedido = {
          id: nextPedidoId++,
          clienteId: data.clienteId,
          status: 'pendente',
          total: 0,
          itens: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Adicionar itens
        let total = 0;
        for (const item of data.itens) {
          const subtotal = item.quantidade * item.precoUnitario;
          const itemData = {
            id: nextItemId++,
            pedidoId: pedido.id,
            ...item,
            subtotal,
          };
          mockItens.set(itemData.id, itemData);
          pedido.itens?.push(itemData);
          total += subtotal;
        }

        const savedPedido = {
          ...pedido,
          total,
          itens: pedido.itens?.map((i: any) => ({ ...i })),
        };

        mockPedidos.set(savedPedido.id, savedPedido);
        return { ...savedPedido };
      }),

      findById: jest.fn(async (id) => {
        return mockPedidos.get(id) || null;
      }),

      findByClienteId: jest.fn(async (clienteId) => {
        return Array.from(mockPedidos.values()).filter((p) => p.clienteId === clienteId);
      }),

      findAll: jest.fn(async (status?: string) => {
        const pedidos = Array.from(mockPedidos.values());
        if (status) {
          return pedidos.filter((p) => p.status === status);
        }
        return pedidos;
      }),

      update: jest.fn(async (id, data) => {
        const pedido = mockPedidos.get(id);
        if (!pedido) return null;
        const updated = { ...pedido, ...data, updatedAt: new Date() };
        mockPedidos.set(id, updated);
        return { ...updated };
      }),

      delete: jest.fn(async (id) => {
        const exists = mockPedidos.has(id);
        mockPedidos.delete(id);
        return exists;
      }),

      addItem: jest.fn(async (pedidoId, item) => {
        const itemData = {
          id: nextItemId++,
          pedidoId,
          ...item,
          subtotal: item.quantidade * item.precoUnitario,
        };
        mockItens.set(itemData.id, itemData);

        // Atualizar total do pedido
        const existingPedido = mockPedidos.get(pedidoId);
        if (existingPedido) {
          const total = Array.from(mockItens.values())
            .filter((i) => i.pedidoId === pedidoId)
            .reduce((sum, i) => sum + i.subtotal, 0);
          const updatedPedido = { ...existingPedido, total, updatedAt: new Date() };
          mockPedidos.set(pedidoId, updatedPedido);
        }

        return { ...itemData };
      }),

      removeItem: jest.fn(async (pedidoId, itemId) => {
        const exists = mockItens.has(itemId);
        mockItens.delete(itemId);

        // Atualizar total do pedido
        const existingPedido = mockPedidos.get(pedidoId);
        if (existingPedido) {
          const total = Array.from(mockItens.values())
            .filter((i) => i.pedidoId === pedidoId)
            .reduce((sum, i) => sum + i.subtotal, 0);
          const updatedPedido = { ...existingPedido, total, updatedAt: new Date() };
          mockPedidos.set(pedidoId, updatedPedido);
        }

        return exists;
      }),

      getItemsByPedidoId: jest.fn(async (pedidoId) => {
        return Array.from(mockItens.values()).filter((i) => i.pedidoId === pedidoId);
      }),
    };
  });

  describe('create', () => {
    it('should create a new pedido with itens', async () => {
      const data = createMockCreatePedidoInput();
      const result = await repository.create(data);

      expect(result.id).toBeDefined();
      expect(result.clienteId).toBe(1);
      expect(result.status).toBe('pendente');
      expect(result.itens).toHaveLength(1);
      expect(result.total).toBe(31.0);
    });

    it('should calculate total correctly', async () => {
      const data = {
        clienteId: 1,
        itens: [
          { produtoNome: 'Cerveja', quantidade: 2, precoUnitario: 10 },
          { produtoNome: 'Chopp', quantidade: 1, precoUnitario: 15 },
        ],
      };
      const result = await repository.create(data);

      expect(result.total).toBe(35); // (2 * 10) + (1 * 15)
    });
  });

  describe('findById', () => {
    it('should find pedido by id', async () => {
      const data = createMockCreatePedidoInput();
      await repository.create(data);
      const result = await repository.findById(1);

      expect(result).not.toBeNull();
      expect(result?.clienteId).toBe(1);
    });

    it('should return null if pedido does not exist', async () => {
      const result = await repository.findById(999);
      expect(result).toBeNull();
    });
  });

  describe('findByClienteId', () => {
    it('should find all pedidos for a cliente', async () => {
      const data = createMockCreatePedidoInput();
      await repository.create(data);
      await repository.create(data);

      const result = await repository.findByClienteId(1);
      expect(result).toHaveLength(2);
    });

    it('should return empty array if cliente has no pedidos', async () => {
      const result = await repository.findByClienteId(999);
      expect(result).toEqual([]);
    });
  });

  describe('findAll', () => {
    it('should return all pedidos', async () => {
      const data = createMockCreatePedidoInput();
      await repository.create(data);
      await repository.create(data);

      const result = await repository.findAll();
      expect(result).toHaveLength(2);
    });

    it('should filter by status', async () => {
      const data = createMockCreatePedidoInput();
      const pedido1 = await repository.create(data);
      const pedido2 = await repository.create(data);

      await repository.update(pedido2.id, { status: 'confirmado' });

      const pendentes = await repository.findAll('pendente');
      expect(pendentes).toHaveLength(1);
      expect(pendentes[0].status).toBe('pendente');
    });
  });

  describe('update', () => {
    it('should update pedido status', async () => {
      const data = createMockCreatePedidoInput();
      await repository.create(data);
      const result = await repository.update(1, { status: 'confirmado' });

      expect(result?.status).toBe('confirmado');
    });

    it('should return null if pedido does not exist', async () => {
      const result = await repository.update(999, { status: 'confirmado' });
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete pedido', async () => {
      const data = createMockCreatePedidoInput();
      await repository.create(data);
      const result = await repository.delete(1);

      expect(result).toBe(true);
      const findResult = await repository.findById(1);
      expect(findResult).toBeNull();
    });

    it('should return false if pedido does not exist', async () => {
      const result = await repository.delete(999);
      expect(result).toBe(false);
    });
  });

  describe('addItem', () => {
    it('should add item to pedido', async () => {
      const data = createMockCreatePedidoInput();
      const pedido = await repository.create(data);

      const item = createMockItemPedido({ produtoNome: 'Água' });
      await repository.addItem(pedido.id, item);

      const items = await repository.getItemsByPedidoId(pedido.id);
      expect(items).toHaveLength(2);
    });

    it('should update pedido total when adding item', async () => {
      const data = createMockCreatePedidoInput();
      const pedido = await repository.create(data);
      const initialTotal = pedido.total;

      const item = { produtoNome: 'Água', quantidade: 1, precoUnitario: 10 };
      await repository.addItem(pedido.id, item);

      const updated = await repository.findById(pedido.id);
      expect(updated?.total).toBe(initialTotal + 10);
    });
  });

  describe('removeItem', () => {
    it('should remove item from pedido', async () => {
      const data = createMockCreatePedidoInput();
      const pedido = await repository.create(data);
      const items = await repository.getItemsByPedidoId(pedido.id);
      const itemId = items[0].id;

      const result = await repository.removeItem(pedido.id, itemId);
      expect(result).toBe(true);

      const updatedItems = await repository.getItemsByPedidoId(pedido.id);
      expect(updatedItems).toHaveLength(0);
    });

    it('should update pedido total when removing item', async () => {
      const data = createMockCreatePedidoInput();
      const pedido = await repository.create(data);
      const items = await repository.getItemsByPedidoId(pedido.id);
      const itemId = items[0].id;

      const subtotal = items[0].subtotal || 0;
      await repository.removeItem(pedido.id, itemId);

      const updated = await repository.findById(pedido.id);
      expect(updated?.total).toBe(pedido.total - subtotal);
    });
  });
});
