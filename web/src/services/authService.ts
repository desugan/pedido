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
  /**
   * Realiza login do usuário.
   * @param {string} usuario - Nome de usuário.
   * @param {string} senha - Senha do usuário.
   * @returns {Promise<AuthUser>} Dados do usuário autenticado.
   */
  async login(usuario: string, senha: string): Promise<AuthUser> {
    const response = await api.post('/api/auth/login', {
      usuario: usuario.trim(),
      senha: senha.trim(),
    });
    const { token, user } = response.data as { token: string; user: AuthUser };
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
    return user;
  },

  /**
   * Altera a senha do usuário logado.
   * @param {string} senhaAtual - Senha atual.
   * @param {string} novaSenha - Nova senha.
   * @param {string} confirmarSenha - Confirmação da nova senha.
   * @returns {Promise<void>}
   */
  async alterarSenha(
    senhaAtual: string,
    novaSenha: string,
    confirmarSenha: string
  ): Promise<void> {
    await api.post('/api/auth/alterar-senha', {
      senha_atual: senhaAtual,
      nova_senha: novaSenha,
      confirmar_senha: confirmarSenha,
    });
  },

  /**
   * Remove token e dados do usuário do localStorage.
   */
  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  },

  /**
   * Retorna o usuário logado do localStorage.
   * @returns {AuthUser | null} Dados do usuário ou null.
   */
  getCurrentUser(): AuthUser | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  },

  /**
   * Verifica se há usuário logado.
   * @returns {boolean} True se logado.
   */
  isAuthenticated(): boolean {
    return !!this.getCurrentUser();
  },
};
