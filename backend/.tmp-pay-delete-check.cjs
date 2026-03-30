const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const target = await p.$queryRawUnsafe("SELECT id_pagamento FROM pagamento WHERE LOWER(TRIM(status)) <> 'excluido' ORDER BY id_pagamento DESC LIMIT 1");
  if (!target[0]) { console.log(JSON.stringify({ message: 'Sem pagamentos para teste' })); await p.$disconnect(); return; }
  const id = Number(target[0].id_pagamento);
  await fetch(`http://localhost:3000/api/pagamentos/${id}`, { method: 'DELETE' });
  const after = await p.$queryRawUnsafe('SELECT id_pagamento, status FROM pagamento WHERE id_pagamento = ?', id);
  console.log(JSON.stringify({ id, after: after[0] }, null, 2));
  await p.$disconnect();
})();
