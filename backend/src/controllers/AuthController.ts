import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';
import bcrypt from 'bcryptjs';
import { logLogin } from '../loginLog';
import { signToken } from '../middleware/auth';

const prisma = new PrismaClient();
const prismaAny = prisma as any;

function toMd5(value: string): string {
  return createHash('md5').update(value).digest('hex').toLowerCase();
}

function looksLikeBcrypt(value: string): boolean {
  return /^\$2[ab]\$/.test(value);
}

async function isValidSenha(senhaBancoRaw: string, senhaEntradaRaw: string): Promise<boolean> {
  const senhaBanco = String(senhaBancoRaw || '').trim();
  const senhaEntrada = String(senhaEntradaRaw || '').trim();

  if (!senhaBanco || !senhaEntrada) {
    return false;
  }

  // New passwords are stored as bcrypt
  if (looksLikeBcrypt(senhaBanco)) {
    return bcrypt.compare(senhaEntrada, senhaBanco);
  }

  // Backward compat: legacy MD5/plain passwords
  const senhaBancoLower = senhaBanco.toLowerCase();
  const senhaEntradaMd5 = toMd5(senhaEntrada);

  return (
    senhaBancoLower === senhaEntrada.toLowerCase()
    || senhaBancoLower === senhaEntradaMd5
  );
}

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { usuario, senha } = req.body as { usuario?: string; senha?: string };

      if (!usuario || !senha) {
        res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
        return;
      }

      const usuarioNormalizado = usuario.trim();
      const senhaNormalizada = senha.trim();

      const user = await prismaAny.usuario.findFirst({
        where: {
          OR: [
            { usuario: usuarioNormalizado },
            { usuario: usuarioNormalizado.toUpperCase() },
            { usuario: usuarioNormalizado.toLowerCase() },
          ],
        },
      });

      const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '');

      if (!user) {
        logLogin({ timestamp: new Date().toISOString(), usuario: usuarioNormalizado, status: 'failed', reason: 'Usuário não encontrado', ip });
        res.status(401).json({ error: 'Usuário ou senha inválidos' });
        return;
      }

      const senhaValida = await isValidSenha(String(user?.senha || ''), senhaNormalizada);

      if (!senhaValida) {
        logLogin({ timestamp: new Date().toISOString(), usuario: usuarioNormalizado, status: 'failed', reason: 'Senha incorreta', id_usuario: user.id_usuario, ip });
        res.status(401).json({ error: 'Usuário ou senha inválidos' });
        return;
      }

      const perfil = await prismaAny.perfil.findUnique({ where: { id_perfil: user.id_perfil } });
      const cliente = await prismaAny.cliente.findUnique({ where: { id_cliente: user.id_cliente } });

      logLogin({ timestamp: new Date().toISOString(), usuario: usuarioNormalizado, status: 'success', reason: 'Sucesso', id_usuario: user.id_usuario, ip });

      const userPayload = {
        id_usuario: user.id_usuario,
        usuario: user.usuario,
        id_perfil: user.id_perfil,
        id_cliente: user.id_cliente,
      };

      const token = signToken(userPayload);

      res.json({
        token,
        user: {
          id_usuario: user.id_usuario,
          usuario: user.usuario,
          id_perfil: user.id_perfil,
          perfil: perfil?.perfil || null,
          id_cliente: user.id_cliente,
          cliente_nome: cliente?.nome || null,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(500).json({ error: message });
    }
  }

  async alterarSenha(req: Request, res: Response): Promise<void> {
    try {
      const id_usuario = req.user?.id_usuario;
      const { senhaAtual, novaSenha, confirmarSenha } = req.body as {
        senhaAtual?: string;
        novaSenha?: string;
        confirmarSenha?: string;
      };

      if (!id_usuario) {
        res.status(401).json({ error: 'Não autenticado' });
        return;
      }

      if (!senhaAtual || !novaSenha || !confirmarSenha) {
        res.status(400).json({ error: 'Todos os campos são obrigatórios' });
        return;
      }

      if (novaSenha !== confirmarSenha) {
        res.status(400).json({ error: 'A confirmação da senha não confere' });
        return;
      }

      if (novaSenha.length < 4) {
        res.status(400).json({ error: 'A nova senha deve ter ao menos 4 caracteres' });
        return;
      }

      const user = await prismaAny.usuario.findUnique({ where: { id_usuario } });
      if (!user) {
        res.status(404).json({ error: 'Usuário não encontrado' });
        return;
      }

      const senhaAtualNormalizada = senhaAtual.trim();

      if (!(await isValidSenha(String(user.senha || ''), senhaAtualNormalizada))) {
        res.status(401).json({ error: 'Senha atual inválida' });
        return;
      }

      const novaSenhaHash = await bcrypt.hash(novaSenha.trim(), 12);
      await prismaAny.usuario.update({
        where: { id_usuario },
        data: { senha: novaSenhaHash },
      });

      res.json({ message: 'Senha alterada com sucesso' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(500).json({ error: message });
    }
  }
}
