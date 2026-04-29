const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const rows = await p.$queryRawUnsafe(`SELECT u.id_usuario, u.usuario, u.id_cliente, COUNT(pe.id_pedido) pedidos
    FROM usuario u
    LEFT JOIN pedido pe ON pe.id_cliente = u.id_cliente
    GROUP BY u.id_usuario, u.usuario, u.id_cliente
    ORDER BY pedidos DESC, u.id_usuario DESC
    LIMIT 1`);
  const r = rows[0];
  console.log(JSON.stringify({ id_usuario: Number(r.id_usuario), usuario: r.usuario, id_cliente: Number(r.id_cliente), pedidos: Number(r.pedidos) }, null, 2));
  await p.$disconnect();
})();
