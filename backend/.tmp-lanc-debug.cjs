const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function t(label, sql) {
  try {
    const r = await prisma.$queryRawUnsafe(sql);
    console.log(label, 'OK', r.length);
  } catch (e) {
    console.log(label, 'FAIL', e.code || e.message);
  }
}

async function run() {
  await t('A', 'SELECT l.id_lancamento, l.id_fornecedor, f.razao AS fornecedor_nome FROM lancamento l LEFT JOIN fornecedor f ON f.id_fornecedor = l.id_fornecedor ORDER BY l.id_lancamento DESC LIMIT 5');
  await t('B', 'SELECT l.id_lancamento, l.id_fornecedor, f.razao AS fornecedor_nome, l.total FROM lancamento l LEFT JOIN fornecedor f ON f.id_fornecedor = l.id_fornecedor ORDER BY l.id_lancamento DESC LIMIT 5');
  await t('C', 'SELECT l.id_lancamento, l.id_fornecedor, f.razao AS fornecedor_nome, l.total, l.data FROM lancamento l LEFT JOIN fornecedor f ON f.id_fornecedor = l.id_fornecedor ORDER BY l.id_lancamento DESC LIMIT 5');
  await t('D', 'SELECT l.id_lancamento, l.id_fornecedor, f.razao AS fornecedor_nome, l.total, l.data, l.status FROM lancamento l LEFT JOIN fornecedor f ON f.id_fornecedor = l.id_fornecedor ORDER BY l.id_lancamento DESC LIMIT 5');
  await prisma.$disconnect();
}

run();
