const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const publicKey = fs.readFileSync(path.join(__dirname, '../jwt_public.pem'), 'utf8');

const PUBLIC_PATHS = ['/health', '/api/health', '/api/auth/login', '/api/auth/register'];

const ALGORITHM_WHITELIST = ['RS256'];

const validateTokenAlgorithm = (token) => {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return false;
    const headerPart = parts[0];
    const padded = headerPart.length % 4 !== 0 ? headerPart + '='.repeat(4 - headerPart.length % 4) : headerPart;
    const headerBytes = Buffer.from(padded, 'base64').toString('utf8');
    const header = JSON.parse(headerBytes);
    const alg = header.alg || '';
    return ALGORITHM_WHITELIST.includes(alg);
  } catch (e) {
    return false;
  }
};

const authMiddleware = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.set('Access-Control-Max-Age', '3600');
    return res.status(200).end();
  }

  const path = req.path;
  const isPublic = PUBLIC_PATHS.some(p => path === p || path.startsWith(p));

  if (isPublic) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn(`401 - Missing token header: ${path}`);
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const token = authHeader.slice(7);

  if (!validateTokenAlgorithm(token)) {
    console.warn(`401 - Invalid token algorithm: ${path}`);
    return res.status(401).json({ error: 'Token inválido' });
  }

  try {
    const decoded = jwt.verify(token, publicKey, {
      algorithms: ['RS256'],
      issuer: process.env.JWT_ISSUER || 'butecodoti',
      audience: process.env.JWT_AUDIENCE || 'butecodoti-api'
    });
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      console.warn(`401 - Expired token: ${path}`);
      return res.status(401).json({ error: 'Token expirado' });
    }
    if (error.name === 'JsonWebTokenError') {
      if (error.message.includes('issuer')) {
        console.warn(`401 - Invalid issuer: ${path}, error: ${error.message}`);
        return res.status(401).json({ error: 'Token inválido (issuer)' });
      }
      if (error.message.includes('audience')) {
        console.warn(`401 - Invalid audience: ${path}, error: ${error.message}`);
        return res.status(401).json({ error: 'Token inválido (audience)' });
      }
      if (error.message.includes('signature')) {
        console.warn(`401 - Invalid signature: ${path}, error: ${error.message}`);
        return res.status(401).json({ error: 'Token inválido (assinatura)' });
      }
      console.warn(`401 - Decode error: ${path}, error: ${error.message}`);
      return res.status(401).json({ error: 'Token mal formatado' });
    }
    console.error(`401 - Token error: ${path}, error: ${error.name}: ${error.message}`);
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};

module.exports = authMiddleware;