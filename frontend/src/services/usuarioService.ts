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
  async getAll(): Promise<Usuario[]> {
    const response = await api.get('/api/usuarios');
    return response.data;
  },

  async getPerfis(): Promise<Perfil[]> {
    const response = await api.get('/api/usuarios/perfis');
    return response.data;
  },

  async create(data: CreateUsuarioData): Promise<Usuario> {
    const response = await api.post('/api/usuarios', data);
    return response.data;
  },

  async update(id: number, data: Partial<CreateUsuarioData>): Promise<Usuario> {
    const response = await api.put(`/api/usuarios/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/api/usuarios/${id}`);
  },

  async resetSenha(id: number): Promise<Usuario> {
    const response = await api.post(`/api/usuarios/${id}/reset-senha`);
    return response.data;
  },
};
