const prisma = require('../db/prisma');
const bcrypt = require('bcryptjs');
const { paginatedResponse } = require('../utils/response');

const _mapUser = (u) => ({
  id_usuario: u.id_usuario,
  id_cliente: u.id_cliente,
  id_perfil: u.id_perfil,
  usuario: u.usuario,
  cliente_nome: u.cliente?.nome,
  perfil_nome: u.perfil?.perfil,
});

exports.getAll = async (req, res) => {
  try {
    const { skip, limit } = req.pagination || {};
    
    const [users, total] = await Promise.all([
      prisma.usuario.findMany({
        include: {
          cliente: { select: { nome: true } },
          perfil: { select: { perfil: true } }
        },
        orderBy: { id_usuario: 'desc' },
        skip: skip || 0,
        take: limit || 50
      }),
      prisma.usuario.count()
    ]);

    const response = paginatedResponse(users.map(_mapUser), total, req);
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
};

exports.getPerfis = async (req, res) => {
  try {
    const perfis = await prisma.perfil.findMany({ orderBy: { id_perfil: 'asc' } });
    res.json(perfis);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar perfis' });
  }
};

exports.getById = async (req, res) => {
  try {
    const user = await prisma.usuario.findUnique({
      where: { id_usuario: parseInt(req.params.id) },
      include: {
        cliente: { select: { nome: true } },
        perfil: { select: { perfil: true } }
      }
    });
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(_mapUser(user));
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
};

exports.create = async (req, res) => {
  try {
    const { usuario, senha, id_cliente, id_perfil } = req.body;
    if (!usuario || !senha || !id_cliente || !id_perfil) {
      return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
    }
    const hashed = await bcrypt.hash(senha, 12);
    const user = await prisma.usuario.create({
      data: { usuario, senha: hashed, id_cliente, id_perfil },
    });
    const created = await prisma.usuario.findUnique({
      where: { id_usuario: user.id_usuario },
      include: {
        cliente: { select: { nome: true } },
        perfil: { select: { perfil: true } }
      }
    });
    res.status(201).json(_mapUser(created));
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
};

exports.update = async (req, res) => {
  try {
    const { usuario, senha, id_cliente, id_perfil } = req.body;
    const data = {};
    if (usuario) data.usuario = usuario;
    if (id_cliente) data.id_cliente = id_cliente;
    if (id_perfil) data.id_perfil = id_perfil;
    if (senha) data.senha = await bcrypt.hash(senha, 12);

    const user = await prisma.usuario.update({
      where: { id_usuario: parseInt(req.params.id) },
      data,
    });

    const updated = await prisma.usuario.findUnique({
      where: { id_usuario: user.id_usuario },
      include: {
        cliente: { select: { nome: true } },
        perfil: { select: { perfil: true } }
      }
    });
    res.json(_mapUser(updated));
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
};

exports.delete = async (req, res) => {
  try {
    await prisma.usuario.delete({ where: { id_usuario: parseInt(req.params.id) } });
    res.json({ message: 'Usuário deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar usuário' });
  }
};

exports.resetSenha = async (req, res) => {
  try {
    const hashed = await bcrypt.hash('123456', 12);
    await prisma.usuario.update({
      where: { id_usuario: parseInt(req.params.id) },
      data: { senha: hashed },
    });
    const updated = await prisma.usuario.findUnique({
      where: { id_usuario: parseInt(req.params.id) },
      include: {
        cliente: { select: { nome: true } },
        perfil: { select: { perfil: true } }
      }
    });
    res.json(_mapUser(updated));
  } catch (error) {
    res.status(500).json({ error: 'Erro ao resetar senha' });
  }
};