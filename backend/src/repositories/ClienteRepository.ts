import { PrismaClient } from '@prisma/client';
import { Cliente, CreateClienteInput, UpdateClienteInput } from '../types/cliente';

const prisma = new PrismaClient();

function normalizeFinanceiro(cliente: any): Cliente {
  const financeiroRaw = cliente?.financeiro;
  const financeiro = Array.isArray(financeiroRaw)
    ? financeiroRaw[0] || null
    : financeiroRaw || null;

  const limiteCredito = Number(financeiro?.limite_credito ?? 0);
  const saldoUtilizado = Number(financeiro?.saldo_utilizado ?? 0);

  return {
    ...cliente,
    financeiro,
    limite_credito: limiteCredito,
    credito_utilizado: saldoUtilizado,
    saldo_restante: limiteCredito - saldoUtilizado,
  } as Cliente;
}

export class ClienteRepository {
  async findAll(): Promise<Cliente[]> {
    const clientes = await prisma.cliente.findMany({
      orderBy: { id_cliente: 'desc' },
      include: {
        pagamento: true,
        pedido: true,
        financeiro: true,
      },
    });

    return clientes.map((cliente) => normalizeFinanceiro(cliente));
  }

  async findById(id: number): Promise<Cliente | null> {
    const cliente = await prisma.cliente.findUnique({
      where: { id_cliente: id },
      include: {
        pagamento: true,
        pedido: true,
        financeiro: true,
      },
    });

    return cliente ? normalizeFinanceiro(cliente) : null;
  }

  async create(data: CreateClienteInput): Promise<Cliente> {
    const cliente = await prisma.cliente.create({
      data: {
        nome: data.nome,
        status: data.status,
      },
      include: {
        pagamento: true,
        pedido: true,
        financeiro: true,
      },
    });

    await prisma.financeiro.upsert({
      where: { id_cliente: cliente.id_cliente },
      update: {
        limite_credito: Number(data.limite_credito ?? 0),
        ultimo_limite: Number(data.limite_credito ?? 0),
        usuario_alteracao: 'SISTEMA',
      },
      create: {
        id_cliente: cliente.id_cliente,
        limite_credito: Number(data.limite_credito ?? 0),
        saldo_utilizado: 0,
        ultimo_limite: Number(data.limite_credito ?? 0),
        data_criacao: new Date(),
        usuario_alteracao: 'SISTEMA',
      },
    });

    const clienteComFinanceiro = await prisma.cliente.findUnique({
      where: { id_cliente: cliente.id_cliente },
      include: {
        pagamento: true,
        pedido: true,
        financeiro: true,
      },
    });

    return normalizeFinanceiro(clienteComFinanceiro);
  }

  async update(id: number, data: UpdateClienteInput): Promise<Cliente> {
    await prisma.cliente.update({
      where: { id_cliente: id },
      data: {
        nome: data.nome,
        status: data.status,
      } as any,
      include: {
        pagamento: true,
        pedido: true,
        financeiro: true,
      },
    });

    if (typeof data.limite_credito === 'number') {
      const limite = Number(data.limite_credito);
      await prisma.financeiro.upsert({
        where: { id_cliente: id },
        update: {
          ultimo_limite: (await prisma.financeiro.findUnique({ where: { id_cliente: id } }))?.limite_credito ?? limite,
          limite_credito: limite,
          usuario_alteracao: 'SISTEMA',
        },
        create: {
          id_cliente: id,
          limite_credito: limite,
          saldo_utilizado: 0,
          ultimo_limite: limite,
          data_criacao: new Date(),
          usuario_alteracao: 'SISTEMA',
        },
      });
    }

    const clienteComFinanceiro = await prisma.cliente.findUnique({
      where: { id_cliente: id },
      include: {
        pagamento: true,
        pedido: true,
        financeiro: true,
      },
    });

    return normalizeFinanceiro(clienteComFinanceiro);
  }

  async delete(id: number): Promise<Cliente> {
    const cliente = await prisma.cliente.delete({
      where: { id_cliente: id },
      include: {
        pagamento: true,
        pedido: true,
        financeiro: true,
      },
    });

    return normalizeFinanceiro(cliente);
  }

  async countUsuarios(id_cliente: number): Promise<number> {
    return prisma.usuario.count({ where: { id_cliente } });
  }

  async countPedidos(id_cliente: number): Promise<number> {
    return prisma.pedido.count({ where: { id_cliente } });
  }

  async countPagamentos(id_cliente: number): Promise<number> {
    return prisma.pagamento.count({ where: { id_cliente } });
  }

  async countPedidosPendentes(id_cliente: number): Promise<number> {
    return prisma.pedido.count({
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
}