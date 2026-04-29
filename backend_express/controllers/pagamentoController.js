const prisma = require('../db/prisma');
const { paginatedResponse } = require('../utils/response');

const _iso = (value) => {
  if (value && typeof value.toISOString === 'function') {
    return value.toISOString();
  }
  return value;
};

const _mapRow = (row) => ({
  id_pagamento: row.id_pagamento,
  valor: parseFloat(row.valor || 0),
  qrcode: row.qrcode,
  chavepix: row.chavepix,
  status: row.status,
  data_criacao: _iso(row.data_criacao),
  data_pagamento: _iso(row.data_pagamento),
  id_cliente: row.id_cliente,
  cliente: row.cliente_nome ? { nome: row.cliente_nome } : null,
});

const _normalizeStatus = (value) => str(value || '').trim().toLowerCase();

const _extractValidPedidoIds = (rawIds) => {
  if (!Array.isArray(rawIds)) return [];
  const seen = new Set();
  const uniqueIds = [];
  for (const raw of rawIds) {
    try {
      const pedido_id = parseInt(raw);
      if (pedido_id > 0 && !seen.has(pedido_id)) {
        seen.add(pedido_id);
        uniqueIds.push(pedido_id);
      }
    } catch (e) { continue; }
  }
  return uniqueIds;
};

const _ensureFinanceiro = async (clienteId) => {
  const existing = await prisma.financeiro.findFirst({
    where: { id_cliente: clienteId },
    orderBy: { id_financeiro: 'desc' }
  });
  if (existing) return existing.id_financeiro;

  const created = await prisma.financeiro.create({
    data: { id_cliente: clienteId, limite_credito: 0, saldo_utilizado: 0, ultimo_limite: 0 }
  });
  return created.id_financeiro;
};

const _subtractSaldoUtilizado = async (clienteId, amount) => {
  const amountNum = parseFloat(amount || 0);
  if (amountNum <= 0) return;
  const finId = await _ensureFinanceiro(clienteId);
  const row = await prisma.financeiro.findUnique({ where: { id_financeiro: finId } });
  const atual = parseFloat(row?.saldo_utilizado || 0);
  const novo = Math.max(atual - amountNum, 0);
  await prisma.financeiro.update({
    where: { id_financeiro: finId },
    data: { saldo_utilizado: novo, usuario_alteracao: 'SISTEMA' }
  });
};

const _addSaldoUtilizado = async (clienteId, amount) => {
  const amountNum = parseFloat(amount || 0);
  if (amountNum <= 0) return;
  const finId = await _ensureFinanceiro(clienteId);
  const row = await prisma.financeiro.findUnique({ where: { id_financeiro: finId } });
  const atual = parseFloat(row?.saldo_utilizado || 0);
  const novo = atual + amountNum;
  await prisma.financeiro.update({
    where: { id_financeiro: finId },
    data: { saldo_utilizado: novo, usuario_alteracao: 'SISTEMA' }
  });
};

const _linkedPedidoIds = async (pagamentoId) => {
  const links = await prisma.pedidoPagamento.findMany({
    where: { id_pagamento: pagamentoId }
  });
  return links.map(l => l.id_pedido);
};

exports.getAll = async (req, res) => {
  try {
    const { status } = req.query;
    const { skip, limit } = req.pagination || {};
    const where = status ? { status } : {};

    const [pagamentos, total] = await Promise.all([
      prisma.pagamento.findMany({
        where,
        include: { cliente: { select: { nome: true } } },
        orderBy: { id_pagamento: 'desc' },
        skip: skip || 0,
        take: limit || 50
      }),
      prisma.pagamento.count({ where })
    ]);

    const mapped = pagamentos.map(p => ({
      ..._mapRow(p),
      cliente_nome: p.cliente?.nome
    }));

    const response = paginatedResponse(mapped, total, req);
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar pagamentos' });
  }
};

exports.getByCliente = async (req, res) => {
  try {
    const pagamentos = await prisma.pagamento.findMany({
      where: { id_cliente: parseInt(req.params.clienteId) },
      include: { cliente: { select: { nome: true } } },
      orderBy: { id_pagamento: 'desc' }
    });
    res.json(pagamentos.map(p => ({
      ..._mapRow(p),
      cliente_nome: p.cliente?.nome
    })));
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar pagamentos do cliente' });
  }
};

