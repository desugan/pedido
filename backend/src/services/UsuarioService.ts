import { UsuarioRepository } from '../repositories/UsuarioRepository';
import { CreateUsuarioInput, Perfil, UpdateUsuarioInput, Usuario } from '../types/usuario';
import bcrypt from 'bcryptjs';

export class UsuarioService {
  private repository = new UsuarioRepository();

  private async hashSenha(value: string): Promise<string> {
    return bcrypt.hash(value.trim(), 12);
  }

  async getAllUsuarios(): Promise<Usuario[]> {
    return this.repository.findAll();
  }

  async getUsuarioById(id: number): Promise<Usuario | null> {
    if (!id || id <= 0) throw new Error('ID inválido');
    return this.repository.findById(id);
  }

  async createUsuario(data: CreateUsuarioInput): Promise<Usuario> {
    if (!data.usuario || !data.senha) throw new Error('Usuário e senha são obrigatórios');
    if (!data.id_cliente || !data.id_perfil) throw new Error('Cliente e perfil são obrigatórios');

    return this.repository.create({
      ...data,
      senha: await this.hashSenha(data.senha),
    });
  }

  async updateUsuario(id: number, data: UpdateUsuarioInput): Promise<Usuario | null> {
    if (!id || id <= 0) throw new Error('ID inválido');

    const existing = await this.repository.findById(id);
    if (!existing) return null;

    const payload: UpdateUsuarioInput = { ...data };

    if (typeof payload.senha === 'string' && payload.senha.trim()) {
      payload.senha = await this.hashSenha(payload.senha);
    } else {
      delete payload.senha;
    }

    return this.repository.update(id, payload);
  }

  async deleteUsuario(id: number): Promise<boolean> {
    if (!id || id <= 0) throw new Error('ID inválido');

    const existing = await this.repository.findById(id);
    if (!existing) return false;

    const pedidosCount = await this.repository.countPedidosByCliente(existing.id_cliente);
    if (pedidosCount > 0) {
      throw new Error('Usuário possui pedidos e não pode ser excluído');
    }

    return this.repository.delete(id);
  }

  async resetSenha(id: number): Promise<Usuario | null> {
    if (!id || id <= 0) throw new Error('ID inválido');
    return this.repository.update(id, { senha: await this.hashSenha('123456') });
  }

  async getPerfis(): Promise<Perfil[]> {
    return this.repository.findPerfis();
  }
}
