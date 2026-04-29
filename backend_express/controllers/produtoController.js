const prisma = require('../db/prisma');
const { paginatedResponse } = require('../utils/response');

exports.getAll = async (req, res) => {
  try {
    const { skip, limit } = req.pagination || {};

    const [produtos, total] = await Promise.all([
      prisma.produto.findMany({
        orderBy: { id_produto: 'desc' },
        skip: skip || 0,
        take: limit || 50
      }),
      prisma.produto.count()
    ]);

    const mapped = produtos.map(p => ({
      id_produto: p.id_produto,
      nome: p.nome,
      valor: parseFloat(p.valor),
      oldvalor: p.oldvalor ? parseFloat(p.oldvalor) : null,
      marca: p.marca,
      saldo: parseFloat(p.saldo),
    }));

    const response = paginatedResponse(mapped, total, req);
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
};

exports.getById = async (req, res) => {
  try {
    const produto = await prisma.produto.findUnique({
      where: { id_produto: parseInt(req.params.id) }
    });
    if (!produto) return res.status(404).json({ error: 'Produto não encontrado' });
    res.json({
      id_produto: produto.id_produto,
      nome: produto.nome,
      valor: parseFloat(produto.valor),
      oldvalor: produto.oldvalor ? parseFloat(produto.oldvalor) : null,
      marca: produto.marca,
      saldo: parseFloat(produto.saldo),
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar produto' });
  }
};

exports.create = async (req, res) => {
  try {
    const { nome, marca, valor, saldo } = req.body;
    if (!nome || !marca) return res.status(400).json({ error: 'Nome e marca são obrigatórios' });
    const valorNum = parseFloat(valor || 0);
    if (valorNum <= 0) return res.status(400).json({ error: 'Valor deve ser maior que zero' });

    const produto = await prisma.produto.create({
      data: {
        nome,
        marca,
        valor: valorNum,
        oldvalor: valorNum,
        saldo: parseFloat(saldo || 0),
      }
    });
    res.status(201).json({
      id_produto: produto.id_produto,
      nome: produto.nome,
      valor: parseFloat(produto.valor),
      oldvalor: parseFloat(produto.oldvalor),
      marca: produto.marca,
      saldo: parseFloat(produto.saldo),
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar produto' });
  }
};

exports.update = async (req, res) => {
  try {
    const { nome, marca, valor, saldo } = req.body;
    const data = {};
    if (nome) data.nome = nome;
    if (marca) data.marca = marca;
    if (saldo !== undefined) data.saldo = parseFloat(saldo);
    if (valor !== undefined) {
      const valorNum = parseFloat(valor);
      data.oldvalor = { push: prisma.produto.fields.valor };
      data.valor = valorNum;
    }

    const produto = await prisma.produto.update({
      where: { id_produto: parseInt(req.params.id) },
      data,
    });

    res.json({
      id_produto: produto.id_produto,
      nome: produto.nome,
      valor: parseFloat(produto.valor),
      oldvalor: produto.oldvalor ? parseFloat(produto.oldvalor) : null,
      marca: produto.marca,
      saldo: parseFloat(produto.saldo),
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
};

exports.delete = async (req, res) => {
  try {
    await prisma.produto.delete({ where: { id_produto: parseInt(req.params.id) } });
    res.json({ message: 'Produto deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar produto' });
  }
};