const _getPagamentoWithPedidos = async (pagamentoId) => {
  const pagamento = await prisma.pagamento.findUnique({
    where: { id_pagamento: pagamentoId },
    include: { cliente: { select: { nome: true } } }
  });
  if (!pagamento) return null;

  const links = await prisma.pedidoPagamento.findMany({
    where: { id_pagamento: pagamentoId }
  });
  const pedidoIds = links.map(l => l.id_pedido);

  const payload = {
    ..._mapRow(pagamento),
    cliente_nome: pagamento.cliente?.nome,
    pagamentopedido: links.map(l => ({
      id_pagamento_pedido: l.id_pagamento_pedido,
      id_pedido: l.id_pedido,
      id_pagamento: l.id_pagamento
    }))
  };

  if (pedidoIds.length === 0) {
    payload.pedidos = [];
    return payload;
  }

  const pedidos = await prisma.pedido.findMany({
    where: { id_pedido: { in: pedidoIds } },
    include: {
      cliente: { select: { nome: true } },
      itens: { include: { produto: { select: { nome: true } } } }
    }
  });

  payload.pedidos = pedidos.map(p => ({
    id: p.id_pedido,
    clienteId: p.id_cliente,
    clienteNome: p.cliente?.nome,
    status: p.status,
    total: parseFloat(p.total),
    createdAt: _iso(p.data),
    updatedAt: _iso(p.updatedAt),
    itens: p.itens.map(it => ({
      id: it.id_item_pedido,
      pedidoId: it.id_pedido,
      produtoNome: it.produto?.nome || '',
      quantidade: parseFloat(it.qtd),
      precoUnitario: parseFloat(it.vlr_item),
      subtotal: parseFloat(it.vlr_total),
    }))
  }));

  return payload;
};

exports.getById = async (req, res) => {
  try {
    const pagamento = await _getPagamentoWithPedidos(parseInt(req.params.id));
    if (!pagamento) return res.status(404).json({ error: 'Pagamento não encontrado' });
    res.json(pagamento);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar pagamento' });
  }
};

