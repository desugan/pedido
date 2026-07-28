import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePagamentos } from '../hooks/usePagamentos';
import { usePageToast } from '../components/Toast';
import { Pagination } from '../components/Pagination';
import { pedidoService, Pedido } from '../services/pedidoService';
import { authService } from '../services/authService';
import { configService } from '../services/configService';
import { Pagamento } from '../services/pagamentoService';
import { generatePixQRCode } from '../utils/pixQRCode';

const fmtBRL = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/**
 * Página de gerenciamento de pagamentos.
 * @returns {JSX.Element} Página de pagamentos.
 */
const Pagamentos: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { pagamentos, total, currentPage, load, create: createPagamento, updateStatus } = usePagamentos();
  const toast = usePageToast();
  const currentUser = authService.getCurrentUser();
  const isAdmin = currentUser?.id_perfil === 1;

  const [filter, setFilter] = useState<'' | 'PENDENTE' | 'PAGO' | 'CANCELADO'>('');
  const [showForm, setShowForm] = useState(false);
  const [pedidosDisponiveis, setPedidosDisponiveis] = useState<Pedido[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [formLoading, setFormLoading] = useState(false);
  const [showPixModal, setShowPixModal] = useState(false);
  const [pixKey, setPixKey] = useState('');
  const [pixNome, setPixNome] = useState('');
  const [pixLoading, setPixLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmPixKey, setConfirmPixKey] = useState('');
  const [confirmPixNome, setConfirmPixNome] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailPayment, setDetailPayment] = useState<Pagamento | null>(null);
  const [detailQrDataUrl, setDetailQrDataUrl] = useState('');
  const [creating, setCreating] = useState(false);

  const query = (searchParams.get('q') || '').trim().toLowerCase();

  const loadPagamentos = useCallback((page = 1, status?: string) => {
    const s = status !== undefined ? status : filter;
    load(page, query || undefined, s || undefined);
  }, [filter, query, load]);

  useEffect(() => { loadPagamentos(1); }, [query]);

  const openForm = async () => {
    setShowForm(true);
    setSelectedIds([]);
    setFormLoading(true);
    try {
      const user = authService.getCurrentUser();
      const result = await pedidoService.getPedidosParaPagamento(1, 10000, '', user?.id_cliente);
      setPedidosDisponiveis(result.data);
    } catch {
      toast.showError('Erro ao carregar pedidos disponiveis');
      setPedidosDisponiveis([]);
    } finally {
      setFormLoading(false);
    }
  };

  const openPixModal = async () => {
    setShowPixModal(true);
    setPixLoading(true);
    try {
      const [key, nome] = await Promise.all([configService.getPixKey(), configService.getPixNome()]);
      setPixKey(key);
      setPixNome(nome);
    } catch {
      toast.showError('Erro ao carregar configuracao PIX');
    } finally {
      setPixLoading(false);
    }
  };

  const handleSavePix = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pixKey.trim()) return;
    try {
      await Promise.all([configService.setPixKey(pixKey.trim()), configService.setPixNome(pixNome.trim())]);
      toast.showSuccess('Configuracao PIX salva.');
      setShowPixModal(false);
    } catch {
      toast.showError('Erro ao salvar configuracao PIX');
    }
  };

  const togglePedido = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectedPedidos = pedidosDisponiveis.filter((p) => selectedIds.includes(p.id));
  const totalSelecionado = selectedPedidos.reduce((acc, p) => acc + p.total, 0);
  const clienteId = selectedPedidos[0]?.clienteId ?? 0;

  const handleConfirmSelect = async () => {
    if (selectedIds.length === 0 || !clienteId) return;
    setShowForm(false);
    const [key, nome] = await Promise.all([configService.getPixKey(), configService.getPixNome()]);
    setConfirmPixKey(key);
    setConfirmPixNome(nome);
    if (key) {
      try {
        const url = await generatePixQRCode(key, totalSelecionado, nome, 'CIDADE');
        setQrDataUrl(url);
      } catch { setQrDataUrl(''); }
    } else { setQrDataUrl(''); }
    setShowConfirmModal(true);
  };

  const handleCreatePayment = async () => {
    if (selectedIds.length === 0 || !clienteId) return;
    setCreating(true);
    try {
      await createPagamento({
        valor: totalSelecionado,
        id_cliente: clienteId,
        pedidoIds: selectedIds,
        qrcode: '',
        chavepix: confirmPixKey,
      });
      toast.showSuccess('Pagamento criado.');
      setShowConfirmModal(false);
      setSelectedIds([]);
      await loadPagamentos();
    } catch {
      toast.showError('Erro ao criar pagamento');
    } finally {
      setCreating(false);
    }
  };

  const openDetail = async (p: any) => {
    setDetailPayment(p);
    if (p.chavepix) {
      try {
        const url = await generatePixQRCode(p.chavepix, p.valor, p.clienteNome, 'CIDADE');
        setDetailQrDataUrl(url);
      } catch { setDetailQrDataUrl(''); }
    } else { setDetailQrDataUrl(''); }
    setShowDetailModal(true);
  };

  const handleStatus = async (id: number, status: string) => {
    try {
      await updateStatus(id, status);
      toast.showSuccess('Status atualizado.');
      await loadPagamentos();
    } catch { toast.showError('Erro ao atualizar status'); }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Pagamentos</h1>
        <div className="flex gap-2">
          <button onClick={openForm} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold">Novo Pagamento</button>
          <button onClick={openPixModal} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-semibold">Configurar PIX</button>
        </div>
      </div>

      {showForm && (
        <div className="pedido-modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="pedido-modal-card max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Novo Pagamento</h3>
            {formLoading ? (
              <div className="text-center py-8 text-gray-500">Carregando pedidos...</div>
            ) : pedidosDisponiveis.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Nenhum pedido confirmado disponivel para pagamento.</div>
            ) : (
              <div className="space-y-4">
                <div className="max-h-64 overflow-y-auto border rounded-xl">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase w-10">
                          <input type="checkbox" checked={selectedIds.length === pedidosDisponiveis.length} onChange={() =>
                            setSelectedIds(selectedIds.length === pedidosDisponiveis.length ? [] : pedidosDisponiveis.map((p) => p.id))
                          } />
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Pedido</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Cliente</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Valor</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pedidosDisponiveis.map((p) => (
                        <tr key={p.id} className={`hover:bg-gray-50 cursor-pointer ${selectedIds.includes(p.id) ? 'bg-blue-50' : ''}`} onClick={() => togglePedido(p.id)}>
                          <td className="px-4 py-2">
                            <input type="checkbox" checked={selectedIds.includes(p.id)} onClick={(e) => e.stopPropagation()} onChange={() => togglePedido(p.id)} />
                          </td>
                          <td className="px-4 py-2 text-sm font-medium">#{p.id}</td>
                          <td className="px-4 py-2 text-sm">{p.clienteNome || '-'}</td>
                          <td className="px-4 py-2 text-sm">{fmtBRL(p.total)}</td>
                          <td className="px-4 py-2 text-sm">{new Date(p.createdAt).toLocaleDateString('pt-BR')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm font-medium text-gray-600">
                    {selectedIds.length} pedido(s) selecionado(s)
                  </span>
                  <span className="text-lg font-bold text-gray-800">
                    Total: {fmtBRL(totalSelecionado)}
                  </span>
                </div>

                <div className="flex gap-2 justify-end mt-4">
                  <button type="button" className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 font-semibold" onClick={() => { setShowForm(false); setSelectedIds([]); }}>Cancelar</button>
                  <button type="button" disabled={selectedIds.length === 0 || !clienteId} onClick={handleConfirmSelect} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl font-semibold">Confirmar</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="pedido-modal-backdrop" onClick={() => setShowConfirmModal(false)}>
          <div className="pedido-modal-card max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Confirmar Pagamento</h3>

            <div className="space-y-3 mb-4">
              <div className="text-sm text-gray-600">
                {selectedPedidos.map((p) => (
                  <div key={p.id} className="flex justify-between py-1 border-b last:border-0">
                    <span>Pedido #{p.id}</span>
                    <span className="font-medium">{fmtBRL(p.total)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-lg font-bold pt-2">
                <span>Total</span>
                <span>{fmtBRL(totalSelecionado)}</span>
              </div>
            </div>

            {qrDataUrl ? (
              <div className="flex flex-col items-center gap-2 mb-4">
                <img src={qrDataUrl} alt="QR Code PIX" className="w-48 h-48" />
                <span className="text-xs text-gray-500 break-all text-center">{confirmPixKey}</span>
                {confirmPixNome && <span className="text-sm font-medium">{confirmPixNome}</span>}
              </div>
            ) : confirmPixKey ? (
              <div className="text-center mb-4 p-3 bg-gray-50 rounded-xl">
                <p className="text-sm font-medium text-gray-700">Chave PIX</p>
                <p className="text-sm break-all">{confirmPixKey}</p>
              </div>
            ) : (
              <div className="text-center mb-4 p-3 bg-amber-50 rounded-xl text-sm text-amber-700">
                Nenhuma chave PIX configurada. Configure em "Configurar PIX" antes de criar o pagamento.
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button type="button" className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 font-semibold" onClick={() => { setShowConfirmModal(false); setShowForm(true); }}>Voltar</button>
              <button type="button" disabled={creating || !confirmPixKey} onClick={handleCreatePayment} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl font-semibold">
                {creating ? 'Criando...' : 'Confirmar Pagamento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPixModal && (
        <div className="pedido-modal-backdrop" onClick={() => setShowPixModal(false)}>
          <div className="pedido-modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Configurar PIX</h3>
            {pixLoading ? (
              <div className="text-center py-4 text-gray-500">Carregando...</div>
            ) : (
              <form onSubmit={handleSavePix} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Chave PIX</label>
                  <input className="border rounded-xl p-2 w-full" value={pixKey} onChange={(e) => setPixKey(e.target.value)} type="text" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome PIX</label>
                  <input className="border rounded-xl p-2 w-full" value={pixNome} onChange={(e) => setPixNome(e.target.value)} type="text" />
                </div>
                <div className="flex gap-2 justify-end mt-4">
                  <button type="button" className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 font-semibold" onClick={() => setShowPixModal(false)}>Cancelar</button>
                  <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-semibold">Salvar</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {showDetailModal && detailPayment && (
        <div className="pedido-modal-backdrop" onClick={() => setShowDetailModal(false)}>
          <div className="pedido-modal-card max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Detalhe do Pagamento</h3>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm"><span className="text-gray-500">ID:</span><span className="font-medium">#{detailPayment.id_pagamento}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Valor:</span><span className="font-medium">{fmtBRL(detailPayment.valor)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Status:</span>
                <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                  detailPayment.status === 'PAGO' ? 'bg-green-100 text-green-800'
                  : detailPayment.status === 'CANCELADO' ? 'bg-red-100 text-red-800'
                  : 'bg-amber-100 text-amber-800'}`}>{detailPayment.status}</span>
              </div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Data:</span><span className="font-medium">{detailPayment.data ? new Date(detailPayment.data).toLocaleDateString('pt-BR') : '-'}</span></div>
              {detailPayment.clienteNome && <div className="flex justify-between text-sm"><span className="text-gray-500">Cliente:</span><span className="font-medium">{detailPayment.clienteNome}</span></div>}
              {detailPayment.pedidoIds?.length > 0 && (
                <div className="text-sm"><span className="text-gray-500">Pedidos:</span>
                  <span className="font-medium ml-1">{detailPayment.pedidoIds.map((id: number) => `#${id}`).join(', ')}</span>
                </div>
              )}
            </div>

            {detailQrDataUrl ? (
              <div className="flex flex-col items-center gap-2 mb-4">
                <img src={detailQrDataUrl} alt="QR Code PIX" className="w-48 h-48" />
                <span className="text-xs text-gray-500 break-all text-center">{detailPayment.chavepix}</span>
              </div>
            ) : detailPayment.chavepix ? (
              <div className="text-center mb-4 p-3 bg-gray-50 rounded-xl">
                <p className="text-sm font-medium text-gray-700">Chave PIX</p>
                <p className="text-sm break-all">{detailPayment.chavepix}</p>
              </div>
            ) : null}

            <div className="flex justify-end">
              <button type="button" className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 font-semibold" onClick={() => setShowDetailModal(false)}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 mb-4">
        <div className="flex gap-2">
          {(['', 'PENDENTE', 'PAGO', 'CANCELADO'] as const).map((f) => (
            <button key={f} onClick={() => { setFilter(f); loadPagamentos(1, f); }}
              className={`px-3 py-1 rounded-xl text-sm font-semibold ${filter === f ? 'bg-blue-600 text-white' : 'bg-slate-200 hover:bg-slate-300'}`}>
              {f === '' ? 'Todos' : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow overflow-x-auto border border-slate-100">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600 uppercase">Pedido</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600 uppercase">Data</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600 uppercase">Valor</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600 uppercase">Detalhe</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600 uppercase">Status</th>
              {isAdmin && <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600 uppercase">Ações</th>}
            </tr>
          </thead>
          <tbody>
            {pagamentos.map((p: any) => (
              <tr key={p.id_pagamento} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{p.id_pagamento}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{p.pedidoId}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(p.data).toLocaleDateString('pt-BR')}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{fmtBRL(p.valor)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button onClick={() => openDetail(p)} className="text-blue-600 hover:text-blue-800 font-semibold">Detalhe</button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    p.status === 'PAGO' ? 'bg-green-100 text-green-800'
                    : p.status === 'CANCELADO' ? 'bg-red-100 text-red-800'
                    : 'bg-amber-100 text-amber-800'}`}>{p.status}</span>
                </td>
                {isAdmin && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <select value={p.status} onChange={(e) => handleStatus(p.id_pagamento, e.target.value)}
                      className="border rounded-lg px-3 py-1.5 pr-8 text-sm min-w-[120px]">
                      <option value="PENDENTE">Pendente</option>
                      <option value="PAGO">Pago</option>
                      <option value="CANCELADO">Cancelado</option>
                    </select>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={currentPage} totalPages={Math.max(1, Math.ceil(total / 10))} onPageChange={(p) => loadPagamentos(p)} />

      {pagamentos.length === 0 && <div className="text-center py-8 text-gray-500">Nenhum pagamento encontrado.</div>}
    </div>
  );
};

export default Pagamentos;
