const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const rows = await p.$queryRawUnsafe('SELECT id_fornecedor, razao, status FROM fornecedor ORDER BY id_fornecedor');
  console.log(JSON.stringify(rows, null, 2));
  await p.$disconnect();
})();
