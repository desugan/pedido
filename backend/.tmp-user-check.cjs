const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
async function main() {
  const rows = await p.$queryRawUnsafe("SELECT id_usuario, usuario, senha, LENGTH(usuario) AS len_usuario, LENGTH(senha) AS len_senha FROM usuario WHERE UPPER(TRIM(usuario)) = UPPER(TRIM(?))", "SOUZAL2");
  const sanitized = rows.map((r) => ({ ...r, len_usuario: Number(r.len_usuario), len_senha: Number(r.len_senha) }));
  console.log(JSON.stringify(sanitized, null, 2));
}
main().catch((e)=>{ console.error(e); process.exit(1); }).finally(()=>p.$disconnect());
