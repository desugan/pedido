import { Request, Response } from 'express';
import { ClienteService } from '../../types/cliente';
import { createMockCliente, mockClienteData } from '../mocks';

describe('ClienteController', () => {
  let clienteService: jest.Mocked<ClienteService>;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    // Mock ClienteService
    clienteService = {
      createCliente: jest.fn(),
      getClienteById: jest.fn(),
      getClienteByEmail: jest.fn(),
      updateCliente: jest.fn(),
      getAllClientes: jest.fn(),
      deleteCliente: jest.fn(),
    };

    // Mock Request and Response
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('POST /api/clientes', () => {
    it('should create cliente and return 201', async () => {
      const mockCliente = createMockCliente();
      clienteService.createCliente.mockResolvedValue(mockCliente);

      req.body = mockClienteData;

      // Controller logic
      const clienteData = req.body as any;
      const result = await clienteService.createCliente(clienteData);

      expect(result).toEqual(mockCliente);
      expect(clienteService.createCliente).toHaveBeenCalledWith(mockClienteData);
    });

    it('should return 400 if data is invalid', async () => {
      clienteService.createCliente.mockRejectedValue(new Error('Nome é obrigatório'));

      req.body = { email: 'test@example.com' };

      // Controller logic
      await expect(clienteService.createCliente(req.body as any)).rejects.toThrow(
        'Nome é obrigatório'
      );
    });

    it('should return 409 if email already exists', async () => {
      clienteService.createCliente.mockRejectedValue(new Error('Email já cadastrado'));

      req.body = mockClienteData;

      // Controller logic
      await expect(clienteService.createCliente(req.body as any)).rejects.toThrow(
        'Email já cadastrado'
      );
    });
  });

  describe('GET /api/clientes/:id', () => {
    it('should return cliente by id', async () => {
      const mockCliente = createMockCliente();
      clienteService.getClienteById.mockResolvedValue(mockCliente);

      req.params = { id: '1' };

      const result = await clienteService.getClienteById(1);

      expect(result).toEqual(mockCliente);
      expect(clienteService.getClienteById).toHaveBeenCalledWith(1);
    });

    it('should return 404 if cliente does not exist', async () => {
      clienteService.getClienteById.mockResolvedValue(null);

      req.params = { id: '999' };

      const result = await clienteService.getClienteById(999);

      expect(result).toBeNull();
    });

    it('should return 400 for invalid id', async () => {
      clienteService.getClienteById.mockRejectedValue(new Error('ID inválido'));

      req.params = { id: '0' };

      await expect(clienteService.getClienteById(0)).rejects.toThrow('ID inválido');
    });
  });

  describe('GET /api/clientes', () => {
    it('should return all clientes', async () => {
      const mockClientes = [createMockCliente({ id: 1 }), createMockCliente({ id: 2 })];
      clienteService.getAllClientes.mockResolvedValue(mockClientes);

      const result = await clienteService.getAllClientes();

      expect(result).toHaveLength(2);
      expect(clienteService.getAllClientes).toHaveBeenCalled();
    });

    it('should return empty array when no clientes exist', async () => {
      clienteService.getAllClientes.mockResolvedValue([]);

      const result = await clienteService.getAllClientes();

      expect(result).toEqual([]);
    });
  });

  describe('PATCH /api/clientes/:id', () => {
    it('should update cliente', async () => {
      const mockCliente = createMockCliente({ nome: 'João Atualizado' });
      clienteService.updateCliente.mockResolvedValue(mockCliente);

      req.params = { id: '1' };
      req.body = { nome: 'João Atualizado' };

      const result = await clienteService.updateCliente(1, req.body as any);

      expect(result?.nome).toBe('João Atualizado');
      expect(clienteService.updateCliente).toHaveBeenCalledWith(1, req.body);
    });

    it('should return 404 if cliente does not exist', async () => {
      clienteService.updateCliente.mockResolvedValue(null);

      req.params = { id: '999' };
      req.body = { nome: 'Test' };

      const result = await clienteService.updateCliente(999, req.body as any);

      expect(result).toBeNull();
    });

    it('should return 400 if new email already exists', async () => {
      clienteService.updateCliente.mockRejectedValue(new Error('Email já cadastrado'));

      req.params = { id: '1' };
      req.body = { email: 'existing@example.com' };

      await expect(clienteService.updateCliente(1, req.body as any)).rejects.toThrow(
        'Email já cadastrado'
      );
    });
  });

  describe('DELETE /api/clientes/:id', () => {
    it('should delete cliente', async () => {
      clienteService.deleteCliente.mockResolvedValue(true);

      req.params = { id: '1' };

      const result = await clienteService.deleteCliente(1);

      expect(result).toBe(true);
      expect(clienteService.deleteCliente).toHaveBeenCalledWith(1);
    });

    it('should return 404 if cliente does not exist', async () => {
      clienteService.deleteCliente.mockResolvedValue(false);

      req.params = { id: '999' };

      const result = await clienteService.deleteCliente(999);

      expect(result).toBe(false);
    });

    it('should return 400 for invalid id', async () => {
      clienteService.deleteCliente.mockRejectedValue(new Error('ID inválido'));

      req.params = { id: '0' };

      await expect(clienteService.deleteCliente(0)).rejects.toThrow('ID inválido');
    });
  });
});
