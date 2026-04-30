const prisma = require('../db/prisma');

const _iso = (value) => {
  if (value && typeof value.toISOString === 'function') {
    return value.toISOString();
  }
  return value;
};

exports.getAll = async (req, res) => {
  try {
    const rows = await prisma.$queryRaw`
      SELECT l.id_lancamento, l.id_fornecedor, f.razao AS fornecedor_nome, l.total, l.data, l.status
      FROM lancamento l
      LEFT JOIN fornecedor f ON f.id_fornecedor = l.id_fornecedor
      ORDER BY l.id_lancamento DESC
    `;
    const mapped = rows.map(l => ({
      id_lancamento: l.id_lancamento,
      id_fornecedor: l.id_fornecedor,
      fornecedor_nome: l.fornecedor_nome,
      total: parseFloat(l.total || 0),
      data: _iso(l.data),
      status: l.status,
    }));
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar lançamentos' });
  }
};

exports.getById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const row = await prisma.$queryRaw`
      SELECT l.id_lancamento, l.id_fornecedor, f.razao AS fornecedor_nome, l.total, l.data, l.status
      FROM lancamento l
      LEFT JOIN fornecedor f ON f.id_fornecedor = l.id_fornecedor
      WHERE l.id_lancamento = ${id}
      LIMIT 1
    `;
    if (!row || row.length === 0) {
      return res.status(404).json({ error: 'Lançamento não encontrado' });
    }
    const lancamento = row[0];
    const itens = await prisma.$queryRaw`
      SELECT li.id_produto, p.nome AS produto_nome, li.qtd, li.vlr_item, li.vlr_total
      FROM lancamento_item li
      LEFT JOIN produto p ON p.id_produto = li.id_produto
      WHERE li.id_lancamento = ${id}
    `;
    res.json({
      id_lancamento: lancamento.id_lancamento,
      id_fornecedor: lancamento.id_fornecedor,
      fornecedor_nome: lancamento.fornecedor_nome,
      total: parseFloat(lancamento.total || 0),
      data: _iso(lancamento.data),
      status: lancamento.status,
      itens: itens.map(i => ({
        id_produto: i.id_produto,
        produto_nome: i.produto_nome,
        qtd: parseFloat(i.qtd || 0),
        vlr_item: parseFloat(i.vlr_item || 0),
        vlr_total: parseFloat(i.vlr_total || 0),
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

    const total = itens.reduce((acc, item) => {
      const qtd = parseFloat(item.qtd || 0);
      const vlrItem = parseFloat(item.vlr_item || 0);
      return acc + (item.vlr_total ? parseFloat(item.vlr_total) : qtd * vlrItem);
    }, 0);

    const nextStatus = (status || 'PENDENTE').toUpperCase();
    const documento = `LAN-${Date.now()}`.slice(0, 45);

    const lancamentoId = await prisma.$transaction(async (tx) => {
      const userRow = await tx.$queryRaw`SELECT id_usuario FROM usuario ORDER BY id_usuario ASC LIMIT 1`;
      const id_usuario = userRow.length > 0 ? userRow[0].id_usuario : null;

      const insertResult = await tx.$queryRaw`
        INSERT INTO lancamento (id_fornecedor, total, data, documento, id_usuario, status) 
        VALUES (${id_fornecedor}, ${total}, NOW(), ${documento}, ${id_usuario}, ${nextStatus})
      `;

      const newLancamento = await tx.$queryRaw`SELECT LAST_INSERT_ID() as id`;
      const lancamentoId = newLancamento[0].id;

      for (const item of itens) {
        const qtd = parseFloat(item.qtd || 0);
        const vlrItem = parseFloat(item.vlr_item || 0);
        const vlrTotal = item.vlr_total ? parseFloat(item.vlr_total) : qtd * vlrItem;
        await tx.$queryRaw`
          INSERT INTO lancamento_item (id_lancamento, id_produto, qtd, vlr_item, vlr_total) 
          VALUES (${lancamentoId}, ${item.id_produto}, ${qtd}, ${vlrItem}, ${vlrTotal})
        `;
      }

      return lancamentoId;
    });

    if (nextStatus === 'CONFIRMADO') {
      const itensApply = await prisma.$queryRaw`SELECT id_produto, qtd, vlr_item FROM lancamento_item WHERE id_lancamento = ${lancamentoId}`;
      for (const item of itensApply) {
        const qtd = parseFloat(item.qtd || 0);
        const vlrItem = parseFloat(item.vlr_item || 0);
        await prisma.$queryRaw`UPDATE produto SET saldo = saldo + ${qtd}, oldvalor = valor, valor = ${vlrItem} WHERE id_produto = ${item.id_produto}`;
      }
    }

    const id = lancamentoId;
    const row = await prisma.$queryRaw`
      SELECT l.id_lancamento, l.id_fornecedor, f.razao AS fornecedor_nome, l.total, l.data, l.status
      FROM lancamento l
      LEFT JOIN fornecedor f ON f.id_fornecedor = l.id_fornecedor
      WHERE l.id_lancamento = ${id}
      LIMIT 1
    `;
    const lancamento = row[0];
    const itemRows = await prisma.$queryRaw`
      SELECT li.id_produto, p.nome AS produto_nome, li.qtd, li.vlr_item, li.vlr_total
      FROM lancamento_item li
      LEFT JOIN produto p ON p.id_produto = li.id_produto
      WHERE li.id_lancamento = ${id}
    `;

    res.status(201).json({
      id_lancamento: lancamento.id_lancamento,
      id_fornecedor: lancamento.id_fornecedor,
      fornecedor_nome: lancamento.fornecedor_nome,
      total: parseFloat(lancamento.total || 0),
      data: _iso(lancamento.data),
      status: lancamento.status,
      itens: itemRows.map(i => ({
        id_produto: i.id_produto,
        produto_nome: i.produto_nome,
        qtd: parseFloat(i.qtd || 0),
        vlr_item: parseFloat(i.vlr_item || 0),
        vlr_total: parseFloat(i.vlr_total || 0),
      })),
    });
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

    const id = parseInt(req.params.id);
    const row = await prisma.$queryRaw`SELECT status FROM lancamento WHERE id_lancamento = ${id}`;
    if (!row || row.length === 0) {
      return res.status(404).json({ error: 'Lançamento não encontrado' });
    }

    const current = (row[0].status || '').toUpperCase();

    if (current === 'CONFIRMADO' && nextStatus === 'PENDENTE') {
      return res.status(400).json({ error: 'Não é permitido voltar um lançamento confirmado para pendente' });
    }

    if (nextStatus === 'CANCELADO' && current === 'CONFIRMADO') {
      const vendidos = await prisma.$queryRaw`
        SELECT DISTINCT p.nome AS produto_nome
        FROM lancamento_item li
        JOIN pedido_item pi ON pi.id_produto = li.id_produto
        JOIN pedido pd ON pd.id_pedido = pi.id_pedido
        LEFT JOIN produto p ON p.id_produto = li.id_produto
        WHERE li.id_lancamento = ${id}
          AND UPPER(pd.status) <> 'CANCELADO'
      `;
      if (vendidos.length > 0) {
        const nomes = vendidos.map(v => v.produto_nome || 'Produto').join(', ');
        return res.status(400).json({ error: `Não é possível cancelar: produtos já registraram vendas: ${nomes}` });
      }

      const itens = await prisma.$queryRaw`SELECT id_produto, qtd FROM lancamento_item WHERE id_lancamento = ${id}`;
      for (const item of itens) {
        const qtd = parseFloat(item.qtd || 0);
        await prisma.$queryRaw`UPDATE produto SET saldo = GREATEST(0, saldo - ${qtd}) WHERE id_produto = ${item.id_produto}`;
      }
    }

    if (nextStatus === 'CONFIRMADO' && current !== 'CONFIRMADO') {
      const itens = await prisma.$queryRaw`SELECT id_produto, qtd, vlr_item FROM lancamento_item WHERE id_lancamento = ${id}`;
      for (const item of itens) {
        const qtd = parseFloat(item.qtd || 0);
        const vlrItem = parseFloat(item.vlr_item || 0);
        await prisma.$queryRaw`UPDATE produto SET saldo = saldo + ${qtd}, oldvalor = valor, valor = ${vlrItem} WHERE id_produto = ${item.id_produto}`;
      }
    }

    await prisma.$queryRaw`UPDATE lancamento SET status = ${nextStatus} WHERE id_lancamento = ${id}`;

    const rowUpdated = await prisma.$queryRaw`
      SELECT l.id_lancamento, l.id_fornecedor, f.razao AS fornecedor_nome, l.total, l.data, l.status
      FROM lancamento l
      LEFT JOIN fornecedor f ON f.id_fornecedor = l.id_fornecedor
      WHERE l.id_lancamento = ${id}
      LIMIT 1
    `;
    res.json(rowUpdated[0]);
  } catch (error) {
    res.status(500).json({ error: `Erro ao atualizar status: ${error.message}` });
  }
};