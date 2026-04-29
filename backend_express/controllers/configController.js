const prisma = require('../db/prisma');

const _getConfig = async (key) => {
  const row = await prisma.appConfig.findUnique({ where: { config_key: key } });
  return row?.config_value || null;
};

const _setConfig = async (key, value) => {
  await prisma.appConfig.upsert({
    where: { config_key: key },
    update: { config_value: value },
    create: { config_key: key, config_value: value }
  });
};

exports.getPixKey = async (req, res) => {
  try {
    const pixKey = await _getConfig('pix_key');
    res.json({ pixKey });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar chave PIX' });
  }
};

exports.setPixKey = async (req, res) => {
  try {
    const { pixKey } = req.body;
    if (!pixKey) return res.status(400).json({ error: 'Chave PIX é obrigatória' });
    await _setConfig('pix_key', pixKey);
    res.json({ pixKey });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar chave PIX' });
  }
};

exports.getPixNome = async (req, res) => {
  try {
    const pixNome = await _getConfig('pix_nome');
    res.json({ pixNome });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar nome PIX' });
  }
};

exports.setPixNome = async (req, res) => {
  try {
    const { pixNome } = req.body;
    if (!pixNome) return res.status(400).json({ error: 'Nome PIX é obrigatório' });
    await _setConfig('pix_nome', pixNome);
    res.json({ pixNome });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar nome PIX' });
  }
};