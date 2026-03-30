const { PrismaClient } = require("@prisma/client");
const { createHash } = require("crypto");
const p = new PrismaClient();
async function main() {
  const senhaMd5 = createHash("md5").update("mudar123").digest("hex");
  await p.$executeRawUnsafe("UPDATE usuario SET senha = ? WHERE UPPER(TRIM(usuario)) = UPPER(TRIM(?))", senhaMd5, "SOUZAL2");
  const rows = await p.$queryRawUnsafe("SELECT id_usuario, usuario, senha FROM usuario WHERE UPPER(TRIM(usuario)) = UPPER(TRIM(?))", "SOUZAL2");
  console.log(JSON.stringify(rows, null, 2));
}
main().catch((e)=>{ console.error(e); process.exit(1); }).finally(()=>p.$disconnect());
