import { ClienteRepository } from '../../types/cliente';
import { createMockCliente, mockClienteData, mockClienteData2 } from '../mocks';

describe('ClienteRepository', () => {
  let repository: ClienteRepository;
  let mockClientes: Map<number, any>;
  let nextId = 1;

  beforeEach(() => {
    mockClientes = new Map();
    nextId = 1;

    repository = {
      create: jest.fn(async (data) => {
        const cliente = { id: nextId++, ...data, createdAt: new Date(), updatedAt: new Date() };
        mockClientes.set(cliente.id, cliente);
        return cliente;
      }),

      findById: jest.fn(async (id) => {
        return mockClientes.get(id) || null;
      }),

      findByEmail: jest.fn(async (email) => {
        return Array.from(mockClientes.values()).find((c) => c.email === email) || null;
      }),

      update: jest.fn(async (id, data) => {
        const cliente = mockClientes.get(id);
        if (!cliente) return null;
        const updated = { ...cliente, ...data, updatedAt: new Date() };
        mockClientes.set(id, updated);
        return updated;
      }),

      findAll: jest.fn(async () => {
        return Array.from(mockClientes.values());
      }),

      delete: jest.fn(async (id) => {
        const exists = mockClientes.has(id);
        mockClientes.delete(id);
        return exists;
      }),
    };
  });

  describe('create', () => {
    it('should create a new cliente', async () => {
      const result = await repository.create(mockClienteData);
      expect(result.nome).toBe('João Silva');
      expect(result.email).toBe('joao@example.com');
      expect(result.id).toBeDefined();
    });

    it('should set timestamps on creation', async () => {
      const result = await repository.create(mockClienteData);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });
  });

  describe('findById', () => {
    it('should find a cliente by id', async () => {
      await repository.create(mockClienteData);
      const result = await repository.findById(1);
      expect(result).not.toBeNull();
      expect(result?.nome).toBe('João Silva');
    });

    it('should return null if cliente does not exist', async () => {
      const result = await repository.findById(999);
      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find a cliente by email', async () => {
      await repository.create(mockClienteData);
      const result = await repository.findByEmail('joao@example.com');
      expect(result).not.toBeNull();
      expect(result?.nome).toBe('João Silva');
    });

    it('should return null if email does not exist', async () => {
      const result = await repository.findByEmail('nonexistent@example.com');
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a cliente', async () => {
      await repository.create(mockClienteData);
      const result = await repository.update(1, { nome: 'João Atualizado' });
      expect(result?.nome).toBe('João Atualizado');
      expect(result?.email).toBe('joao@example.com');
    });

    it('should return null if cliente does not exist', async () => {
      const result = await repository.update(999, { nome: 'Test' });
      expect(result).toBeNull();
    });

    it('should update timestamps on update', async () => {
      const created = await repository.create(mockClienteData);
      const updated = await repository.update(1, { nome: 'Updated' });
      if (updated) {
        expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(created.updatedAt.getTime());
      }
    });
  });

  describe('findAll', () => {
    it('should return all clientes', async () => {
      await repository.create(mockClienteData);
      await repository.create(mockClienteData2);
      const result = await repository.findAll();
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no clientes exist', async () => {
      const result = await repository.findAll();
      expect(result).toEqual([]);
    });
  });

  describe('delete', () => {
    it('should delete a cliente', async () => {
      await repository.create(mockClienteData);
      const result = await repository.delete(1);
      expect(result).toBe(true);
      const findResult = await repository.findById(1);
      expect(findResult).toBeNull();
    });

    it('should return false if cliente does not exist', async () => {
      const result = await repository.delete(999);
      expect(result).toBe(false);
    });
  });
});
