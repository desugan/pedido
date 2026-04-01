import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { pedidoService, Pedido, CreatePedidoData, CreateItemPedidoData } from '../services/pedidoService';
import { produtoService, Produto } from '../services/produtoService';
import { authService } from '../services/authService';
import { clienteService } from '../services/clienteService';
import { Cliente } from '../types';

const fmtBRL = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatPedidoStatus = (status: string): string => {
  const normalized = String(status || '').trim().toLowerCase().replace(/_/g, ' ');
  if (!normalized) return '';
  return normalized.toUpperCase();
};

const Pedidos: React.FC = () => {
  const [searchParams] = useSearchParams();
  const user = authService.getCurrentUser();
  const isAdmin = user?.id_perfil === 1;
  const currentClienteId = user?.id_cliente ?? 0;

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPedidoId, setSelectedPedidoId] = useState<number | null>(null);
  const [selectedPedidoItems, setSelectedPedidoItems] = useState<Array<{ id?: number; produtoNome: string; quantidade: number; precoUnitario: number; subtotal?: number }>>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const ITEMS_PER_PAGE = 10;

  const [newPedido, setNewPedido] = useState<CreatePedidoData>({
    clienteId: isAdmin ? 0 : currentClienteId,
    itens: [],
  });

  const [newItem, setNewItem] = useState<CreateItemPedidoData>({
    produtoNome: '',
    quantidade: 1,
    precoUnitario: 0,
  });

  const normalizeProdutoNome = (value: string): string => {
    if (!value) return 'Produto';

    // Common mojibake patterns for Portuguese chars encoded as latin1 misread as utf-8
    const replacements: [RegExp, string][] = [
      [/Ã§/g, 'ç'], [/Ã‡/g, 'Ç'],
      [/Ã£/g, 'ã'], [/Ãƒ/g, 'Ã'],
      [/Ã¡/g, 'á'], [/Ã‰/g, 'É'],
      [/Ã©/g, 'é'], [/Ã¢/g, 'â'],
      [/Ãª/g, 'ê'], [/Ã³/g, 'ó'],
      [/Ã´/g, 'ô'], [/Ãµ/g, 'õ'],
      [/Ã•/g, 'Õ'], [/Ã /g, 'à'],
      [/Ãœ/g, 'Ü'], [/Ã¼/g, 'ü'],
      [/Ã­/g, 'í'], [/Ã/g, 'Á'],
      [/Ã'/g, 'Ñ'], [/Ã±/g, 'ñ'],
    ];

    let result = value;
    for (const [pattern, replacement] of replacements) {
      result = result.replace(pattern, replacement);
    }
    if (result !== value) return result;

    // Fallback: try TextDecoder if string contains high bytes
    if (!/[\x80-\xFF]/.test(value)) return value;
    try {
      const bytes = Uint8Array.from(value.split('').map((char) => char.charCodeAt(0)));
      const decoded = new TextDecoder('utf-8').decode(bytes);
      return decoded.includes('�') ? value : decoded;
    } catch {
      return value;
    }
  };

  const query = (searchParams.get('q') || '').trim().toLowerCase();
  const filteredPedidos = pedidos.filter((pedido) => {
    if (!query) return true;
    return [
      String(pedido.id),
      String(pedido.clienteId),
      pedido.status,
      pedido.total.toFixed(2),
    ].some((value) => value.toLowerCase().includes(query));
  });

  const produtoSelecionado = produtos.find((p) => p.nome === newItem.produtoNome);
  const maxQuantidade = produtoSelecionado ? Math.max(1, Math.floor(produtoSelecionado.saldo)) : 1;
  const totalPages = Math.max(1, Math.ceil(filteredPedidos.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const pagedPedidos = filteredPedidos.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const selectedPedido = filteredPedidos.find((pedido) => pedido.id === selectedPedidoId) || null;
  const selectedClienteId = isAdmin ? newPedido.clienteId : currentClienteId;
  const selectedCliente = clientes.find((cliente) => cliente.id_cliente === selectedClienteId) || null;
  
  const calcularSaldoRestante = (cliente: any): number => {
    const financeiro = cliente?.financeiro;
    if (!financeiro) {
      return 0;
    }
    const limiteCredito = Number(financeiro.limite_credito ?? 0);
    const saldoUtilizado = Number(financeiro.saldo_utilizado ?? 0);
    return limiteCredito - saldoUtilizado;
  };

  const totalNovoPedido = newPedido.itens.reduce(
    (acc, item) => acc + item.quantidade * item.precoUnitario,
    0
  );
  const saldoRestanteCliente = calcularSaldoRestante(selectedCliente);
  const saldoInsuficiente = Boolean(selectedCliente && totalNovoPedido > saldoRestanteCliente);

  const getClienteNome = (clienteId: number): string => {
    const cliente = clientes.find((c) => c.id_cliente === clienteId);
    return cliente?.nome || `Cliente ${clienteId}`;
  };

  const getPedidoClienteNome = (pedido: Pedido): string => {
    if (pedido.clienteNome?.trim()) return pedido.clienteNome;
    return getClienteNome(pedido.clienteId);
  };

  const handleRemoveDraftItem = (indexToRemove: number) => {
    setNewPedido((prev) => ({
      ...prev,
      itens: prev.itens.filter((_, index) => index !== indexToRemove),
    }));
  };

  const openDetails = async (pedidoId: number) => {
    if (selectedPedidoId === pedidoId) {
      setSelectedPedidoId(null);
      setSelectedPedidoItems([]);
      return;
    }

    try {
      setDetailsLoading(true);
      setSelectedPedidoId(pedidoId);
      const items = await pedidoService.getItemsByPedidoId(pedidoId);
      setSelectedPedidoItems(items);
    } catch (err) {
      setError('Erro ao carregar itens do pedido');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleRemovePedidoItem = async (pedidoId: number, itemId?: number) => {
    if (!itemId) return;
    if (!window.confirm('Deseja remover este item do pedido?')) return;

    try {
      await pedidoService.removeItemFromPedido(pedidoId, itemId);
      const items = await pedidoService.getItemsByPedidoId(pedidoId);
      setSelectedPedidoItems(items);
      await loadPedidos();
      await loadClientes();
      setError(null);
    } catch (err: any) {
      const message = err?.response?.data?.error || 'Erro ao remover item do pedido';
      setError(message);
    }
  };

  useEffect(() => {
    loadPedidos();
  }, [statusFilter]);

  useEffect(() => {
    loadProdutos();
    loadClientes();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [query]);

  const loadPedidos = async () => {
    try {
      setLoading(true);
      const data = isAdmin
        ? await pedidoService.getAllPedidos(statusFilter || undefined)
        : await pedidoService.getPedidosByClienteId(currentClienteId);

      const filteredData = !isAdmin && statusFilter
        ? data.filter((pedido) => pedido.status === statusFilter)
        : data;

      setPedidos(filteredData);
      setCurrentPage(1);
      setSelectedPedidoId(null);
      setSelectedPedidoItems([]);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar pedidos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadProdutos = async () => {
    try {
      const data = await produtoService.getAll();
      setProdutos(data.filter((produto) => produto.saldo > 0));
    } catch (err) {
      setError('Erro ao carregar produtos');
      console.error(err);
    }
  };

  const loadClientes = async () => {
    try {
      if (!isAdmin) {
        if (!currentClienteId) {
          setClientes([]);
          return;
        }

        const cliente = await clienteService.getClienteById(currentClienteId);
        setClientes(cliente ? [cliente] : []);
        setNewPedido((prev) => ({ ...prev, clienteId: currentClienteId }));
        return;
      }

      const data = await clienteService.getAllClientes();
      setClientes(data);
    } catch (err) {
      setError('Erro ao carregar clientes');
      console.error(err);
    }
  };

  const handleCreatePedido = async (e: React.FormEvent) => {
    e.preventDefault();
    const clienteId = isAdmin ? newPedido.clienteId : currentClienteId;

    if (clienteId <= 0 || newPedido.itens.length === 0) {
      setError('Informe cliente e pelo menos um item');
      return;
    }

    if (selectedCliente && saldoInsuficiente) {
      setError(`Saldo restante insuficiente. Disponível: ${fmtBRL(saldoRestanteCliente)} | Pedido: ${fmtBRL(totalNovoPedido)}`);
      return;
    }

    try {
      await pedidoService.createPedido({
        ...newPedido,
        clienteId,
      });
      setNewPedido({ clienteId: isAdmin ? 0 : currentClienteId, itens: [] });
      setNewItem({ produtoNome: '', quantidade: 1, precoUnitario: 0 });
      await loadClientes();
      await loadPedidos();
      setError(null);
    } catch (err) {
      const message = (err as any)?.response?.data?.error || 'Erro ao criar pedido';
      setError(message);
      console.error(err);
    }
  };

  const handleAddItem = () => {
    if (!newItem.produtoNome || newItem.quantidade <= 0 || newItem.precoUnitario <= 0) {
      setError('Item inválido');
      return;
    }

    const produtoSelecionado = produtos.find((p) => p.nome === newItem.produtoNome);
    if (!produtoSelecionado) {
      setError('Selecione um produto válido');
      return;
    }

    if (newItem.quantidade > produtoSelecionado.saldo) {
      setError(`Saldo insuficiente para o produto ${produtoSelecionado.nome}`);
      return;
    }

    setNewPedido({
      ...newPedido,
      itens: [...newPedido.itens, newItem],
    });

    setNewItem({ produtoNome: '', quantidade: 1, precoUnitario: 0 });
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await pedidoService.updatePedidoStatus(id, status);
      await loadPedidos();
      await loadClientes();
    } catch (err) {
      setError('Erro ao atualizar status');
      console.error(err);
    }
  };

  if (loading) {
    return <div className="p-6">Carregando pedidos...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-5">
        <h1 className="text-3xl font-bold text-slate-900">Pedidos</h1>
        <p className="text-sm text-slate-500 mt-1">Gerencie pedidos com visualização detalhada por modal.</p>
      </div>

      {error && <div className="text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-2 mb-4">{error}</div>}

      <div className="filter-bar">
        <label className="text-sm font-semibold text-slate-700">Filtrar status:</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="filter-select border rounded-xl px-3 py-2 bg-white"
        >
          <option value="">Todos</option>
          <option value="confirmado">Confirmado</option>
          <option value="em_pagamento">Em pagamento</option>
          <option value="pago">Pago</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </div>

      <div className="mb-8 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-semibold mb-3 text-slate-900">Criar novo pedido</h2>
        <form onSubmit={handleCreatePedido} className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
            <select
              value={newPedido.clienteId || ''}
              onChange={(e) => setNewPedido({ ...newPedido, clienteId: Number(e.target.value) })}
              className="border rounded-xl p-2 md:col-span-4 bg-white"
              disabled={!isAdmin}
              required
            >
              <option value="">{isAdmin ? 'Selecione cliente' : 'Seu cliente'}</option>
              {clientes.map((cliente) => (
                <option key={cliente.id_cliente} value={cliente.id_cliente}>
                  {cliente.id_cliente} - {cliente.nome}
                </option>
              ))}
            </select>

            <select
              value={newItem.produtoNome}
              onChange={(e) => {
                const produtoNome = e.target.value;
                const produtoEscolhido = produtos.find((p) => p.nome === produtoNome);
                setNewItem({
                  ...newItem,
                  produtoNome,
                  precoUnitario: produtoEscolhido?.valor ?? 0,
                  quantidade:
                    produtoEscolhido && newItem.quantidade > produtoEscolhido.saldo
                      ? Math.max(1, Math.floor(produtoEscolhido.saldo))
                      : newItem.quantidade,
                });
              }}
              className="border rounded-xl p-2 md:col-span-5 bg-white"
            >
              <option value="">Selecione produto</option>
              {produtos.map((produto) => (
                <option key={produto.id_produto} value={produto.nome}>
                  {produto.nome} - Saldo: {produto.saldo.toFixed(0)} - Valor: {produto.valor.toFixed(2)}
                </option>
              ))}
            </select>

            <input
              type="number"
              step="1"
              min={1}
              max={maxQuantidade}
              placeholder="Qtd"
              value={newItem.quantidade}
              onChange={(e) => {
                const value = Number(e.target.value);
                const quantidadeNormalizada = Number.isNaN(value)
                  ? 1
                  : Math.min(Math.max(1, Math.floor(value)), maxQuantidade);
                setNewItem({ ...newItem, quantidade: quantidadeNormalizada });
              }}
              className="border rounded-xl p-2 md:col-span-1 bg-white"
            />

            <input
              type="number"
              step="0.01"
              placeholder="Preço"
              value={newItem.precoUnitario}
              readOnly
              className="border rounded-xl p-2 md:col-span-1 bg-white"
            />

            <button
              type="button"
              onClick={handleAddItem}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-semibold md:col-span-1"
            >
              +
            </button>
          </div>

          {selectedCliente && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Cliente</p>
                <p className="font-semibold text-slate-900">{selectedCliente.nome}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Limite de crédito</p>
                <p className="font-semibold text-slate-900">{fmtBRL(selectedCliente.financeiro?.limite_credito || 0)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Saldo restante</p>
                <p className={`font-semibold ${saldoRestanteCliente < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                  {fmtBRL(saldoRestanteCliente)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Pedido atual</p>
                <p className={`font-semibold ${saldoInsuficiente ? 'text-red-600' : 'text-slate-900'}`}>
                  {fmtBRL(totalNovoPedido)}
                </p>
              </div>
            </div>
          )}

          {selectedCliente && saldoInsuficiente && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              O saldo restante do cliente é menor que o valor do pedido.
            </div>
          )}

          <div>
            Itens no pedido: {newPedido.itens.map((item, index) => (
              <span key={index} className="inline-flex items-center gap-2 px-2 py-1 mr-1 mb-1 bg-gray-100 rounded">
                {normalizeProdutoNome(item.produtoNome)} ({item.quantidade})
                <button
                  type="button"
                  className="text-red-600 font-bold leading-none"
                  onClick={() => handleRemoveDraftItem(index)}
                  aria-label={`Remover item ${normalizeProdutoNome(item.produtoNome)}`}
                >
                  x
                </button>
              </span>
            ))}
          </div>

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl mt-2 font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!selectedCliente || newPedido.itens.length === 0 || saldoInsuficiente}
          >
            Criar pedido
          </button>
        </form>
      </div>

      <div className="w-full bg-white rounded-2xl shadow overflow-x-auto border border-slate-100">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">ID</th>
              <th className="px-4 py-2 text-left">Cliente</th>
              <th className="px-4 py-2 text-left">Data</th>
              <th className="px-4 py-2 text-left">Detalhes</th>
              <th className="px-4 py-2 text-left">Total</th>
              <th className="px-4 py-2 text-left">Status</th>
              {isAdmin && <th className="px-4 py-2 text-left">Ações</th>}
            </tr>
          </thead>
          <tbody>
            {pagedPedidos.map((pedido) => (
              <tr key={pedido.id} className="border-t">
                <td className="px-4 py-2">{pedido.id}</td>
                <td className="px-4 py-2">{isAdmin ? getPedidoClienteNome(pedido) : 'Você'}</td>
                <td className="px-4 py-2 text-sm text-slate-500 whitespace-nowrap">{pedido.createdAt ? new Date(pedido.createdAt).toLocaleDateString('pt-BR') : '—'}</td>
                <td className="px-4 py-2">
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 text-sm font-semibold"
                    onClick={() => void openDetails(pedido.id)}
                  >
                    {selectedPedidoId === pedido.id ? 'Ocultar' : 'Ver pedido'}
                  </button>
                </td>
                <td className="px-4 py-2">R$ {pedido.total.toFixed(2)}</td>
                <td className="px-4 py-2">{formatPedidoStatus(pedido.status)}</td>
                {isAdmin && (
                  <td className="px-4 py-2 space-x-2 whitespace-nowrap">
                    <button
                      onClick={() => handleUpdateStatus(pedido.id, 'confirmado')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg font-semibold"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(pedido.id, 'cancelado')}
                      className="bg-amber-500 hover:bg-amber-500 text-white px-3 py-1 rounded-lg font-semibold"
                    >
                      Cancelar
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedPedido && (
        <div className="pedido-modal-backdrop" onClick={() => setSelectedPedidoId(null)}>
          <div className="pedido-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-3">
              <h3 className="text-lg font-semibold">Pedido #{selectedPedido.id}</h3>
              <p className="text-sm text-gray-600">
                Cliente {getPedidoClienteNome(selectedPedido)} | Status: {formatPedidoStatus(selectedPedido.status)} | Total: R$ {selectedPedido.total.toFixed(2)}
              </p>
            </div>

            {detailsLoading ? (
              <p className="text-sm text-gray-500">Carregando itens...</p>
            ) : selectedPedidoItems.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto pr-1">
                {selectedPedidoItems.map((item, idx) => (
                  <div key={`${selectedPedido.id}-${item.id ?? idx}`} className="border rounded-md px-3 py-2 bg-slate-50">
                    <p className="font-medium text-sm">
                      {item.produtoNome?.trim() ? normalizeProdutoNome(item.produtoNome) : 'Produto'}
                    </p>
                    <p className="text-sm text-gray-600">
                      Quantidade: {item.quantidade} | Unitário: R$ {item.precoUnitario.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-700 font-semibold">
                      Subtotal: R$ {((item.subtotal ?? item.precoUnitario * item.quantidade)).toFixed(2)}
                    </p>
                    {isAdmin && ['pendente', 'confirmado'].includes(String(selectedPedido.status || '').toLowerCase()) && (
                      <button
                        type="button"
                        className="mt-2 text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 font-semibold"
                        onClick={() => void handleRemovePedidoItem(selectedPedido.id, item.id)}
                      >
                        Remover item
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Este pedido não possui itens disponíveis para visualização.</p>
            )}

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-slate-600 hover:bg-slate-700 text-white font-semibold"
                onClick={() => setSelectedPedidoId(null)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <p className="page-indicator-card text-sm font-medium">
          Página {currentPage} de {totalPages}
        </p>
        <div className="space-x-2">
          <button
            type="button"
            className="px-3 py-1.5 rounded-xl border bg-white disabled:opacity-50 font-semibold"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </button>
          <button
            type="button"
            className="px-3 py-1.5 rounded-xl border bg-white disabled:opacity-50 font-semibold"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Próxima
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pedidos;
