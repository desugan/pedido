import { UsuarioRepository } from '../repositories/UsuarioRepository';
import { CreateUsuarioInput, Perfil, UpdateUsuarioInput, Usuario } from '../types/usuario';
import { createHash } from 'crypto';

export class UsuarioService {
  private repository = new UsuarioRepository();

  private toMd5(value: string): string {
    return createHash('md5').update(value).digest('hex');
  }

  private looksLikeMd5(value: string): boolean {
    return /^[a-f0-9]{32}$/i.test(value);
  }

  private normalizeSenha(value: string): string {
    const senha = (value || '').trim();
    if (!senha) return '';
    return this.looksLikeMd5(senha) ? senha.toLowerCase() : this.toMd5(senha);
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
      senha: this.normalizeSenha(data.senha),
    });
  }

  async updateUsuario(id: number, data: UpdateUsuarioInput): Promise<Usuario | null> {
    if (!id || id <= 0) throw new Error('ID inválido');

    const existing = await this.repository.findById(id);
    if (!existing) return null;

    const pedidosPendentes = await this.repository.countPedidosPendentesByCliente(existing.id_cliente);
    if (pedidosPendentes > 0) {
      await this.repository.updateClienteStatus(existing.id_cliente, 'INADIMPLENTE');
    }

    const payload: UpdateUsuarioInput = { ...data };

    if (typeof payload.senha === 'string') {
      const normalized = this.normalizeSenha(payload.senha);
      if (normalized) {
        payload.senha = normalized;
      } else {
        delete payload.senha;
      }
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
    return this.repository.update(id, { senha: this.toMd5('123456') });
  }

  async getPerfis(): Promise<Perfil[]> {
    return this.repository.findPerfis();
  }
}