exports.create = async (req, res) => {
  try {
    const { id_cliente, valor, qrcode, chavepix, status, pedidoIds } = req.body;

    if (!id_cliente || !valor || !qrcode || !chavepix) {
      return res.status(400).json({ error: 'Dados de pagamento inválidos' });
    }

    const validPedidoIds = _extractValidPedidoIds(pedidoIds || []);
    if (validPedidoIds.length === 0) {
      return res.status(400).json({ error: 'Selecione ao menos um pedido para vincular ao pagamento.' });
    }

    const elegiveis = await prisma.pedido.findMany({
      where: {
        id_pedido: { in: validPedidoIds },
        id_cliente: parseInt(id_cliente),
        status: 'confirmado'
      }
    });

    if (elegiveis.length !== validPedidoIds.length) {
      return res.status(400).json({ error: 'Há pedidos inválidos para pagamento (cliente/status).' });
    }

    const pagamento = await prisma.pagamento.create({
      data: {
        id_cliente: parseInt(id_cliente),
        valor: parseFloat(valor),
        qrcode: qrcode,
        chavepix: chavepix,
        status: (status || 'pendente').toLowerCase() || 'pendente',
        pedidoPagamentos: {
          create: validPedidoIds.map(pid => ({ id_pedido: pid }))
        }
      }
    });

    await prisma.pedido.updateMany({
      where: { id_pedido: { in: validPedidoIds }, status: 'confirmado' },
      data: { status: 'em_pagamento' }
    });

    const result = await _getPagamentoWithPedidos(pagamento.id_pagamento);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: `Erro ao criar pagamento: ${error.message}` });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Status inválido' });

    const pagamento = await prisma.pagamento.findUnique({
      where: { id_pagamento: parseInt(req.params.id) }
    });
    if (!pagamento) return res.status(404).json({ error: 'Pagamento não encontrado' });

    const oldStatus = _normalizeStatus(pagamento.status);
    const newStatus = _normalizeStatus(status);
    const wasAprovado = oldStatus === 'aprovado';
    const isAprovado = newStatus === 'aprovado';
    const isRollback = ['cancelado', 'rejeitado', 'excluido', 'excluído', 'pendente'].includes(newStatus);

    const updateData = { status: newStatus };
    if (newStatus === 'aprovado') {
      updateData.data_pagamento = new Date();
    }
    await prisma.pagamento.update({
      where: { id_pagamento: parseInt(req.params.id) },
      data: updateData
    });

    const pedidoIds = await _linkedPedidoIds(pagamento.id_pagamento);
    if (pedidoIds.length > 0) {
      const pedidosAtuais = await prisma.pedido.findMany({
        where: { id_pedido: { in: pedidoIds } }
      });

      if (!wasAprovado && isAprovado) {
        await prisma.pedido.updateMany({
          where: { id_pedido: { in: pedidoIds }, status: { in: ['confirmado', 'em_pagamento'] } },
          data: { status: 'pago' }
        });

        const consumoPorCliente = {};
        for (const pedido of pedidosAtuais) {
          const statusAtual = _normalizeStatus(pedido.status);
          if (['pago', 'cancelado'].includes(statusAtual)) continue;
          const clienteId = pedido.id_cliente;
          consumoPorCliente[clienteId] = (consumoPorCliente[clienteId] || 0) + parseFloat(pedido.total);
        }
        for (const [clienteId, valorTotal] of Object.entries(consumoPorCliente)) {
          await _subtractSaldoUtilizado(parseInt(clienteId), valorTotal);
        }
      }

      if (isRollback) {
        await prisma.pedido.updateMany({
          where: { id_pedido: { in: pedidoIds }, status: { in: ['em_pagamento', 'pago'] } },
          data: { status: 'confirmado' }
        });

        if (wasAprovado) {
          const consumoPorCliente = {};
          for (const pedido of pedidosAtuais) {
            const statusAtual = _normalizeStatus(pedido.status);
            if (statusAtual !== 'pago') continue;
            const clienteId = pedido.id_cliente;
            consumoPorCliente[clienteId] = (consumoPorCliente[clienteId] || 0) + parseFloat(pedido.total);
          }
          for (const [clienteId, valorTotal] of Object.entries(consumoPorCliente)) {
            await _addSaldoUtilizado(parseInt(clienteId), valorTotal);
          }
        }
      }
    }

    const result = await _getPagamentoWithPedidos(parseInt(req.params.id));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: `Erro ao atualizar status: ${error.message}` });
  }
};

exports.delete = async (req, res) => {
  try {
    const pagamento = await prisma.pagamento.findUnique({
      where: { id_pagamento: parseInt(req.params.id) }
    });
    if (!pagamento) return res.status(404).json({ error: 'Pagamento não encontrado' });

    const oldStatus = _normalizeStatus(pagamento.status);
    const pedidoIds = await _linkedPedidoIds(pagamento.id_pagamento);

    if (pedidoIds.length > 0) {
      const pedidosAtuais = await prisma.pedido.findMany({
        where: { id_pedido: { in: pedidoIds } }
      });

      await prisma.pedido.updateMany({
        where: { id_pedido: { in: pedidoIds }, status: { in: ['em_pagamento', 'pago'] } },
        data: { status: 'confirmado' }
      });

      if (oldStatus === 'aprovado') {
        const consumoPorCliente = {};
        for (const pedido of pedidosAtuais) {
          const statusAtual = _normalizeStatus(pedido.status);
          if (statusAtual !== 'pago') continue;
          const clienteId = pedido.id_cliente;
          consumoPorCliente[clienteId] = (consumoPorCliente[clienteId] || 0) + parseFloat(pedido.total);
        }
        for (const [clienteId, valorTotal] of Object.entries(consumoPorCliente)) {
          await _addSaldoUtilizado(parseInt(clienteId), valorTotal);
        }
      }
    }

    await prisma.pagamento.update({
      where: { id_pagamento: parseInt(req.params.id) },
      data: { status: 'excluido' }
    });

    res.json({ message: 'Pagamento deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: `Erro ao deletar pagamento: ${error.message}` });
  }
};