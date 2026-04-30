const prisma = require('../db/prisma');

const _toN = (v) => v === null || v === undefined ? null : Number(v);
const _iso = (v) => v && typeof v.toISOString === 'function' ? v.toISOString() : v;
const _norm = (v) => String(v || '').trim().toLowerCase();

const _map = (r) => ({
  id_pagamento: _toN(r.id_pagamento),
  valor: parseFloat(r.valor || 0),
  qrcode: r.qrcode,
  chavepix: r.chavepix,
  status: r.status,
  data_criacao: _iso(r.data_criacao),
  data_pagamento: _iso(r.data_pagamento),
  id_cliente: _toN(r.id_cliente),
  cliente: r.cliente_nome ? { nome: r.cliente_nome } : null,
});

const _ids = (arr) => {
  if (!Array.isArray(arr)) return [];
  const seen = new Set(), out = [];
  for (const x of arr) {
    const n = parseInt(x);
    if (n > 0 && !seen.has(n)) { seen.add(n); out.push(n); }
  }
  return out;
};

const _linked = async (pid) => {
  const r = await prisma.$queryRaw`SELECT id_pedido FROM pagamentopedido WHERE id_pagamento = ${pid}`;
  return r.map(x => _toN(x.id_pedido));
};

const _fin = async (cid) => {
  const r = await prisma.$queryRaw`SELECT id_financeiro FROM financeiro WHERE id_cliente = ${cid} ORDER BY id_financeiro DESC LIMIT 1`;
  if (r.length) return _toN(r[0].id_financeiro);
  await prisma.$queryRaw`INSERT INTO financeiro (id_cliente, limite_credito, saldo_utilizado, ultimo_limite, data_criacao, usuario_alteracao) VALUES (${cid}, 0, 0, 0, NOW(), 'SISTEMA')`;
  const c = await prisma.$queryRaw`SELECT id_financeiro FROM financeiro WHERE id_cliente = ${cid} ORDER BY id_financeiro DESC LIMIT 1`;
  return _toN(c[0].id_financeiro);
};

const _sub = async (cid, amt) => {
  if (amt <= 0) return;
  const fid = await _fin(cid);
  const r = await prisma.$queryRaw`SELECT saldo_utilizado FROM financeiro WHERE id_financeiro = ${fid}`;
  const novo = Math.max(parseFloat(r[0]?.saldo_utilizado || 0) - amt, 0);
  await prisma.$queryRaw`UPDATE financeiro SET saldo_utilizado = ${novo}, usuario_alteracao = 'SISTEMA' WHERE id_financeiro = ${fid}`;
};

const _add = async (cid, amt) => {
  if (amt <= 0) return;
  const fid = await _fin(cid);
  const r = await prisma.$queryRaw`SELECT saldo_utilizado FROM financeiro WHERE id_financeiro = ${fid}`;
  const novo = parseFloat(r[0]?.saldo_utilizado || 0) + amt;
  await prisma.$queryRaw`UPDATE financeiro SET saldo_utilizado = ${novo}, usuario_alteracao = 'SISTEMA' WHERE id_financeiro = ${fid}`;
};

exports.getAll = async (req, res) => {
  const { status } = req.query;
  const rows = status 
    ? await prisma.$queryRaw`SELECT p.*, c.nome AS cliente_nome FROM pagamento p LEFT JOIN cliente c ON c.id_cliente = p.id_cliente WHERE p.status = ${status} ORDER BY p.id_pagamento DESC`
    : await prisma.$queryRaw`SELECT p.*, c.nome AS cliente_nome FROM pagamento p LEFT JOIN cliente c ON c.id_cliente = p.id_cliente ORDER BY p.id_pagamento DESC`;
  res.json(rows.map(_map));
};

exports.getByCliente = async (req, res) => {
  const id = parseInt(req.params.clienteId);
  const rows = await prisma.$queryRaw`SELECT p.*, c.nome AS cliente_nome FROM pagamento p LEFT JOIN cliente c ON c.id_cliente = p.id_cliente WHERE p.id_cliente = ${id} ORDER BY p.id_pagamento DESC`;
  res.json(rows.map(_map));
};

