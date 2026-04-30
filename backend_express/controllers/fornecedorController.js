const prisma = require('../db/prisma');
const { paginatedResponse } = require('../utils/response');

exports.getAll = async (req, res) => {
  try {
    const { skip, limit } = req.pagination || {};

    const [fornecedores, total] = await Promise.all([
      prisma.fornecedor.findMany({
        orderBy: { id_fornecedor: 'desc' },
        skip: skip || 0,
        take: limit || 50
      }),
      prisma.fornecedor.count()
    ]);

    const response = paginatedResponse(fornecedores, total, req);
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar fornecedores' });
  }
};

exports.getById = async (req, res) => {
  try {
    const fornecedor = await prisma.fornecedor.findUnique({
      where: { id_fornecedor: parseInt(req.params.id) }
    });
    if (!fornecedor) return res.status(404).json({ error: 'Fornecedor não encontrado' });
    res.json(fornecedor);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar fornecedor' });
  }
};

exports.create = async (req, res) => {
  try {
    const { razao, cnpj, status } = req.body;
    if (!razao) return res.status(400).json({ error: 'Razão social é obrigatória' });

    const fornecedor = await prisma.fornecedor.create({
      data: {
        razao,
        cnpj: cnpj || '',
        status: status || 'ATIVO'
      }
    });
    res.status(201).json(fornecedor);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar fornecedor' });
  }
};

exports.update = async (req, res) => {
  try {
    const { razao, cnpj, status } = req.body;
    const data = {};
    if (razao) data.razao = razao;
    if (cnpj !== undefined) data.cnpj = cnpj;
    if (status) data.status = status;

    const fornecedor = await prisma.fornecedor.update({
      where: { id_fornecedor: parseInt(req.params.id) },
      data
    });
    res.json(fornecedor);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar fornecedor' });
  }
};

exports.delete = async (req, res) => {
  try {
    await prisma.fornecedor.delete({ where: { id_fornecedor: parseInt(req.params.id) } });
    res.json({ message: 'Fornecedor deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar fornecedor' });
  }
};