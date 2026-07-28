import { useState, useEffect, useCallback } from 'react';
import { fornecedorService, Fornecedor } from '../services/fornecedorService';

/**
 * Hook para gerenciar fornecedores.
 * @returns {object} Estado e funções para manipular fornecedores.
 */
export function useFornecedores() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const load = useCallback(async (page = 1, q?: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await fornecedorService.getAll(page, 10, q);
      setFornecedores(result.data);
      setTotal(result.total);
      setCurrentPage(page);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Erro ao carregar fornecedores');
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(async (data: any) => {
    return await fornecedorService.create(data);
  }, []);

  const update = useCallback(async (id: number, data: any) => {
    return await fornecedorService.update(id, data);
  }, []);

  const remove = useCallback(async (id: number) => {
    await fornecedorService.delete(id);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { fornecedores, loading, error, total, currentPage, load, create, update, remove };
}
