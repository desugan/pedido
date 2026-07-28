import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePedidos } from '../hooks/usePedidos';
import { useClientes } from '../hooks/useClientes';
import { useAuth } from '../hooks/useAuth';
import { usePageToast } from '../components/Toast';
import { StatusFilter } from '../components/StatusFilter';
import { Pagination } from '../components/Pagination';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { TableSkeleton } from '../components/TableSkeleton';
import { pedidoService } from '../services/pedidoService';
import { produtoService, Produto } from '../services/produtoService';
import { mapperPedido } from '../mapper/mapperPedido';

const fmtBRL = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatDisplayText = (value: string | number | null | undefined) => String(value || '').trim().toUpperCase();

const normalizeProdutoNome = (value: string): string => {
  if (!value) return 'Produto';
  const replacements: [RegExp, string][] = [
    [/Ã§/g, 'ç'], [/Ã‡/g, 'Ç'], [/Ã£/g, 'ã'], [/Ã¡/g, 'á'],
    [/Ã©/g, 'é'], [/Ãª/g, 'ê'], [/Ã³/g, 'ó'], [/Ã´/g, 'ô'],
    [/Ãµ/g, 'õ'], [/Ã/g, 'à'], [/Ã­/g, 'í'], [/Ã±/g, 'ñ'],
    [/Ãœ/g, 'Ü'], [/Ã¼/g, 'ü'],
  ];
  let result = value;
  for (const [pattern, replacement] of replacements) result = result.replace(pattern, replacement);
  return result;
};

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'em_pagamento', label: 'Em pagamento' },
  { value: 'pago', label: 'Pago' },
  { value: 'cancelado', label: 'Cancelado' },
];

/**
 * Página de gerenciamento de pedidos.
 * @returns {JSX.Element} Página de pedidos.
 */
