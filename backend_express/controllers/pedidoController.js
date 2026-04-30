const prisma = require('../db/prisma');
const { paginatedResponse } = require('../utils/response');

const _mapItemRow = (it) => ({
  id: it.id_item_pedido,
  pedidoId: it.id_pedido,
  produtoNome: it.produto?.nome || '',
  quantidade: parseFloat(it.qtd),
  precoUnitario: parseFloat(it.vlr_item),
  subtotal: parseFloat(it.vlr_total),
});

const _pedidoRowToJson = (p) => ({
  id: p.id_pedido,
  clienteId: p.id_cliente,
  clienteNome: p.cliente?.nome,
  status: p.status,
  total: parseFloat(p.total || 0),
  createdAt: p.data,
  updatedAt: p.updatedAt || p.data,
});

const _checkStock = async (pedidoId) => {
  const itens = await prisma.pedidoItem.findMany({
    where: { id_pedido: pedidoId },
    include: { produto: true }
  });
  const insuficiente = [];
  for (const it of itens) {
    const qtdSolicitada = parseFloat(it.qtd);
    const saldoAtual = parseFloat(it.produto.saldo);
    if (qtdSolicitada > saldoAtual) {
      insuficiente.push(`${it.produto.nome}: solicitado ${qtdSolicitada}, disponível ${saldoAtual}`);
    }
  }
  return insuficiente.length > 0 ? insuficiente.join('; ') : null;
};

const _reserveOrReleaseStock = async (pedidoId, mode) => {
  const itens = await prisma.pedidoItem.findMany({
    where: { id_pedido: pedidoId }
  });

  if (mode === 'subtract') {
    const insuficientes = [];
    for (const it of itens) {
      const produto = await prisma.produto.findUnique({ where: { id_produto: it.id_produto } });
      if (produto && parseFloat(it.qtd) > parseFloat(produto.saldo)) {
        insuficientes.push(`${produto.nome}: solicitado ${it.qtd}, disponível ${produto.saldo}`);
      }
    }
    if (insuficientes.length > 0) {
      throw new Error(`Estoque insuficiente: ${insuficientes.join('; ')}`);
    }
  }

  for (const it of itens) {
    const qtd = parseFloat(it.qtd);
    if (mode === 'subtract') {
      await prisma.produto.update({
        where: { id_produto: it.id_produto },
        data: { saldo: { decrement: qtd } }
      });
    } else {
      await prisma.produto.update({
        where: { id_produto: it.id_produto },
        data: { saldo: { increment: qtd } }
      });
    }
  }
};

const _getPedidoWithItens = async (pedidoId) => {
  const pedido = await prisma.pedido.findUnique({
    where: { id_pedido: pedidoId },
    include: {
      cliente: { select: { nome: true } },
      itens: { include: { produto: { select: { nome: true } } } }
    }
  });
  if (!pedido) return null;

  const payload = _pedidoRowToJson(pedido);
  payload.itens = pedido.itens.map(_mapItemRow);
  return payload;
};

exports.getAll = async (req, res) => {
  try {
    const { status } = req.query;
    const { skip, limit } = req.pagination || {};
    const where = status ? { status } : {};

    const [pedidos, total] = await Promise.all([
      prisma.pedido.findMany({
        where,
        include: { cliente: { select: { nome: true } } },
        orderBy: { id_pedido: 'desc' },
        skip: skip || 0,
        take: limit || 50
      }),
      prisma.pedido.count({ where })
    ]);

    const response = paginatedResponse(pedidos.map(_pedidoRowToJson), total, req);
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar pedidos' });
  }
};

exports.getByCliente = async (req, res) => {
  try {
    const pedidos = await prisma.pedido.findMany({
      where: { id_cliente: parseInt(req.params.clienteId) },
      include: { cliente: { select: { nome: true } } },
      orderBy: { id_pedido: 'desc' }
    });
    res.json(pedidos.map(_pedidoRowToJson));
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar pedidos do cliente' });
  }
};

exports.getById = async (req, res) => {
  try {
    const pedido = await _getPedidoWithItens(parseInt(req.params.id));
    if (!pedido) return res.status(404).json({ error: 'Pedido não encontrado' });
    res.json(pedido);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar pedido' });
  }
};

