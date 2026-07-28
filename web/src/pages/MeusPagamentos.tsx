import React, { useEffect, useState, useCallback } from 'react';
import { pagamentoService, Pagamento } from '../services/pagamentoService';
import { pedidoService, Pedido } from '../services/pedidoService';
import { authService } from '../services/authService';
import { configService } from '../services/configService';
import { usePageToast } from '../components/Toast';
import { generatePixQRCode } from '../utils/pixQRCode';

const fmtBRL = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatStatus = (status: string) => String(status || '').replace(/_/g, ' ').trim().toUpperCase();

const MeusPagamentos: React.FC = () => {
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [pedidosDisponiveis, setPedidosDisponiveis] = useState<Pedido[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [formLoading, setFormLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmPixKey, setConfirmPixKey] = useState('');
  const [confirmPixNome, setConfirmPixNome] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [creating, setCreating] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailPayment, setDetailPayment] = useState<Pagamento | null>(null);
  const [detailQrDataUrl, setDetailQrDataUrl] = useState('');
  const toast = usePageToast();

  const user = authService.getCurrentUser();

  const loadPagamentos = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    const data = await pagamentoService.getPagamentosByClienteId(user.id_cliente);
    setPagamentos(data);
    setCurrentPage(1);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadPagamentos(); }, [loadPagamentos]);

  const openForm = async () => {
    if (!user) return;
    setShowForm(true);
    setSelectedIds([]);
    setFormLoading(true);
    try {
      const result = await pedidoService.getPedidosParaPagamento(1, 10000, '', user.id_cliente);
      setPedidosDisponiveis(result.data);
    } catch {
      toast.showError('Erro ao carregar pedidos');
      setPedidosDisponiveis([]);
    } finally {
      setFormLoading(false);
    }
  };

  const togglePedido = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectedPedidos = pedidosDisponiveis.filter((p) => selectedIds.includes(p.id));
  const totalSelecionado = selectedPedidos.reduce((acc, p) => acc + p.total, 0);

  const handleConfirmSelect = async () => {
    if (selectedIds.length === 0 || !user) return;
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
    if (selectedIds.length === 0 || !user) return;
    setCreating(true);
    try {
      await pagamentoService.createPagamento({
        valor: totalSelecionado,
        id_cliente: user.id_cliente,
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

  const openDetail = async (p: Pagamento) => {
    setDetailPayment(p);
    if (p.chavepix) {
      try {
        const url = await generatePixQRCode(p.chavepix, p.valor, p.clienteNome, 'CIDADE');
        setDetailQrDataUrl(url);
      } catch { setDetailQrDataUrl(''); }
    } else { setDetailQrDataUrl(''); }
    setShowDetailModal(true);
  };

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.max(1, Math.ceil(pagamentos.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const pagedPagamentos = pagamentos.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  if (loading) return <div className="p-6">Carregando...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Meus Pagamentos</h1>
        <button onClick={openForm} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold">Novo Pagamento</button>
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
                  <button type="button" disabled={selectedIds.length === 0} onClick={handleConfirmSelect} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl font-semibold">Confirmar</button>
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
                Nenhuma chave PIX configurada.
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

      {pagamentos.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Nenhum pagamento encontrado.</div>
      ) : (
        <>
          <div className="bg-white rounded-2xl shadow overflow-x-auto border border-slate-100">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-left">Valor</th>
                  <th className="px-4 py-2 text-left">Detalhe</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {pagedPagamentos.map((pagamento) => (
                  <tr key={pagamento.id_pagamento} className="border-t">
                    <td className="px-4 py-2">{pagamento.id_pagamento}</td>
                    <td className="px-4 py-2">{fmtBRL(pagamento.valor)}</td>
                    <td className="px-4 py-2">
                      <button onClick={() => openDetail(pagamento)} className="text-blue-600 hover:text-blue-800 font-semibold text-sm">Detalhe</button>
                    </td>
                    <td className="px-4 py-2">{formatStatus(pagamento.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="page-indicator-card text-sm font-medium">Página {currentPage} de {totalPages}</p>
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
        </>
      )}
    </div>
  );
};

export default MeusPagamentos;
