import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type Totais = {
  quantidade: number;
  valorTotal: number;
  valorMedio: number;
  statusCount: Record<string, number>;
};

function calcularTotais<T extends { status?: string | null }>(dados: T[], valorFn: (item: T) => number): Totais {
  const quantidade = dados.length;
  const valorTotal = dados.reduce((acc, item) => acc + valorFn(item), 0);
  const valorMedio = quantidade > 0 ? valorTotal / quantidade : 0;

  const statusCount = dados.reduce((acc, item) => {
    const key = item.status || 'sem_status';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return { quantidade, valorTotal, valorMedio, statusCount };
}

export class RelatorioService {
  private getFinanceiro(cliente: any): any {
    const financeiroRaw = cliente?.financeiro;
    return Array.isArray(financeiroRaw)
      ? financeiroRaw[0] || null
      : financeiroRaw || null;
  }

  async gerarRelatorioPedidos(dataInicio?: string, dataFim?: string, status?: string) {
    const where: any = {};

    if (dataInicio || dataFim) {
      where.data = {};
      if (dataInicio) where.data.gte = new Date(dataInicio);
      if (dataFim) where.data.lte = new Date(dataFim);
    }

    if (status) {
      where.status = status;
    }

    const dados = await prisma.pedido.findMany({
      where,
      orderBy: { data: 'desc' },
      include: { cliente: true, pedido_item: true },
    });

    return {
      tipo: 'pedidos',
      periodo: { dataInicio: dataInicio || null, dataFim: dataFim || null },
      totais: calcularTotais(dados, (item) => item.total),
      dados,
    };
  }

  async gerarRelatorioPagamentos(dataInicio?: string, dataFim?: string, status?: string) {
    const where: any = {};

    if (dataInicio || dataFim) {
      where.data_criacao = {};
      if (dataInicio) where.data_criacao.gte = new Date(dataInicio);
      if (dataFim) where.data_criacao.lte = new Date(dataFim);
    }

    if (status) {
      where.status = status;
    }

    const dados = await prisma.pagamento.findMany({
      where,
      orderBy: { data_criacao: 'desc' },
      include: { cliente: true, pagamentopedido: true },
    });

    return {
      tipo: 'pagamentos',
      periodo: { dataInicio: dataInicio || null, dataFim: dataFim || null },
      totais: calcularTotais(dados, (item) => item.valor),
      dados,
    };
  }

  async gerarRelatorioClientes(status?: string) {
    const where: any = {};
    if (status) {
      where.status = status;
    }

    const clientes = await prisma.cliente.findMany({
      where,
      orderBy: { id_cliente: 'desc' },
      include: { pedido: true, pagamento: true, financeiro: true },
    });

    const dados = clientes.map((cliente) => {
      const financeiro = this.getFinanceiro(cliente as any);
      const limiteCredito = Number(financeiro?.limite_credito ?? 0);
      const saldoUtilizado = Number(financeiro?.saldo_utilizado ?? 0);
      const saldoRestante = limiteCredito - saldoUtilizado;

      return {
        ...cliente,
        limite_credito: limiteCredito,
        saldo_restante: saldoRestante,
        credito_utilizado: saldoUtilizado,
      };
    });

    const quantidade = dados.length;
    const totalPedidos = dados.reduce((acc, c) => acc + c.pedido.length, 0);
    const totalPagamentos = dados.reduce((acc, c) => acc + c.pagamento.length, 0);
    const limiteCreditoTotal = dados.reduce((acc, c) => acc + Number(c.limite_credito || 0), 0);
    const saldoRestanteTotal = dados.reduce((acc, c) => acc + Number(c.saldo_restante || 0), 0);
    const creditoUtilizadoTotal = dados.reduce((acc, c) => acc + Number(c.credito_utilizado || 0), 0);

    return {
      tipo: 'clientes',
      totais: {
        quantidade,
        totalPedidos,
        totalPagamentos,
        limiteCreditoTotal,
        saldoRestanteTotal,
        creditoUtilizadoTotal,
      },
      dados,
    };
  }

  async gerarRelatorioVendas(dataInicio?: string, dataFim?: string) {
    const where: any = { status: { not: 'cancelado' } };

    if (dataInicio || dataFim) {
      where.data = {};
      if (dataInicio) where.data.gte = new Date(dataInicio);
      if (dataFim) where.data.lte = new Date(dataFim);
    }

    const pedidos = await prisma.pedido.findMany({
      where,
      orderBy: { data: 'desc' },
      include: { cliente: true },
    });

    const faturamento = pedidos.reduce((acc, p) => acc + p.total, 0);
    const ticketMedio = pedidos.length > 0 ? faturamento / pedidos.length : 0;

    return {
      tipo: 'vendas',
      periodo: { dataInicio: dataInicio || null, dataFim: dataFim || null },
      totais: {
        quantidadePedidos: pedidos.length,
        faturamento,
        ticketMedio,
      },
      dados: pedidos,
    };
  }

  async gerarRelatorioUsuario(id_cliente: number) {
    const cliente = await prisma.cliente.findUnique({ 
      where: { id_cliente },
      include: { financeiro: true },
    });

    const pedidos = await prisma.pedido.findMany({
      where: { id_cliente },
      orderBy: { data: 'desc' },
      include: { pedido_item: { include: { produto: true } } },
    });

    const pagamentos = await prisma.pagamento.findMany({
      where: { id_cliente },
      orderBy: { data_criacao: 'desc' },
      include: { pagamentopedido: true },
    });

    const totalPedidos = pedidos.length;
    const valorTotalPedidos = pedidos.reduce((acc, p) => acc + p.total, 0);
    const totalPagamentos = pagamentos.length;
    const valorTotalPagamentos = pagamentos.reduce((acc, p) => acc + p.valor, 0);
    
    const financeiro = this.getFinanceiro(cliente as any);
    const limiteCredito = Number(financeiro?.limite_credito ?? 0);
    const saldoUtilizado = Number(financeiro?.saldo_utilizado ?? 0);
    const saldoRestante = limiteCredito - saldoUtilizado;

    const statusPedidos = pedidos.reduce((acc, p) => {
      const key = p.status || 'sem_status';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      tipo: 'usuario',
      cliente: cliente
        ? {
          ...cliente,
          limite_credito: limiteCredito,
          saldo_restante: saldoRestante,
          credito_utilizado: saldoUtilizado,
        }
        : null,
      totais: {
        totalPedidos,
        valorTotalPedidos,
        totalPagamentos,
        valorTotalPagamentos,
        limiteCredito,
        saldoRestante,
        creditoUtilizado: saldoUtilizado,
        ...statusPedidos,
      },
      pedidos,
      pagamentos,
      dados: pedidos,
    };
  }
}