exports.getById = async (req, res) => {
  const id = parseInt(req.params.id);
  const rows = await prisma.$queryRaw`SELECT p.*, c.nome AS cliente_nome FROM pagamento p LEFT JOIN cliente c ON c.id_cliente = p.id_cliente WHERE p.id_pagamento = ${id} LIMIT 1`;
  if (!rows.length) return res.status(404).json({ error: 'Pagamento não encontrado' });

  const p = _map(rows[0]);
  const pp = await prisma.$queryRaw`SELECT * FROM pagamentopedido WHERE id_pagamento = ${id}`;
  p.pagamentopedido = pp.map(x => ({ id_pagamento_pedido: _toN(x.id_pagamento_pedido), id_pedido: _toN(x.id_pedido), id_pagamento: _toN(x.id_pagamento) }));

  const pids = pp.map(x => _toN(x.id_pedido)).filter(x => x > 0);
  if (!pids.length) { p.pedidos = []; return res.json(p); }

  const ids = pids.join(',');
  const peds = await prisma.$queryRaw`SELECT p.*, c.nome AS cliente_nome FROM pedido p LEFT JOIN cliente c ON c.id_cliente = p.id_cliente WHERE p.id_pedido IN (${prisma.$queryRaw(ids)})`;
  const itns = await prisma.$queryRaw`SELECT pi.*, pr.nome AS produto_nome FROM pedido_item pi LEFT JOIN produto pr ON pr.id_produto = pi.id_produto WHERE pi.id_pedido IN (${prisma.$queryRaw(ids)})`;

  const itmMap = {};
  for (const i of itns) { const pid = _toN(i.id_pedido); if (!itmMap[pid]) itmMap[pid] = []; itmMap[pid].push({ id: _toN(i.id_item_pedido), pedidoId: pid, produtoNome: i.produto_nome || '', quantidade: parseFloat(i.qtd || 0), precoUnitario: parseFloat(i.vlr_item || 0), subtotal: parseFloat(i.vlr_total || 0) }); }

  p.pedidos = peds.map(x => ({ id: _toN(x.id_pedido), clienteId: _toN(x.id_cliente), clienteNome: x.cliente_nome, status: x.status, total: parseFloat(x.total || 0), createdAt: _iso(x.data), updatedAt: _iso(x.data), itens: itmMap[_toN(x.id_pedido)] || [] }));
  res.json(p);
};

exports.create = async (req, res) => {
  console.log('CREATE PAGAMENTO - body:', JSON.stringify(req.body).substring(0,500));
  const { id_cliente, valor, qrcode, chavepix, status, pedidoIds } = req.body;
  if (!id_cliente || !valor || !qrcode || !chavepix) return res.status(400).json({ error: 'Dados inválidos' });
  const pids = _ids(pedidoIds);
  console.log('CREATE PAGAMENTO - pids:', pids);
  if (!pids.length) return res.status(400).json({ error: 'Selecione ao menos um pedido' });

  const stat = (status || 'pendente').toLowerCase() || 'pendente';
  const idsStr = pids.join(',');

  try {
    console.log('CHECK - id_cliente:', parseInt(id_cliente), 'pids:', pids);
    
    // Check directly with prisma - simplified query
    const testPed = await prisma.pedido.findFirst({
      where: { id_pedido: pids[0], id_cliente: parseInt(id_cliente), status: 'confirmado' },
      select: { id_pedido: true, status: true }
    });
    console.log('CHECK - testPed:', testPed);
    
    if (!testPed) throw new Error('Pedido não encontrado com status confirmado');
    
    await prisma.$transaction(async tx => {
      console.log('TRANSACTION - inserting pagamento');
      await tx.$queryRaw`INSERT INTO pagamento (valor, qrcode, chavepix, status, data_criacao, id_cliente) VALUES (${parseFloat(valor)}, ${String(qrcode).substring(0,1000)}, ${String(chavepix).substring(0,255)}, ${stat}, NOW(), ${parseInt(id_cliente)})`;
      const last = await tx.$queryRaw`SELECT LAST_INSERT_ID() as id`;
      const pid = Number(last[0].id);
      console.log('TRANSACTION - pid:', pid);
      for (const p of pids) await tx.$queryRaw`INSERT INTO pagamentopedido (id_pedido, id_pagamento) VALUES (${p}, ${pid})`;
      if (pids.length) {
        await tx.$queryRaw`UPDATE pedido SET status = 'em_pagamento' WHERE id_pedido = ${pids[0]} AND status = 'confirmado'`;
      }
    });
    const rows = await prisma.$queryRaw`SELECT p.*, c.nome AS cliente_nome FROM pagamento p LEFT JOIN cliente c ON c.id_cliente = p.id_cliente ORDER BY p.id_pagamento DESC LIMIT 1`;
    console.log('CREATE - success, row:', rows[0]?.id_pagamento);
    res.status(201).json(_map(rows[0]));
  } catch (e) {
    console.log('CREATE - error:', e.message);
    res.status(500).json({ error: 'Erro: ' + e.message });
  }
};

