import { useState, useEffect, useCallback } from 'react';
import { clienteService } from '../services/clienteService';
import { Cliente } from '../types';
import { mapperCliente } from '../mapper/mapperCliente';

/**
 * Hook para gerenciar clientes.
 * @returns {object} Estado e funções para manipular clientes.
 */
export function useClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const load = useCallback(async (page = 1, q?: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await clienteService.getAllClientes(page, 10, q);
      setClientes((result.data || []).map(mapperCliente));
      setTotal(result.total);
      setCurrentPage(page);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  }, []);

  const getById = useCallback(async (id: number) => {
    return await clienteService.getClienteById(id);
  }, []);

  const create = useCallback(async (data: any) => {
    const result = await clienteService.createCliente(data);
    return mapperCliente(result);
  }, []);

  const update = useCallback(async (id: number, data: any) => {
    return await clienteService.updateCliente(id, data);
  }, []);

  const remove = useCallback(async (id: number) => {
    await clienteService.deleteCliente(id);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { clientes, loading, error, total, currentPage, load, getById, create, update, remove };
}
