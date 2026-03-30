const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
p.usuario.findMany({
  select: { id_usuario: true, usuario: true, senha: true },
  take: 20,
}).then((rows) => {
  console.log(JSON.stringify(rows, null, 2));
}).catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(() => p.$disconnect());
