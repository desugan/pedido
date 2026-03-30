import { PrismaClient } from '@prisma/client';
import { CreateUsuarioInput, Perfil, UpdateUsuarioInput, Usuario } from '../types/usuario';

const prisma = new PrismaClient();
const prismaAny = prisma as any;

function maskSenha(value: string): string {
  const senha = (value || '').trim();
  if (!senha) return '';
  if (senha.length <= 8) return '********';
  return `${senha.slice(0, 4)}...${senha.slice(-4)}`;
}

async function mapUsuariosWithNames(items: Array<{ id_usuario: number; id_cliente: number; id_perfil: number; usuario: string; senha: string }>): Promise<Usuario[]> {
  const clienteIds = Array.from(new Set(items.map((u) => u.id_cliente)));
  const perfilIds = Array.from(new Set(items.map((u) => u.id_perfil)));

  const [clientes, perfis] = await Promise.all([
    prismaAny.cliente.findMany({ where: { id_cliente: { in: clienteIds } }, select: { id_cliente: true, nome: true } }),
    prismaAny.perfil.findMany({ where: { id_perfil: { in: perfilIds } }, select: { id_perfil: true, perfil: true } }),
  ]);

  const clienteMap = new Map<number, string>(clientes.map((c: { id_cliente: number; nome: string }) => [c.id_cliente, c.nome]));
  const perfilMap = new Map<number, string>(perfis.map((p: { id_perfil: number; perfil: string }) => [p.id_perfil, p.perfil]));

  return items.map((data) => ({
    id_usuario: data.id_usuario,
    id_cliente: data.id_cliente,
    id_perfil: data.id_perfil,
    usuario: data.usuario,
    senha: maskSenha(data.senha),
    cliente_nome: clienteMap.get(data.id_cliente),
    perfil_nome: perfilMap.get(data.id_perfil),
  }));
}

function mapUsuario(
  data: { id_usuario: number; id_cliente: number; id_perfil: number; usuario: string; senha: string },
  clienteNome?: string,
  perfilNome?: string
): Usuario {
  return {
    id_usuario: data.id_usuario,
    id_cliente: data.id_cliente,
    id_perfil: data.id_perfil,
    usuario: data.usuario,
    senha: maskSenha(data.senha),
    cliente_nome: clienteNome,
    perfil_nome: perfilNome,
  };
}

export class UsuarioRepository {
  async findAll(): Promise<Usuario[]> {
    const users = await prismaAny.usuario.findMany({ orderBy: { id_usuario: 'desc' } });
    return mapUsuariosWithNames(users);
  }

  async findById(id: number): Promise<Usuario | null> {
    const user = await prismaAny.usuario.findUnique({ where: { id_usuario: id } });
    if (!user) return null;

    const [cliente, perfil] = await Promise.all([
      prismaAny.cliente.findUnique({ where: { id_cliente: user.id_cliente }, select: { nome: true } }),
      prismaAny.perfil.findUnique({ where: { id_perfil: user.id_perfil }, select: { perfil: true } }),
    ]);

    return mapUsuario(user, cliente?.nome, perfil?.perfil);
  }

  async create(data: CreateUsuarioInput): Promise<Usuario> {
    const created = await prismaAny.usuario.create({ data });

    const [cliente, perfil] = await Promise.all([
      prismaAny.cliente.findUnique({ where: { id_cliente: created.id_cliente }, select: { nome: true } }),
      prismaAny.perfil.findUnique({ where: { id_perfil: created.id_perfil }, select: { perfil: true } }),
    ]);

    return mapUsuario(created, cliente?.nome, perfil?.perfil);
  }

  async update(id: number, data: UpdateUsuarioInput): Promise<Usuario | null> {
    const existing = await prismaAny.usuario.findUnique({ where: { id_usuario: id } });
    if (!existing) return null;

    const updated = await prismaAny.usuario.update({ where: { id_usuario: id }, data });

    const [cliente, perfil] = await Promise.all([
      prismaAny.cliente.findUnique({ where: { id_cliente: updated.id_cliente }, select: { nome: true } }),
      prismaAny.perfil.findUnique({ where: { id_perfil: updated.id_perfil }, select: { perfil: true } }),
    ]);

    return mapUsuario(updated, cliente?.nome, perfil?.perfil);
  }

  async delete(id: number): Promise<boolean> {
    const existing = await prismaAny.usuario.findUnique({ where: { id_usuario: id } });
    if (!existing) return false;

    await prismaAny.usuario.delete({ where: { id_usuario: id } });
    return true;
  }

  async countPedidosByCliente(id_cliente: number): Promise<number> {
    return prismaAny.pedido.count({ where: { id_cliente } });
  }

  async countPedidosPendentesByCliente(id_cliente: number): Promise<number> {
    return prismaAny.pedido.count({
      where: {
        id_cliente,
        OR: [
          { status: 'pendente' },
          { status: 'PENDENTE' },
          { status: 'aberto' },
          { status: 'ABERTO' },
        ],
      },
    });
  }

  async updateClienteStatus(id_cliente: number, status: string): Promise<void> {
    await prismaAny.cliente.update({ where: { id_cliente }, data: { status } });
  }

  async findPerfis(): Promise<Perfil[]> {
    return prismaAny.perfil.findMany({ orderBy: { id_perfil: 'asc' } });
  }
}
