const prisma = require('../db/prisma');
const { paginatedResponse } = require('../utils/response');

const _applyStock = async (lancamentoId, mode) => {
  const itens = await prisma.lancamentoItem.findMany({
    where: { id_lancamento: lancamentoId }
  });

  for (const item of itens) {
    const qtd = parseFloat(item.qtd);
    if (mode === 'add') {
      await prisma.produto.update({
        where: { id_produto: item.id_produto },
        data: {
          saldo: { increment: qtd },
          oldvalor: { set: undefined },
          valor: parseFloat(item.vlr_item)
        }
      });
    } else {
      const current = await prisma.produto.findUnique({ where: { id_produto: item.id_produto } });
      const newSaldo = Math.max(0, parseFloat(current.saldo) - qtd);
      await prisma.produto.update({
        where: { id_produto: item.id_produto },
        data: { saldo: newSaldo }
      });
    }
  }
};

exports.getAll = async (req, res) => {
  try {
    const { skip, limit } = req.pagination || {};

    const [lancamentos, total] = await Promise.all([
      prisma.lancamento.findMany({
        include: { fornecedor: { select: { razao: true } } },
        orderBy: { id_lancamento: 'desc' },
        skip: skip || 0,
        take: limit || 50
      }),
      prisma.lancamento.count()
    ]);

    const mapped = lancamentos.map(l => ({
      id_lancamento: l.id_lancamento,
      id_fornecedor: l.id_fornecedor,
      fornecedor_nome: l.fornecedor?.razao,
      total: parseFloat(l.total),
      data: l.data,
      status: l.status,
    }));

    const response = paginatedResponse(mapped, total, req);
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar lançamentos' });
  }
};

exports.getById = async (req, res) => {
  try {
    const lancamento = await prisma.lancamento.findUnique({
      where: { id_lancamento: parseInt(req.params.id) },
      include: {
        fornecedor: { select: { razao: true } },
        itens: { include: { produto: { select: { nome: true } } } }
      }
    });
    if (!lancamento) return res.status(404).json({ error: 'Lançamento não encontrado' });
    res.json({
      id_lancamento: lancamento.id_lancamento,
      id_fornecedor: lancamento.id_fornecedor,
      fornecedor_nome: lancamento.fornecedor?.razao,
      total: parseFloat(lancamento.total),
      data: lancamento.data,
      status: lancamento.status,
      itens: lancamento.itens.map(i => ({
        id_produto: i.id_produto,
        produto_nome: i.produto?.nome,
        qtd: parseFloat(i.qtd),
        vlr_item: parseFloat(i.vlr_item),
        vlr_total: parseFloat(i.vlr_total),
      })),
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar lançamento' });
  }
};

exports.create = async (req, res) => {
  try {
    const { id_fornecedor, itens, status } = req.body;
    if (!id_fornecedor || !itens || itens.length === 0) {
      return res.status(400).json({ error: 'Informe pelo menos um item' });
    }

    let total = 0;
    for (const item of itens) {
      const qtd = parseFloat(item.qtd || 0);
      const vlrItem = parseFloat(item.vlr_item || 0);
      total += item.vlr_total ? parseFloat(item.vlr_total) : qtd * vlrItem;
    }

    const fornecedor = await prisma.fornecedor.findUnique({ where: { id_fornecedor } });
    if (!fornecedor) return res.status(400).json({ error: 'Fornecedor não encontrado' });

    const documento = `LAN-${Date.now()}`.slice(0, 45);

    const lancamento = await prisma.lancamento.create({
      data: {
        id_fornecedor,
        total,
        status: (status || 'PENDENTE').toUpperCase(),
        documento,
        itens: {
          create: itens.map(item => ({
            id_produto: item.id_produto,
            qtd: parseFloat(item.qtd),
            vlr_item: parseFloat(item.vlr_item),
            vlr_total: item.vlr_total ? parseFloat(item.vlr_total) : parseFloat(item.qtd) * parseFloat(item.vlr_item),
          }))
        }
      },
      include: { itens: true }
    });

    if ((status || 'PENDENTE').toUpperCase() === 'CONFIRMADO') {
      await _applyStock(lancamento.id_lancamento, 'add');
    }

    res.status(201).json(lancamento);
  } catch (error) {
    res.status(500).json({ error: `Erro ao criar lançamento: ${error.message}` });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const nextStatus = (status || '').toUpperCase();

    if (!['PENDENTE', 'CONFIRMADO', 'CANCELADO'].includes(nextStatus)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    const lancamento = await prisma.lancamento.findUnique({ where: { id_lancamento: parseInt(req.params.id) } });
    if (!lancamento) return res.status(404).json({ error: 'Lançamento não encontrado' });

    const current = (lancamento.status || '').toUpperCase();

    if (current === 'CONFIRMADO' && nextStatus === 'PENDENTE') {
      return res.status(400).json({ error: 'Não é permitido voltar um lançamento confirmado para pendente' });
    }

    if (nextStatus === 'CANCELADO' && current === 'CONFIRMADO') {
      const vendidos = await prisma.pedidoItem.findMany({
        where: {
          produto: { lancamentoItems: { some: { id_lancamento: lancamento.id_lancamento } } },
          pedido: { status: { notIn: ['cancelado', 'excluido'] } }
        },
        include: { produto: true }
      });
      if (vendidos.length > 0) {
        const nomes = [...new Set(vendidos.map(v => v.produto.nome))].join(', ');
        return res.status(400).json({ error: `Não é possível cancelar: produtos já registraram vendas: ${nomes}` });
      }
      await _applyStock(lancamento.id_lancamento, 'subtract');
    }

    if (nextStatus === 'CONFIRMADO' && current !== 'CONFIRMADO') {
      await _applyStock(lancamento.id_lancamento, 'add');
    }

    await prisma.lancamento.update({
      where: { id_lancamento: parseInt(req.params.id) },
      data: { status: nextStatus }
    });

    res.json(await prisma.lancamento.findUnique({ where: { id_lancamento: parseInt(req.params.id) } }));
  } catch (error) {
    res.status(500).json({ error: `Erro ao atualizar status: ${error.message}` });
  }
};