exports.create = async (req, res) => {
  try {
    const { clienteId, itens } = req.body;
    if (!clienteId || !itens || itens.length === 0) {
      return res.status(400).json({ error: 'Pedido deve ter pelo menos um item' });
    }

    const cliente = await prisma.cliente.findUnique({ where: { id_cliente: clienteId } });
    if (!cliente) return res.status(400).json({ error: 'Cliente não encontrado' });

    let total = 0;
    for (const item of itens) {
      const qtd = parseFloat(item.quantidade || 0);
      const preco = parseFloat(item.precoUnitario || 0);
      total += qtd * preco;
    }

    const insufficientStock = [];
    for (const item of itens) {
      const produto = await prisma.produto.findUnique({ where: { id_produto: item.produtoId } });
      if (!produto) {
        insufficientStock.push(`Produto ID ${item.produtoId} não encontrado`);
      } else if (parseFloat(item.quantidade) > parseFloat(produto.saldo)) {
        insufficientStock.push(`${produto.nome}: solicitado ${item.quantidade}, disponível ${produto.saldo}`);
      }
    }
    if (insufficientStock.length > 0) {
      return res.status(400).json({ error: `Estoque insuficiente: ${insufficientStock.join('; ')}` });
    }

    const pedido = await prisma.$transaction(async (tx) => {
      const created = await tx.pedido.create({
        data: {
          id_cliente: clienteId,
          total,
          status: 'pendente',
          data: new Date(),
          itens: {
            create: itens.map(item => ({
              id_produto: item.produtoId,
              qtd: parseFloat(item.quantidade),
              vlr_item: parseFloat(item.precoUnitario),
              vlr_total: parseFloat(item.quantidade) * parseFloat(item.precoUnitario),
              vlr_custo: 0,
            }))
          }
        },
        include: { itens: true }
      });

      for (const item of itens) {
        await tx.produto.update({
          where: { id_produto: item.produtoId },
          data: { saldo: { decrement: parseFloat(item.quantidade) } }
        });
      }

      return created;
    });

    const created = await _getPedidoWithItens(pedido.id_pedido);
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: `Erro ao criar pedido: ${error.message}` });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Status inválido' });

    const pedido = await prisma.pedido.findUnique({ where: { id_pedido: parseInt(req.params.id) } });
    if (!pedido) return res.status(404).json({ error: 'Pedido não encontrado' });

    const oldStatus = (pedido.status || '').toLowerCase();
    const newStatus = status.toLowerCase();

    const finalStatuses = ['pago', 'excluido', 'excluído', 'cancelado'];
    if (finalStatuses.includes(oldStatus)) {
      return res.status(422).json({ error: `Pedido com status '${oldStatus}' não pode ser alterado` });
    }

    const oldReserve = ['pendente', 'confirmado', 'em_pagamento', 'pago'].includes(oldStatus);
    const newReserve = ['pendente', 'confirmado', 'em_pagamento', 'pago'].includes(newStatus);

    if (!oldReserve && newReserve) {
      await _reserveOrReleaseStock(pedido.id_pedido, 'subtract');
    } else if (oldReserve && !newReserve) {
      await _reserveOrReleaseStock(pedido.id_pedido, 'add');
    }

    await prisma.pedido.update({
      where: { id_pedido: parseInt(req.params.id) },
      data: { status }
    });

    const updated = await _getPedidoWithItens(parseInt(req.params.id));
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: `Erro ao atualizar status: ${error.message}` });
  }
};

