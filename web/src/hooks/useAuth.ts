import { useState, useEffect, useCallback } from 'react';
import { authService, AuthUser, AUTH_CHANGED_EVENT } from '../services/authService';

/**
 * Hook para gerenciar autenticação.
 * @returns {object} Estado e funções de autenticação.
 */
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(authService.getCurrentUser());

  useEffect(() => {
    const syncUser = () => setUser(authService.getCurrentUser());
    window.addEventListener(AUTH_CHANGED_EVENT, syncUser);
    window.addEventListener('storage', syncUser);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, syncUser);
      window.removeEventListener('storage', syncUser);
    };
  }, []);

  const login = useCallback(async (usuario: string, senha: string) => {
    return await authService.login(usuario, senha);
  }, []);

  const logout = useCallback(() => {
    authService.logout();
  }, []);

  const isAdmin = user?.id_perfil === 1;
  const isAuthenticated = !!user;

  return { user, isAdmin, isAuthenticated, login, logout };
}
