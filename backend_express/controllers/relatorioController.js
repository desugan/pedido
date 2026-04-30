const prisma = require('../db/prisma');

const _iso = (value) => {
  if (value && typeof value.toISOString === 'function') {
    return value.toISOString();
  }
  return value;
};

const _dateFilter = (col, ini, fim) => {
  const clauses = [];
  const params = [];
  if (ini) { clauses.push(`${col} >= '${ini}'`); }
  if (fim) { clauses.push(`${col} <= '${fim}'`); }
  return clauses;
};

const _statusCount = (rows, key = 'status') => {
  const counts = {};
  for (const row of rows) {
    const status = String(row[key] || 'sem_status');
    counts[status] = (counts[status] || 0) + 1;
  }
  return counts;
};

const _latestFinanceiroJoin = async (clienteId) => {
  return await prisma.financeiro.findFirst({
    where: { id_cliente: clienteId },
    orderBy: { id_financeiro: 'desc' }
  });
};

exports.relPedidos = async (req, res) => {
  try {
    const { dataInicio, dataFim, status } = req.query;
    const where = {};
    if (status) where.status = status;
    if (dataInicio || dataFim) {
      where.data = {};
      if (dataInicio) where.data.gte = new Date(dataInicio);
      if (dataFim) where.data.lte = new Date(dataFim);
    }

    const dados = await prisma.pedido.findMany({
      where,
      include: { cliente: { select: { nome: true } } },
      orderBy: { data: 'desc' }
    });

    const mapped = dados.map(d => ({
      id_pedido: d.id_pedido,
      id_cliente: d.id_cliente,
      cliente_nome: d.cliente?.nome,
      total: parseFloat(d.total),
      data: _iso(d.data),
      status: d.status
    }));

    const total = mapped.reduce((acc, d) => acc + d.total, 0);
    res.json({
      tipo: 'pedidos',
      periodo: { dataInicio, dataFim },
      totais: {
        quantidade: mapped.length,
        valorTotal: total,
        valorMedio: mapped.length ? total / mapped.length : 0,
        statusCount: _statusCount(mapped)
      },
      dados: mapped
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar relatório de pedidos' });
  }
};

exports.relPagamentos = async (req, res) => {
  try {
    const { dataInicio, dataFim, status } = req.query;
    const where = {};
    if (status) where.status = status;
    if (dataInicio || dataFim) {
      where.data_criacao = {};
      if (dataInicio) where.data_criacao.gte = new Date(dataInicio);
      if (dataFim) where.data_criacao.lte = new Date(dataFim);
    }

    const dados = await prisma.pagamento.findMany({
      where,
      include: { cliente: { select: { nome: true } } },
      orderBy: { data_criacao: 'desc' }
    });

    const mapped = dados.map(d => ({
      id_pagamento: d.id_pagamento,
      id_cliente: d.id_cliente,
      cliente_nome: d.cliente?.nome,
      valor: parseFloat(d.valor),
      status: d.status,
      data_criacao: _iso(d.data_criacao)
    }));

    const total = mapped.reduce((acc, d) => acc + d.valor, 0);
    res.json({
      tipo: 'pagamentos',
      periodo: { dataInicio, dataFim },
      totais: {
        quantidade: mapped.length,
        valorTotal: total,
        valorMedio: mapped.length ? total / mapped.length : 0,
        statusCount: _statusCount(mapped)
      },
      dados: mapped
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar relatório de pagamentos' });
  }
};

exports.relClientes = async (req, res) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};

    const dados = await prisma.cliente.findMany({ where });

    const mapped = [];
    for (const c of dados) {
      const financeiro = await prisma.financeiro.findFirst({
        where: { id_cliente: c.id_cliente },
        orderBy: { id_financeiro: 'desc' }
      });
      const limite = parseFloat(financeiro?.limite_credito || 0);
      const creditoUtilizado = parseFloat(financeiro?.saldo_utilizado || 0);
      const totalPedidos = await prisma.pedido.count({ where: { id_cliente: c.id_cliente } });
      const totalPagamentos = await prisma.pagamento.count({ where: { id_cliente: c.id_cliente } });

      mapped.push({
        id_cliente: c.id_cliente,
        nome: c.nome,
        status: c.status,
        limite_credito: limite,
        credito_utilizado: creditoUtilizado,
        saldo_restante: limite - creditoUtilizado,
        total_pedidos: totalPedidos,
        total_pagamentos: totalPagamentos
      });
    }

    res.json({
      tipo: 'clientes',
      totais: {
        quantidade: mapped.length,
        totalPedidos: mapped.reduce((acc, d) => acc + d.total_pedidos, 0),
        totalPagamentos: mapped.reduce((acc, d) => acc + d.total_pagamentos, 0),
        limiteCreditoTotal: mapped.reduce((acc, d) => acc + d.limite_credito, 0),
        saldoRestanteTotal: mapped.reduce((acc, d) => acc + d.saldo_restante, 0),
        creditoUtilizadoTotal: mapped.reduce((acc, d) => acc + d.credito_utilizado, 0),
      },
      dados: mapped
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar relatório de clientes' });
  }
};

exports.relVendas = async (req, res) => {
  try {
    const { dataInicio, dataFim } = req.query;
    const where = { status: { not: 'cancelado' } };
    if (dataInicio || dataFim) {
      where.data = {};
      if (dataInicio) where.data.gte = new Date(dataInicio);
      if (dataFim) where.data.lte = new Date(dataFim);
    }

    const dados = await prisma.pedido.findMany({
      where,
      include: { cliente: { select: { nome: true } } },
      orderBy: { data: 'desc' }
    });

    const mapped = dados.map(d => ({
      id_pedido: d.id_pedido,
      id_cliente: d.id_cliente,
      cliente_nome: d.cliente?.nome,
      total: parseFloat(d.total),
      data: _iso(d.data),
      status: d.status
    }));

    const faturamento = mapped.reduce((acc, d) => acc + d.total, 0);
    res.json({
      tipo: 'vendas',
      periodo: { dataInicio, dataFim },
      totais: {
        quantidadePedidos: mapped.length,
        faturamento,
        ticketMedio: mapped.length ? faturamento / mapped.length : 0
      },
      dados: mapped
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar relatório de vendas' });
  }
};

exports.relUsuario = async (req, res) => {
  try {
    const id_cliente = parseInt(req.query.id_cliente);
    if (!id_cliente) return res.status(400).json({ error: 'id_cliente obrigatório' });

    const cliente = await prisma.cliente.findUnique({ where: { id_cliente } });

    if (!cliente) return res.status(404).json({ error: 'Cliente não encontrado' });

    const financeiro = await prisma.financeiro.findFirst({
      where: { id_cliente },
      orderBy: { id_financeiro: 'desc' }
    });

    const limite = parseFloat(financeiro?.limite_credito || 0);
    const creditoUtilizado = parseFloat(financeiro?.saldo_utilizado || 0);

    const pedidos = await prisma.pedido.findMany({
      where: { id_cliente },
      orderBy: { data: 'desc' }
    });

    const pedidosComItens = await prisma.pedido.findMany({
      where: { id_cliente },
      include: { itens: { include: { produto: { select: { nome: true } } } } },
      orderBy: { data: 'desc' }
    });

    const pagamentos = await prisma.pagamento.findMany({
      where: { id_cliente },
      orderBy: { data_criacao: 'desc' }
    });

    const totalPedidos = pedidos.reduce((acc, p) => acc + parseFloat(p.total), 0);
    const totalPagamentos = pagamentos.reduce((acc, p) => acc + parseFloat(p.valor), 0);

    res.json({
      tipo: 'usuario',
      cliente: {
        id_cliente: cliente.id_cliente,
        nome: cliente.nome,
        status: cliente.status,
        limite_credito: limite,
        credito_utilizado: creditoUtilizado,
        saldo_restante: limite - creditoUtilizado
      },
      totais: {
        totalPedidos: pedidos.length,
        quantidadePedidos: pedidos.length,
        valorTotalPedidos: totalPedidos,
        totalPagamentos: pagamentos.length,
        quantidadePagamentos: pagamentos.length,
        valorTotalPagamentos: totalPagamentos,
        limiteCredito: limite,
        creditoUtilizado,
        saldoRestante: limite - creditoUtilizado,
        ..._statusCount(pedidos)
      },
      pedidos: pedidosComItens.map(p => ({
        id_pedido: p.id_pedido,
        total: parseFloat(p.total),
        status: p.status,
        data: _iso(p.data),
        pedido_item: p.itens.map(it => ({
          id_pedido_item: it.id_item_pedido,
          id_produto: it.id_produto,
          produto_nome: it.produto?.nome,
          qtd: parseFloat(it.qtd),
          vlr_venda: parseFloat(it.vlr_item)
        }))
      })),
      pagamentos: pagamentos.map(p => ({
        id_pagamento: p.id_pagamento,
        valor: parseFloat(p.valor),
        status: p.status,
        data_criacao: _iso(p.data_criacao)
      })),
      dados: pedidos
    });
  } catch (error) {
    res.status(500).json({ error: `Erro ao buscar relatório de usuário: ${error.message}` });
  }
};