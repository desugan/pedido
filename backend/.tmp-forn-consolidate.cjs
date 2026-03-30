const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const randoms = await p.$queryRawUnsafe(`
    SELECT id_fornecedor FROM fornecedor
    WHERE UPPER(TRIM(razao)) REGEXP '^FORNECEDOR[[:space:]]*[0-9]+'
    ORDER BY id_fornecedor
  `);
  if (!randoms.length) {
    console.log(JSON.stringify({ message: 'Nenhum fornecedor aleatorio encontrado' }, null, 2));
    await p.$disconnect();
    return;
  }

  const user = await p.$queryRawUnsafe('SELECT id_usuario FROM usuario ORDER BY id_usuario ASC LIMIT 1');
  const userId = user[0]?.id_usuario ?? null;

  await p.$executeRawUnsafe(
    'INSERT INTO fornecedor (razao, cnpj, status, data, id_usuario) VALUES (?, ?, ?, ?, ?)',
    'FORNECEDOR PRINCIPAL',
    null,
    'ATIVO',
    new Date(),
    userId
  );
  const inserted = await p.$queryRawUnsafe('SELECT LAST_INSERT_ID() AS id');
  const novoId = Number(inserted[0].id);

  const ids = randoms.map(r => Number(r.id_fornecedor));
  const placeholders = ids.map(() => '?').join(',');

  await p.$executeRawUnsafe(`UPDATE lancamento SET id_fornecedor = ? WHERE id_fornecedor IN (${placeholders})`, novoId, ...ids);
  await p.$executeRawUnsafe(`DELETE FROM fornecedor WHERE id_fornecedor IN (${placeholders})`, ...ids);

  const finalRows = await p.$queryRawUnsafe('SELECT id_fornecedor, razao, status FROM fornecedor ORDER BY id_fornecedor');
  console.log(JSON.stringify({ migradosDe: ids, novoFornecedorId: novoId, fornecedoresAtuais: finalRows }, null, 2));
  await p.$disconnect();
})();
