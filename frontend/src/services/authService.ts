import api from './api';

export const AUTH_CHANGED_EVENT = 'auth-changed';

export interface AuthUser {
  id_usuario: number;
  usuario: string;
  id_perfil: number;
  perfil: string | null;
  id_cliente: number;
  cliente_nome: string | null;
}

const STORAGE_KEY = 'buteco_user';
const TOKEN_KEY = 'buteco_token';

export const authService = {
  async login(usuario: string, senha: string): Promise<AuthUser> {
    const response = await api.post('/api/auth/login', {
      email: usuario.trim(),
      password: senha.trim(),
    });
    const { token, user } = response.data as { token: string; user: AuthUser };
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
    return user;
  },

  async alterarSenha(
    senhaAtual: string,
    novaSenha: string,
    confirmarSenha: string
  ): Promise<void> {
    await api.post('/api/auth/alterar-senha', {
      senhaAtual,
      novaSenha,
      confirmarSenha,
    });
  },

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  },

  getCurrentUser(): AuthUser | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  },

  isAuthenticated(): boolean {
    return !!this.getCurrentUser();
  },
};
