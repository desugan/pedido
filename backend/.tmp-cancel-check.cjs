const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const produto = await p.produto.findFirst({ select: { id_produto: true, saldo: true, valor: true, oldvalor: true } });
  const fornecedor = await p.$queryRawUnsafe('SELECT id_fornecedor FROM fornecedor ORDER BY id_fornecedor ASC LIMIT 1');
  const user = await p.usuario.findFirst({ select: { id_usuario: true } });
  if (!produto || !fornecedor[0] || !user) throw new Error('Dados insuficientes para teste');

  const before = await p.produto.findUnique({ where: { id_produto: produto.id_produto }, select: { saldo: true, valor: true, oldvalor: true } });
  const totalItem = 3.21;
  await p.$executeRawUnsafe('INSERT INTO lancamento (id_fornecedor,total,data,status,id_usuario,data_lancamento,documento) VALUES (?,?,?,?,?,?,?)', fornecedor[0].id_fornecedor, totalItem, new Date(), 'PENDENTE', user.id_usuario, new Date(), `TEST-${Date.now()}`);
  const inserted = await p.$queryRawUnsafe('SELECT LAST_INSERT_ID() AS id');
  const idLanc = Number(inserted[0].id);
  await p.$executeRawUnsafe('INSERT INTO lancamento_item (id_lancamento,id_produto,qtd,vlr_item,vlr_total) VALUES (?,?,?,?,?)', idLanc, produto.id_produto, 1, totalItem, totalItem);
  await p.$executeRawUnsafe('UPDATE produto SET oldvalor = valor, valor = ?, saldo = saldo + 1 WHERE id_produto = ?', totalItem, produto.id_produto);

  await p.$executeRawUnsafe('UPDATE lancamento SET status = ? WHERE id_lancamento = ?', 'CANCELADO', idLanc);

  const afterCancel = await p.produto.findUnique({ where: { id_produto: produto.id_produto }, select: { saldo: true, valor: true, oldvalor: true } });
  console.log(JSON.stringify({ produtoId: produto.id_produto, before, afterCancel, lancamentoTeste: idLanc }, null, 2));
  await p.$disconnect();
})();
