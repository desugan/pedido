import { useState, useEffect, useCallback } from 'react';
import { usuarioService, Usuario, Perfil } from '../services/usuarioService';

/**
 * Hook para gerenciar usuários.
 * @returns {object} Estado e funções para manipular usuários.
 */
export function useUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const load = useCallback(async (page = 1, q?: string) => {
    try {
      setLoading(true);
      setError(null);
      const [u, p] = await Promise.all([
        usuarioService.getAll(page, 10, q),
        usuarioService.getPerfis(),
      ]);
      setUsuarios(u.data);
      setTotal(u.total);
      setCurrentPage(page);
      setPerfis(p);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(async (data: any) => {
    return await usuarioService.create(data);
  }, []);

  const update = useCallback(async (id: number, data: any) => {
    return await usuarioService.update(id, data);
  }, []);

  const remove = useCallback(async (id: number) => {
    await usuarioService.delete(id);
  }, []);

  const resetSenha = useCallback(async (id: number) => {
    return await usuarioService.resetSenha(id);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { usuarios, perfis, loading, error, total, currentPage, load, create, update, remove, resetSenha };
}
