import { useState, useEffect, useCallback } from 'react';
import { pagamentoService, Pagamento } from '../services/pagamentoService';

/**
 * Hook para gerenciar pagamentos.
 * @returns {object} Estado e funções para manipular pagamentos.
 */
export function usePagamentos() {
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const load = useCallback(async (page = 1, q?: string, status?: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await pagamentoService.getAllPagamentos(page, 10, q, status);
      setPagamentos(result.data);
      setTotal(result.total);
      setCurrentPage(page);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Erro ao carregar pagamentos');
    } finally {
      setLoading(false);
    }
  }, []);

  const getById = useCallback(async (id: number) => {
    return await pagamentoService.getPagamentoById(id);
  }, []);

  const create = useCallback(async (data: any) => {
    return await pagamentoService.createPagamento(data);
  }, []);

  const updateStatus = useCallback(async (id: number, status: string) => {
    return await pagamentoService.updatePagamentoStatus(id, status);
  }, []);

  const remove = useCallback(async (id: number) => {
    await pagamentoService.deletePagamento(id);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { pagamentos, loading, error, total, currentPage, load, getById, create, updateStatus, remove };
}