const Pedidos: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user, isAdmin } = useAuth();
  const { pedidos, loading, total, currentPage, loadPedidos, loadByCliente, create: createPedido, updateStatus: updatePedidoStatus, remove: deletePedido } = usePedidos();
  const { clientes, load: loadClientes } = useClientes();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const carregarProdutos = useCallback(async () => {
    try {
      const result = await produtoService.getAll(1, 10000);
      setProdutos(result.data);
    } catch { /* fallback silencioso */ }
  }, []);
  const toast = usePageToast();

  const currentClienteId = user?.id_cliente ?? 0;
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedPedidoId, setSelectedPedidoId] = useState<number | null>(null);
  const [selectedPedidoItems, setSelectedPedidoItems] = useState<any[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ id: number; status: string } | null>(null);
  const [newPedido, setNewPedido] = useState<any>({ clienteId: isAdmin ? 0 : currentClienteId, itens: [] });
  const [newItem, setNewItem] = useState<any>({ produtoNome: '', quantidade: 1, precoUnitario: 0 });

  const query = (searchParams.get('q') || '').trim().toLowerCase();

  const getSaldoDisponivel = (produtoId: number): number => {
    const produto = produtos.find((p: any) => p.id_produto === produtoId);
    const saldoBase = produto ? Number(produto.saldo) : 0;
    const subtraido = newPedido.itens.filter((item: any) => {
      const p = produtos.find((p2: any) => p2.id_produto === produtoId);
      return p && item.produtoNome === p.nome;
    }).reduce((acc: number, item: any) => acc + item.quantidade, 0);
    return Math.max(0, saldoBase - subtraido);
  };

  const produtoSelecionado = produtos.find((p: any) => p.nome === newItem.produtoNome);
  const saldoDisponivel = produtoSelecionado ? getSaldoDisponivel(produtoSelecionado.id_produto) : 0;
  const selectedCliente = clientes.find((c: any) => c.id_cliente === (isAdmin ? newPedido.clienteId : currentClienteId));
  const totalNovoPedido = newPedido.itens.reduce((acc: number, item: any) => acc + item.quantidade * item.precoUnitario, 0);

  const loadData = useCallback(async (page = 1, status?: string) => {
    const s = status !== undefined ? status : statusFilter;
    if (isAdmin) {
      await loadPedidos(page, query || undefined, s || undefined);
    } else {
      await loadByCliente(currentClienteId, page, s || undefined);
    }
  }, [isAdmin, currentClienteId, statusFilter, query, loadPedidos, loadByCliente]);

  useEffect(() => { loadData(); carregarProdutos(); }, [loadData, carregarProdutos]);

  useEffect(() => { loadData(1); }, [query]);

  const openDetails = async (pedidoId: number) => {
    if (selectedPedidoId === pedidoId) { setSelectedPedidoId(null); setSelectedPedidoItems([]); return; }
    try {
      setDetailsLoading(true);
      setSelectedPedidoId(pedidoId);
      const items = await pedidoService.getItemsByPedidoId(pedidoId);
      setSelectedPedidoItems(items);
    } catch { toast.showError('Erro ao carregar itens'); }
    finally { setDetailsLoading(false); }
  };

  const handleCreatePedido = async (e: React.FormEvent) => {
    e.preventDefault();
    const clienteId = isAdmin ? newPedido.clienteId : currentClienteId;
    if (clienteId <= 0 || newPedido.itens.length === 0) {
      toast.showError('Informe cliente e pelo menos um item');
      return;
    }
    try {
      const result = await createPedido({ ...newPedido, clienteId });
      if (result) {
        setNewPedido({ clienteId: isAdmin ? 0 : currentClienteId, itens: [] });
        setNewItem({ produtoNome: '', quantidade: 1, precoUnitario: 0 });
        toast.showSuccess('Pedido criado com sucesso.');
        setShowCreateModal(false);
        await loadData();
        await carregarProdutos();
        await loadClientes();
      }
    } catch (err: any) {
      toast.showError(err?.response?.data?.error || 'Erro ao criar pedido');
    }
  };

  const handleAddItem = () => {
    if (!newItem.produtoNome || newItem.quantidade <= 0 || newItem.precoUnitario <= 0) {
      toast.showError('Item inválido'); return;
    }
    const produto = produtos.find((p: any) => p.nome === newItem.produtoNome);
    if (!produto) { toast.showError('Selecione um produto válido'); return; }
    if (newItem.quantidade > getSaldoDisponivel(produto.id_produto)) {
      toast.showError(`Saldo insuficiente para ${produto.nome}`); return;
    }

    const existente = newPedido.itens.find((i: any) => i.produtoNome === newItem.produtoNome);
    if (existente) {
      const novaQtd = existente.quantidade + newItem.quantidade;
      const saldoMax = getSaldoDisponivel(produto.id_produto) + existente.quantidade;
      if (novaQtd > saldoMax) {
        toast.showError(`Saldo insuficiente para ${produto.nome}: total ${novaQtd} > disponível ${saldoMax}`);
        return;
      }
      existente.quantidade = novaQtd;
      setNewPedido({ ...newPedido, itens: [...newPedido.itens] });
    } else {
      setNewPedido({ ...newPedido, itens: [...newPedido.itens, { ...newItem, produtoId: produto.id_produto }] });
    }

    setNewItem({ produtoNome: '', quantidade: 1, precoUnitario: 0 });
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await updatePedidoStatus(id, status);
      setPendingAction(null);
      toast.showSuccess(`Pedido #${id} ${status === 'confirmado' ? 'confirmado' : 'cancelado'} com sucesso.`);
      await loadData();
      await loadClientes();
      await carregarProdutos();
    } catch (err: any) {
      toast.showError(err?.response?.data?.error || `Erro ao ${status === 'confirmado' ? 'confirmar' : 'cancelar'} pedido`);
    }
  };

  if (loading) return <div className="container mx-auto px-4 py-8"><TableSkeleton rows={8} /></div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-5">
        <h1 className="text-3xl font-bold text-slate-900">Pedidos</h1>
        <p className="text-sm text-slate-500 mt-1">Gerencie pedidos com visualização detalhada por modal.</p>
      </div>

      <StatusFilter options={STATUS_OPTIONS} selected={statusFilter} onSelect={(v) => { setStatusFilter(v); loadData(1, v); }} />

      <div className="mb-8 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between gap-3 flex-wrap mt-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Criar novo pedido</h2>
          <p className="text-sm text-slate-500">Criação em modal para manter o fluxo padrão.</p>
        </div>
        <button type="button" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-semibold" onClick={() => setShowCreateModal(true)}>
          Novo pedido
        </button>
      </div>

      {showCreateModal && (
        <div className="pedido-modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="pedido-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold text-slate-900">Criar novo pedido</h2>
              <button type="button" className="px-3 py-1 rounded-lg bg-slate-200 font-semibold" onClick={() => setShowCreateModal(false)}>Fechar</button>
            </div>
            <form onSubmit={handleCreatePedido} className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                <select value={newPedido.clienteId || ''} onChange={(e) => setNewPedido({ ...newPedido, clienteId: Number(e.target.value) })}
                  className="border rounded-xl p-2 md:col-span-4 bg-white" disabled={!isAdmin} required>
                  <option value="">{isAdmin ? 'Selecione cliente' : 'Seu cliente'}</option>
                  {clientes.map((c: any) => (
                    <option key={c.id_cliente} value={c.id_cliente}>{c.id_cliente} - {formatDisplayText(c.nome)}</option>
                  ))}
                </select>

                <select value={newItem.produtoNome} onChange={(e) => {
                  const p = produtos.find((p2: any) => p2.nome === e.target.value);
                  setNewItem({ ...newItem, produtoNome: e.target.value, precoUnitario: p?.valor ?? 0,
                    quantidade: p && newItem.quantidade > Number(p.saldo) ? Math.max(1, Math.floor(Number(p.saldo))) : newItem.quantidade });
                }} className="border rounded-xl p-2 md:col-span-5 bg-white">
                  <option value="">Selecione produto</option>
                  {produtos.filter((p: any) => getSaldoDisponivel(p.id_produto) > 0).map((p: any) => (
                    <option key={p.id_produto} value={p.nome}>{formatDisplayText(p.nome)} - SALDO: {getSaldoDisponivel(p.id_produto).toFixed(0)}</option>
                  ))}
                </select>

                <input type="number" step="1" min={1} max={saldoDisponivel || 1} placeholder="Qtd" value={newItem.quantidade}
                  disabled={!produtoSelecionado || saldoDisponivel <= 0}
                  onChange={(e) => setNewItem({ ...newItem, quantidade: Math.min(Math.max(1, Math.floor(Number(e.target.value))), saldoDisponivel || 1) })}
                  className="border rounded-xl p-2 md:col-span-1 bg-white" />

                <input type="number" step="0.01" placeholder="Preço" value={newItem.precoUnitario} readOnly className="border rounded-xl p-2 md:col-span-1 bg-white" />

                <button type="button" onClick={handleAddItem} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-semibold md:col-span-1">+</button>
              </div>

              {selectedCliente && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div><p className="text-xs uppercase tracking-wide text-slate-500">Cliente</p><p className="font-semibold">{formatDisplayText(selectedCliente.nome)}</p></div>
                  <div><p className="text-xs uppercase tracking-wide text-slate-500">Limite</p><p className="font-semibold">{fmtBRL(selectedCliente.limiteCredito || 0)}</p></div>
                  <div><p className="text-xs uppercase tracking-wide text-slate-500">Saldo</p><p className={`font-semibold ${selectedCliente.saldoRestante < 0 ? 'text-red-600' : 'text-emerald-700'}`}>{fmtBRL(selectedCliente.saldoRestante || 0)}</p></div>
                  <div><p className="text-xs uppercase tracking-wide text-slate-500">Total</p><p className="font-semibold">{fmtBRL(totalNovoPedido)}</p></div>
                </div>
              )}

              <div>Itens: {newPedido.itens.map((item: any, idx: number) => (
                <span key={idx} className="inline-flex items-center gap-2 px-2 py-1 mr-1 mb-1 bg-gray-100 rounded">
                  {normalizeProdutoNome(item.produtoNome)} ({item.quantidade})
                  <button type="button" className="text-red-600 font-bold" onClick={() => setNewPedido({ ...newPedido, itens: newPedido.itens.filter((_: any, i: number) => i !== idx) })}>x</button>
                </span>
              ))}</div>

              <button type="submit" disabled={!selectedCliente || newPedido.itens.length === 0 || totalNovoPedido > (selectedCliente?.saldoRestante || 999999)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl mt-2 font-semibold disabled:opacity-60">
                Criar pedido
              </button>
            </form>
          </div>
        </div>
      )}

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
            {pedidos.map((pedido: any) => (
              <tr key={pedido.id} className="border-t">
                <td className="px-4 py-2">{pedido.id}</td>
                <td className="px-4 py-2">{isAdmin ? (pedido.clienteNome || `Cliente ${pedido.clienteId}`) : 'VOCÊ'}</td>
                <td className="px-4 py-2 text-sm text-slate-500 whitespace-nowrap">{pedido.createdAt ? new Date(pedido.createdAt).toLocaleDateString('pt-BR') : '—'}</td>
                <td className="px-4 py-2">
                  <button type="button" className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 text-sm font-semibold"
                    onClick={() => openDetails(pedido.id)}>
                    {selectedPedidoId === pedido.id ? 'Ocultar' : 'Ver pedido'}
                  </button>
                </td>
                <td className="px-4 py-2">R$ {pedido.total.toFixed(2)}</td>
                <td className="px-4 py-2">{(pedido.status || '').toUpperCase()}</td>
                {isAdmin && (
                  <td className="px-4 py-2 space-x-2 whitespace-nowrap">
                    <button onClick={() => pedido.status === 'pendente' ? setPendingAction({ id: pedido.id, status: 'confirmado' }) : toast.showError(`Pedido #${pedido.id} não pode ser confirmado`)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg font-semibold">Confirmar</button>
                    <button onClick={() => pedido.status === 'pendente' ? setPendingAction({ id: pedido.id, status: 'cancelado' }) : toast.showError(`Pedido #${pedido.id} não pode ser cancelado`)}
                      className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded-lg font-semibold">Cancelar</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedPedidoId && (() => {
        const pedido = pedidos.find((p: any) => p.id === selectedPedidoId);
        if (!pedido) return null;
        return (
          <div className="pedido-modal-backdrop" onClick={() => setSelectedPedidoId(null)}>
            <div className="pedido-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-3">
                <h3 className="text-lg font-semibold">Pedido #{pedido.id}</h3>
                <p className="text-sm text-gray-600">Cliente {pedido.clienteNome || `#${pedido.clienteId}`} | Total: R$ {pedido.total.toFixed(2)}</p>
              </div>
              {detailsLoading ? <p className="text-sm text-gray-500">Carregando itens...</p> : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto pr-1">
                  {selectedPedidoItems.map((item: any, idx: number) => (
                    <div key={idx} className="border rounded-md px-3 py-2 bg-slate-50">
                      <p className="font-medium text-sm">{item.produtoNome?.trim() ? normalizeProdutoNome(item.produtoNome) : 'Produto'}</p>
                      <p className="text-sm text-gray-600">Qtd: {item.quantidade} | Unit: R$ {item.precoUnitario.toFixed(2)}</p>
                      <p className="text-sm text-gray-700 font-semibold">Subtotal: R$ {(item.subtotal ?? item.precoUnitario * item.quantidade).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 flex justify-end">
                <button type="button" className="px-4 py-2 rounded-xl bg-slate-600 hover:bg-slate-700 text-white font-semibold" onClick={() => setSelectedPedidoId(null)}>Fechar</button>
              </div>
            </div>
          </div>
        );
      })()}

      {pendingAction && (
        <ConfirmDialog
          title="Confirmar ação"
          message={`Deseja realmente ${pendingAction.status === 'confirmado' ? 'confirmar' : 'cancelar'} o pedido #${pendingAction.id}?`}
          onConfirm={() => handleUpdateStatus(pendingAction.id, pendingAction.status)}
          onCancel={() => setPendingAction(null)}
        />
      )}

      <Pagination currentPage={currentPage} totalPages={Math.max(1, Math.ceil(total / 10))} onPageChange={(p) => loadData(p)} />
    </div>
  );
};

export default Pedidos;
