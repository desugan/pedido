const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const prisma = require('../db/prisma');

const privateKey = fs.readFileSync(path.join(__dirname, '../jwt_private.pem'), 'utf8');

const generateToken = (user) => {
  const payload = {
    id_usuario: user.id_usuario,
    usuario: user.usuario,
    id_cliente: user.id_cliente,
    id_perfil: user.id_perfil
  };

  const now = Math.floor(Date.now() / 1000);
  const expiresIn = parseInt(process.env.JWT_TTL_MINUTES) || 120;

  return jwt.sign(
    {
      ...payload,
      iat: now,
      exp: now + (expiresIn * 60),
      iss: process.env.JWT_ISSUER || 'butecodoti',
      aud: process.env.JWT_AUDIENCE || 'butecodoti-api'
    },
    privateKey,
    { algorithm: 'RS256' }
  );
};

exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    const existingUser = await prisma.usuario.findUnique({ where: { usuario: email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.usuario.create({
      data: {
        usuario: email,
        senha: hashedPassword,
        name
      }
    });

    const token = generateToken(user);
    res.status(201).json({ 
      user: { id_usuario: user.id_usuario, usuario: user.usuario, name: user.name }, 
      token 
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.usuario.findUnique({ where: { usuario: email } });
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const validPassword = await bcrypt.compare(password, user.senha);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = generateToken(user);
    res.json({ 
      user: { id_usuario: user.id_usuario, usuario: user.usuario, name: user.name }, 
      token 
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
};