exports.updateStatus = async (req, res) => {
  const { status } = req.body;
  const newStat = (status || '').trim().toLowerCase();
  if (!newStat) return res.status(400).json({ error: 'Status inválido' });

  const id = parseInt(req.params.id);
  const row = await prisma.$queryRaw`SELECT status FROM pagamento WHERE id_pagamento = ${id}`;
  if (!row.length) return res.status(404).json({ error: 'Pagamento não encontrado' });

  const oldStat = _norm(row[0].status);
  const wasApp = oldStat === 'aprovado';
  const isApp = newStat === 'aprovado';
  const isRoll = ['cancelado', 'rejeitado', 'excluido', 'pendente'].includes(newStat);

  if (newStat === 'aprovado') await prisma.$queryRaw`UPDATE pagamento SET status = ${newStat}, data_pagamento = NOW() WHERE id_pagamento = ${id}`;
  else await prisma.$queryRaw`UPDATE pagamento SET status = ${newStat} WHERE id_pagamento = ${id}`;

  const pids = await _linked(id);
  if (pids.length) {
    const ids = pids.join(',');
    const peds = await prisma.$queryRaw`SELECT * FROM pedido WHERE id_pedido IN (${prisma.$queryRaw(ids)})`;
    if (!wasApp && isApp) {
      await prisma.$queryRaw`UPDATE pedido SET status = 'pago' WHERE id_pedido IN (${prisma.$queryRaw(ids)}) AND status IN ('confirmado', 'em_pagamento')`;
      const sum = {}; for (const p of peds) { if (!_norm(p.status).match(/pago|cancelado/)) sum[_toN(p.id_cliente)] = (sum[_toN(p.id_cliente)] || 0) + parseFloat(p.total); }
      for (const [c, v] of Object.entries(sum)) await _sub(parseInt(c), v);
    }
    if (isRoll) {
      await prisma.$queryRaw`UPDATE pedido SET status = 'confirmado' WHERE id_pedido IN (${prisma.$queryRaw(ids)}) AND status IN ('em_pagamento', 'pago')`;
      if (wasApp) { const sum = {}; for (const p of peds) { if (_norm(p.status) === 'pago') sum[_toN(p.id_cliente)] = (sum[_toN(p.id_cliente)] || 0) + parseFloat(p.total); } for (const [c, v] of Object.entries(sum)) await _add(parseInt(c), v); }
    }
  }
  const rows = await prisma.$queryRaw`SELECT p.*, c.nome AS cliente_nome FROM pagamento p LEFT JOIN cliente c ON c.id_cliente = p.id_cliente WHERE p.id_pagamento = ${id} LIMIT 1`;
  res.json(_map(rows[0]));
};