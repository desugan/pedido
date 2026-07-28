import api from './api';

export interface Usuario {
  id_usuario: number;
  id_cliente: number;
  id_perfil: number;
  usuario: string;
  senha: string;
  cliente_nome?: string;
  perfil_nome?: string;
}

export interface Perfil {
  id_perfil: number;
  perfil: string;
}

export interface CreateUsuarioData {
  id_cliente: number;
  id_perfil: number;
  usuario: string;
  senha: string;
}

export const usuarioService = {
  /**
   * Lista usuarios paginados.
   * @param {number} page - Pagina.
   * @param {number} limit - Itens por pagina.
   * @param {string} [q] - Termo de busca.
   * @returns {Promise<{data: Usuario[], total: number}>}
   */
  async getAll(page = 1, limit = 10, q?: string): Promise<{ data: Usuario[]; total: number }> {
    const params: any = { page, limit };
    if (q) params.q = q;
    const response = await api.get('/api/usuarios', { params });
    return { data: response.data.data ?? [], total: response.data.total ?? 0 };
  },

  /**
   * Retorna lista de perfis de usuario.
   * @returns {Promise<Perfil[]>}
   */
  async getPerfis(): Promise<Perfil[]> {
    const response = await api.get('/api/usuarios/perfis');
    return response.data;
  },

  /**
   * Cria um novo usuario.
   * @param {CreateUsuarioData} data - Dados do usuario.
   * @returns {Promise<Usuario>}
   */
  async create(data: CreateUsuarioData): Promise<Usuario> {
    const response = await api.post('/api/usuarios', data);
    return response.data;
  },

  /**
   * Atualiza um usuario.
   * @param {number} id - ID do usuario.
   * @param {Partial<CreateUsuarioData>} data - Dados para atualizar.
   * @returns {Promise<Usuario>}
   */
  async update(id: number, data: Partial<CreateUsuarioData>): Promise<Usuario> {
    const response = await api.put(`/api/usuarios/${id}`, data);
    return response.data;
  },

  /**
   * Deleta um usuario.
   * @param {number} id - ID do usuario.
   * @returns {Promise<void>}
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/api/usuarios/${id}`);
  },

  /**
   * Reseta a senha de um usuario para o padrao.
   * @param {number} id - ID do usuario.
   * @returns {Promise<Usuario>}
   */
  async resetSenha(id: number): Promise<Usuario> {
    const response = await api.post(`/api/usuarios/${id}/reset-senha`);
    return response.data;
  },
};
