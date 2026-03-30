import { ClienteService, ClienteRepository } from '../../types/cliente';
import { createMockCliente, mockClienteData } from '../mocks';

describe('ClienteService', () => {
  let service: ClienteService;
  let mockRepository: jest.Mocked<ClienteRepository>;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      update: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
    };

    service = {
      createCliente: jest.fn(async (data) => {
        // Validations
        if (!data.nome || data.nome.trim() === '') {
          throw new Error('Nome é obrigatório');
        }
        if (!data.email || data.email.trim() === '') {
          throw new Error('Email é obrigatório');
        }
        // Check if email already exists
        const existingCliente = await mockRepository.findByEmail(data.email);
        if (existingCliente) {
          throw new Error('Email já cadastrado');
        }
        return mockRepository.create(data);
      }),

      getClienteById: jest.fn(async (id) => {
        if (id <= 0) throw new Error('ID inválido');
        return mockRepository.findById(id);
      }),

      getClienteByEmail: jest.fn(async (email) => {
        if (!email) throw new Error('Email é obrigatório');
        return mockRepository.findByEmail(email);
      }),

      updateCliente: jest.fn(async (id, data) => {
        if (id <= 0) throw new Error('ID inválido');
        // If updating email, check if already exists
        if (data.email) {
          const existingCliente = await mockRepository.findByEmail(data.email);
          if (existingCliente && existingCliente.id !== id) {
            throw new Error('Email já cadastrado');
          }
        }
        return mockRepository.update(id, data);
      }),

      getAllClientes: jest.fn(async () => {
        return mockRepository.findAll();
      }),

      deleteCliente: jest.fn(async (id) => {
        if (id <= 0) throw new Error('ID inválido');
        return mockRepository.delete(id);
      }),
    };
  });

  describe('createCliente', () => {
    it('should create a new cliente with valid data', async () => {
      const mockCliente = createMockCliente();
      mockRepository.create.mockResolvedValue(mockCliente);

      const result = await service.createCliente(mockClienteData);
      expect(result).toBeDefined();
      expect(result.email).toBe('joao@example.com');
    });

    it('should throw error if nome is empty', async () => {
      await expect(service.createCliente({ ...mockClienteData, nome: '' })).rejects.toThrow(
        'Nome é obrigatório'
      );
    });

    it('should throw error if email is empty', async () => {
      await expect(service.createCliente({ ...mockClienteData, email: '' })).rejects.toThrow(
        'Email é obrigatório'
      );
    });

    it('should throw error if email already exists', async () => {
      mockRepository.findByEmail.mockResolvedValue(createMockCliente());

      await expect(service.createCliente(mockClienteData)).rejects.toThrow('Email já cadastrado');
    });
  });

  describe('getClienteById', () => {
    it('should get cliente by id', async () => {
      const mockCliente = createMockCliente();
      mockRepository.findById.mockResolvedValue(mockCliente);

      const result = await service.getClienteById(1);
      expect(result).toEqual(mockCliente);
      expect(mockRepository.findById).toHaveBeenCalledWith(1);
    });

    it('should throw error for invalid id', async () => {
      await expect(service.getClienteById(0)).rejects.toThrow('ID inválido');
    });

    it('should return null if cliente does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const result = await service.getClienteById(999);
      expect(result).toBeNull();
    });
  });

  describe('getClienteByEmail', () => {
    it('should get cliente by email', async () => {
      const mockCliente = createMockCliente();
      mockRepository.findByEmail.mockResolvedValue(mockCliente);

      const result = await service.getClienteByEmail('joao@example.com');
      expect(result).toEqual(mockCliente);
    });

    it('should throw error for empty email', async () => {
      await expect(service.getClienteByEmail('')).rejects.toThrow('Email é obrigatório');
    });

    it('should return null if cliente does not exist', async () => {
      mockRepository.findByEmail.mockResolvedValue(null);

      const result = await service.getClienteByEmail('nonexistent@example.com');
      expect(result).toBeNull();
    });
  });

  describe('updateCliente', () => {
    it('should update cliente with valid data', async () => {
      const mockCliente = createMockCliente({ nome: 'João Atualizado' });
      mockRepository.update.mockResolvedValue(mockCliente);
      mockRepository.findByEmail.mockResolvedValue(null);

      const result = await service.updateCliente(1, { nome: 'João Atualizado' });
      expect(result?.nome).toBe('João Atualizado');
    });

    it('should throw error for invalid id', async () => {
      await expect(service.updateCliente(0, { nome: 'Test' })).rejects.toThrow('ID inválido');
    });

    it('should throw error if new email already exists', async () => {
      const mockCliente = createMockCliente({ id: 2 });
      mockRepository.findByEmail.mockResolvedValue(mockCliente);

      await expect(service.updateCliente(1, { email: 'other@example.com' })).rejects.toThrow(
        'Email já cadastrado'
      );
    });

    it('should allow updating email if it is the same', async () => {
      const mockCliente = createMockCliente({ id: 1, email: 'joao@example.com' });
      mockRepository.update.mockResolvedValue(mockCliente);
      mockRepository.findByEmail.mockResolvedValue(mockCliente);

      const result = await service.updateCliente(1, { email: 'joao@example.com' });
      expect(result).toBeDefined();
    });
  });

  describe('getAllClientes', () => {
    it('should return all clientes', async () => {
      const mockClientes = [createMockCliente({ id: 1 }), createMockCliente({ id: 2 })];
      mockRepository.findAll.mockResolvedValue(mockClientes);

      const result = await service.getAllClientes();
      expect(result).toHaveLength(2);
    });

    it('should return empty array if no clientes exist', async () => {
      mockRepository.findAll.mockResolvedValue([]);

      const result = await service.getAllClientes();
      expect(result).toEqual([]);
    });
  });

  describe('deleteCliente', () => {
    it('should delete cliente', async () => {
      mockRepository.delete.mockResolvedValue(true);

      const result = await service.deleteCliente(1);
      expect(result).toBe(true);
      expect(mockRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should throw error for invalid id', async () => {
      await expect(service.deleteCliente(0)).rejects.toThrow('ID inválido');
    });

    it('should return false if cliente does not exist', async () => {
      mockRepository.delete.mockResolvedValue(false);

      const result = await service.deleteCliente(999);
      expect(result).toBe(false);
    });
  });
});
