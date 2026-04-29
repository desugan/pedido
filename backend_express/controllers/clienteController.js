const prisma = require('../db/prisma');
const { paginatedResponse } = require('../utils/response');

const _mapCliente = async (c) => {
  const limite = parseFloat(c.financeiro?.limite_credito || 0);
  const saldoUtilizado = parseFloat(c.financeiro?.saldo_utilizado || 0);
  const totalPedidos = await prisma.pedido.count({ where: { id_cliente: c.id_cliente } });
  const totalPagamentos = await prisma.pagamento.count({ where: { id_cliente: c.id_cliente } });

  return {
    id_cliente: c.id_cliente,
    nome: c.nome,
    status: c.status,
    contato: c.contato,
    limite_credito: limite,
    credito_utilizado: saldoUtilizado,
    saldo_restante: limite - saldoUtilizado,
    financeiro: {
      limite_credito: limite,
      saldo_utilizado: saldoUtilizado,
    },
    total_pedidos: totalPedidos,
    total_pagamentos: totalPagamentos,
  };
};

exports.getAll = async (req, res) => {
  try {
    const { skip, limit } = req.pagination || {};

    const [clientes, total] = await Promise.all([
      prisma.cliente.findMany({
        include: { financeiro: true },
        orderBy: { id_cliente: 'desc' },
        skip: skip || 0,
        take: limit || 50
      }),
      prisma.cliente.count()
    ]);

    const mapped = await Promise.all(clientes.map(_mapCliente));
    const response = paginatedResponse(mapped, total, req);
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar clientes' });
  }
};

exports.getById = async (req, res) => {
  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id_cliente: parseInt(req.params.id) },
      include: { financeiro: true }
    });
    if (!cliente) return res.status(404).json({ error: 'Cliente não encontrado' });
    res.json(await _mapCliente(cliente));
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar cliente' });
  }
};

exports.create = async (req, res) => {
  try {
    const { nome, status, limite_credito } = req.body;
    if (!nome) return res.status(400).json({ error: 'Nome é obrigatório' });

    const limite = parseFloat(limite_credito || 0);
    const cliente = await prisma.cliente.create({
      data: {
        nome,
        status: status || 'ATIVO',
        financeiro: {
          create: {
            limite_credito: limite,
            saldo_utilizado: 0,
            ultimo_limite: limite,
          }
        }
      },
      include: { financeiro: true }
    });
    res.status(201).json(await _mapCliente(cliente));
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar cliente' });
  }
};

exports.update = async (req, res) => {
  try {
    const { nome, status, contato, limite_credito } = req.body;
    const data = {};
    if (nome) data.nome = nome;
    if (status) data.status = status;
    if (contato !== undefined) data.contato = contato;

    const cliente = await prisma.cliente.update({
      where: { id_cliente: parseInt(req.params.id) },
      data,
    });

    if (limite_credito !== undefined) {
      const limite = parseFloat(limite_credito);
      const existing = await prisma.financeiro.findFirst({
        where: { id_cliente: cliente.id_cliente },
        orderBy: { id_financeiro: 'desc' }
      });
      if (existing) {
        await prisma.financeiro.update({
          where: { id_financeiro: existing.id_financeiro },
          data: { limite_credito: limite, ultimo_limite: limite, usuario_alteracao: 'SISTEMA' }
        });
      } else {
        await prisma.financeiro.create({
          data: { id_cliente: cliente.id_cliente, limite_credito: limite, saldo_utilizado: 0, ultimo_limite: limite }
        });
      }
    }

    const updated = await prisma.cliente.findUnique({
      where: { id_cliente: cliente.id_cliente },
      include: { financeiro: true }
    });
    res.json(await _mapCliente(updated));
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar cliente' });
  }
};

exports.delete = async (req, res) => {
  try {
    await prisma.cliente.delete({ where: { id_cliente: parseInt(req.params.id) } });
    res.json({ message: 'Cliente deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar cliente' });
  }
};