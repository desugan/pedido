import { useState, useEffect, useCallback } from 'react';
import { lancamentoService, Lancamento } from '../services/lancamentoService';
import { fornecedorService, Fornecedor } from '../services/fornecedorService';
import { produtoService, Produto } from '../services/produtoService';

/**
 * Hook para gerenciar lançamentos de estoque.
 * @returns {object} Estado e funções para manipular lançamentos.
 */
export function useLancamentos() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const load = useCallback(async (page = 1, q?: string) => {
    try {
      setLoading(true);
      setError(null);
      const [l, f, p] = await Promise.all([
        lancamentoService.getAll(page, 10, q),
        fornecedorService.getAll(1, 10000),
        produtoService.getAll(1, 10000),
      ]);
      setLancamentos(l.data);
      setTotal(l.total);
      setCurrentPage(page);
      setFornecedores(f.data ?? f);
      setProdutos(p.data);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Erro ao carregar lançamentos');
    } finally {
      setLoading(false);
    }
  }, []);

  const getById = useCallback(async (id: number) => {
    return await lancamentoService.getById(id);
  }, []);

  const create = useCallback(async (data: any) => {
    return await lancamentoService.create(data);
  }, []);

  const updateStatus = useCallback(async (id: number, status: string) => {
    return await lancamentoService.updateStatus(id, status);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { lancamentos, fornecedores, produtos, loading, error, total, currentPage, load, getById, create, updateStatus };
}