exports.delete = async (req, res) => {
  try {
    const pedido = await prisma.pedido.findUnique({ where: { id_pedido: parseInt(req.params.id) } });
    if (!pedido) return res.status(404).json({ error: 'Pedido não encontrado' });

    const status = (pedido.status || '').toLowerCase();
    const activeStatuses = ['pendente', 'confirmado', 'em_pagamento', 'pago'];

    if (activeStatuses.includes(status)) {
      await _reserveOrReleaseStock(pedido.id_pedido, 'add');
    }

    await prisma.pedidoItem.deleteMany({ where: { id_pedido: parseInt(req.params.id) } });
    await prisma.pedido.delete({ where: { id_pedido: parseInt(req.params.id) } });

    res.json({ message: 'Pedido deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: `Erro ao deletar pedido: ${error.message}` });
  }
};

exports.getItens = async (req, res) => {
  try {
    const itens = await prisma.pedidoItem.findMany({
      where: { id_pedido: parseInt(req.params.id) },
      include: { produto: { select: { nome: true } } }
    });
    res.json(itens.map(_mapItemRow));
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar itens' });
  }
};

exports.addItem = async (req, res) => {
  try {
    const { produtoId, produtoNome, quantidade, precoUnitario } = req.body;
    const qtd = parseFloat(quantidade);
    const preco = parseFloat(precoUnitario || 0);

    if (!produtoId && !produtoNome || qtd <= 0) {
      return res.status(400).json({ error: 'Item inválido' });
    }

    const pedido = await prisma.pedido.findUnique({ where: { id_pedido: parseInt(req.params.id) } });
    if (!pedido) return res.status(404).json({ error: 'Pedido não encontrado' });

    let prodId = produtoId;
    if (!prodId) {
      const existente = await prisma.produto.findFirst({ where: { nome: produtoNome } });
      if (existente) {
        prodId = existente.id_produto;
      } else {
        const novo = await prisma.produto.create({
          data: { nome: produtoNome, valor: preco, oldvalor: preco, marca: 'indefinida', saldo: 0 }
        });
        prodId = novo.id_produto;
      }
    }

    const activeStatuses = ['pendente', 'confirmado', 'em_pagamento', 'pago'];
    if (activeStatuses.includes(pedido.status)) {
      const produto = await prisma.produto.findUnique({ where: { id_produto: prodId } });
      if (produto && qtd > parseFloat(produto.saldo)) {
        return res.status(400).json({ error: `Estoque insuficiente: solicitado ${qtd}, disponível ${produto.saldo}` });
      }
    }

    const vlrTotal = qtd * preco;
    const item = await prisma.pedidoItem.create({
      data: {
        id_pedido: parseInt(req.params.id),
        id_produto: prodId,
        qtd,
        vlr_item: preco,
        vlr_total: vlrTotal,
        vlr_custo: 0
      }
    });

    const itens = await prisma.pedidoItem.findMany({
      where: { id_pedido: parseInt(req.params.id) }
    });
    const novoTotal = itens.reduce((acc, it) => acc + parseFloat(it.vlr_total), 0);
    await prisma.pedido.update({
      where: { id_pedido: parseInt(req.params.id) },
      data: { total: novoTotal }
    });

    if (activeStatuses.includes(pedido.status)) {
      await prisma.produto.update({
        where: { id_produto: prodId },
        data: { saldo: { decrement: qtd } }
      });
    }

    const created = await prisma.pedidoItem.findUnique({
      where: { id_item_pedido: item.id_item_pedido },
      include: { produto: { select: { nome: true } } }
    });
    res.status(201).json(_mapItemRow(created));
  } catch (error) {
    res.status(500).json({ error: `Erro ao adicionar item: ${error.message}` });
  }
};

exports.removeItem = async (req, res) => {
  try {
    const pedido = await prisma.pedido.findUnique({ where: { id_pedido: parseInt(req.params.id) } });
    if (!pedido) return res.status(404).json({ error: 'Pedido não encontrado' });

    const item = await prisma.pedidoItem.findFirst({
      where: { id_item_pedido: parseInt(req.params.itemId), id_pedido: parseInt(req.params.id) }
    });
    if (!item) return res.status(404).json({ error: 'Item não encontrado no pedido' });

    await prisma.pedidoItem.delete({ where: { id_item_pedido: parseInt(req.params.itemId) } });

    const itens = await prisma.pedidoItem.findMany({
      where: { id_pedido: parseInt(req.params.id) }
    });
    const novoTotal = itens.reduce((acc, it) => acc + parseFloat(it.vlr_total), 0);
    await prisma.pedido.update({
      where: { id_pedido: parseInt(req.params.id) },
      data: { total: novoTotal }
    });

    const activeStatuses = ['pendente', 'confirmado', 'em_pagamento', 'pago'];
    if (activeStatuses.includes(pedido.status)) {
      await prisma.produto.update({
        where: { id_produto: item.id_produto },
        data: { saldo: { increment: parseFloat(item.qtd) } }
      });
    }

    res.json({ message: 'Item removido com sucesso' });
  } catch (error) {
    res.status(500).json({ error: `Erro ao remover item: ${error.message}` });
  }
};

exports.getTotal = async (req, res) => {
  try {
    const itens = await prisma.pedidoItem.findMany({
      where: { id_pedido: parseInt(req.params.id) }
    });
    const total = itens.reduce((acc, it) => acc + parseFloat(it.vlr_total), 0);
    res.json({ total });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar total' });
  }
};