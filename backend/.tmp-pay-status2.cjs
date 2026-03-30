const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const rows = await p.$queryRawUnsafe("SELECT DISTINCT LOWER(TRIM(status)) AS status_norm, COUNT(*) total FROM pagamento GROUP BY LOWER(TRIM(status)) ORDER BY total DESC");
  const safe = rows.map(r => ({ status_norm: r.status_norm, total: Number(r.total) }));
  console.log(JSON.stringify(safe, null, 2));
  await p.$disconnect();
})();
