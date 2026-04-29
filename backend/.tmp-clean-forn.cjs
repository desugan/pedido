const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const rows = await p.$queryRawUnsafe(`
    SELECT f.id_fornecedor, f.razao, COUNT(l.id_lancamento) AS refs
    FROM fornecedor f
    LEFT JOIN lancamento l ON l.id_fornecedor = f.id_fornecedor
    WHERE UPPER(TRIM(f.razao)) REGEXP '^FORNECEDOR[[:space:]]*[0-9]+'
    GROUP BY f.id_fornecedor, f.razao
    ORDER BY f.id_fornecedor
  `);
  const normalized = rows.map(r => ({ id_fornecedor: Number(r.id_fornecedor), razao: r.razao, refs: Number(r.refs) }));
  const deletable = normalized.filter(r => r.refs === 0);
  if (deletable.length > 0) {
    for (const d of deletable) {
      await p.$executeRawUnsafe('DELETE FROM fornecedor WHERE id_fornecedor = ?', d.id_fornecedor);
    }
  }
  console.log(JSON.stringify({ encontrados: normalized, removidos: deletable.map(d => d.id_fornecedor) }, null, 2));
  await p.$disconnect();
})();
