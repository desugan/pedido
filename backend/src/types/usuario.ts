export interface Usuario {
  id_usuario: number;
  id_cliente: number;
  id_perfil: number;
  usuario: string;
  cliente_nome?: string;
  perfil_nome?: string;
}

export interface CreateUsuarioInput {
  id_cliente: number;
  id_perfil: number;
  usuario: string;
  senha: string;
}

export interface UpdateUsuarioInput {
  id_cliente?: number;
  id_perfil?: number;
  usuario?: string;
  senha?: string;
}

export interface Perfil {
  id_perfil: number;
  perfil: string;
}
