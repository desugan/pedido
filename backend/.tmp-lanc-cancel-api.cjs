const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const fornecedor = (await p.$queryRawUnsafe('SELECT id_fornecedor FROM fornecedor ORDER BY id_fornecedor ASC LIMIT 1'))[0];
  const produto = await p.produto.findFirst({ select: { id_produto: true, saldo: true, valor: true } });
  const user = await p.usuario.findFirst({ select: { id_usuario: true } });
  if (!fornecedor || !produto || !user) throw new Error('Dados insuficientes');

  const before = await p.produto.findUnique({ where: { id_produto: produto.id_produto }, select: { saldo: true, valor: true, oldvalor: true } });
  const payload = {
    id_fornecedor: Number(fornecedor.id_fornecedor),
    id_usuario: Number(user.id_usuario),
    data: new Date().toISOString().slice(0,10),
    itens: [{ id_produto: Number(produto.id_produto), qtd: 1, vlr_item: 7.77 }]
  };

  const createRes = await fetch('http://localhost:3000/api/lancamentos', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
  });
  const created = await createRes.json();

  await fetch(`http://localhost:3000/api/lancamentos/${created.id_lancamento}/status`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'CANCELADO' })
  });

  const after = await p.produto.findUnique({ where: { id_produto: produto.id_produto }, select: { saldo: true, valor: true, oldvalor: true } });
  console.log(JSON.stringify({ idLanc: created.id_lancamento, produtoId: produto.id_produto, before, after }, null, 2));
  await p.$disconnect();
})();
