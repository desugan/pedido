import { useState, useEffect, useCallback } from 'react';
import { produtoService, Produto, ProdutoResumo } from '../services/produtoService';

/**
 * Hook para gerenciar produtos.
 * @returns {object} Estado e funções para manipular produtos.
 */
export function useProdutos() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [resumo, setResumo] = useState<ProdutoResumo>({ total_produtos: 0, total_estoque: 0, valor_estoque: 0 });

  const loadResumo = useCallback(async () => {
    try {
      const data = await produtoService.getResumo();
      setResumo(data);
    } catch {
      // fallback silencioso
    }
  }, []);

  const load = useCallback(async (page = 1, q?: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await produtoService.getAll(page, 10, q);
      setProdutos(result.data);
      setTotal(result.total);
      setCurrentPage(page);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(async (data: any) => {
    return await produtoService.create(data);
  }, []);

  const update = useCallback(async (id: number, data: any) => {
    return await produtoService.update(id, data);
  }, []);

  const remove = useCallback(async (id: number) => {
    await produtoService.delete(id);
  }, []);

  useEffect(() => { load(); loadResumo(); }, [load, loadResumo]);

  return { produtos, loading, error, total, currentPage, resumo, load, create, update, remove };
}
