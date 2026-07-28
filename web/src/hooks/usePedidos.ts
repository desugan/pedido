import { useState, useEffect, useCallback } from 'react';
import { pedidoService, Pedido } from '../services/pedidoService';
import { mapperPedido } from '../mapper/mapperPedido';

/**
 * Hook para gerenciar pedidos.
 * @returns {object} Estado e funções para manipular pedidos.
 */
export function usePedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const loadPedidos = useCallback(async (page = 1, q?: string, status?: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await pedidoService.getAllPedidos(page, 10, q, status);
      setPedidos(result.data);
      setTotal(result.total);
      setCurrentPage(page);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadByCliente = useCallback(async (clienteId: number, page = 1, status?: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await pedidoService.getPedidosByClienteId(clienteId, page, 10, status);
      setPedidos(result.data);
      setTotal(result.total);
      setCurrentPage(page);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(async (data: any) => {
    const result = await pedidoService.createPedido(data);
    return mapperPedido(result);
  }, []);

  const updateStatus = useCallback(async (id: number, status: string) => {
    return await pedidoService.updatePedidoStatus(id, status);
  }, []);

  const remove = useCallback(async (id: number) => {
    await pedidoService.deletePedido(id);
  }, []);

  return { pedidos, loading, error, total, currentPage, loadPedidos, loadByCliente, create, updateStatus, remove };
}
