import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import QRCode from 'qrcode';
import { pagamentoService, Pagamento, CreatePagamentoData } from '../services/pagamentoService';
import { authService } from '../services/authService';
import { pedidoService, Pedido } from '../services/pedidoService';
import { configService } from '../services/configService';

const Pagamentos: React.FC = () => {
  const [searchParams] = useSearchParams();
  const user = authService.getCurrentUser();
  const isAdmin = user?.id_perfil === 1;
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [pedidosConfirmados, setPedidosConfirmados] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPedidoIds, setSelectedPedidoIds] = useState<number[]>([]);
  const [pixKey, setPixKey] = useState('');
  const [pixKeyInput, setPixKeyInput] = useState('');
  const [savingPixKey, setSavingPixKey] = useState(false);
  const [qrPreview, setQrPreview] = useState('');
  const [pixCopiaCola, setPixCopiaCola] = useState('');
  const normalizeStatus = (status: string | undefined): 'pendente' | 'aprovado' | 'rejeitado' | 'cancelado' | '' => {
    const value = (status || '').trim().toLowerCase();

    if (value === 'aberto' || value === 'pendente' || value === 'aguardando' || value === 'em_aberto' || value === 'em aberto' || value === 'processando pagamento') return 'pendente';
    if (value === 'confirmado' || value === 'aprovado' || value === 'pago' || value === 'liquidado') return 'aprovado';
    if (value === 'rejeitado') return 'rejeitado';
    if (value === 'cancelado') return 'cancelado';

    return '';
  };
  const formatStatus = (status: string | undefined): string => {
    const normalizedStatus = normalizeStatus(status);

    if (normalizedStatus === 'pendente') return 'aberto';
    if (normalizedStatus === 'aprovado') return 'confirmado';
    if (normalizedStatus === 'rejeitado') return 'rejeitado';
    if (normalizedStatus === 'cancelado') return 'cancelado';

    return status || '';
  };
  const query = (searchParams.get('q') || '').trim().toLowerCase();
  const filteredPagamentos = pagamentos.filter((pagamento) => {
    if (!query) return true;
    return [
      String(pagamento.id_pagamento),
      String(pagamento.id_cliente),
      pagamento.cliente?.nome || '',
      formatStatus(pagamento.status),
      pagamento.valor.toFixed(2),
    ].some((value) => value.toLowerCase().includes(query));
  });

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.max(1, Math.ceil(filteredPagamentos.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const pagedPagamentos = filteredPagamentos.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const [newPagamento, setNewPagamento] = useState<CreatePagamentoData>({
    valor: 0,
    qrcode: 'auto',
    chavepix: 'auto',
    id_cliente: user?.id_cliente ?? 0,
  });

  const selectedPedidos = pedidosConfirmados.filter((pedido) => selectedPedidoIds.includes(pedido.id));
  const selectedPedidosTotal = selectedPedidos.reduce((acc, pedido) => acc + pedido.total, 0);

  useEffect(() => {
    void loadPagamentos();
  }, [statusFilter]);

  useEffect(() => {
    if (!isAdmin) {
      void loadPedidosConfirmados();
    }
  }, [isAdmin]);

  useEffect(() => {
    void loadPixKey();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [query]);

  const loadPedidosConfirmados = async () => {
    try {
      if (!user?.id_cliente) {
        setPedidosConfirmados([]);
        return;
      }

      const pedidosDoCliente = await pedidoService.getPedidosByClienteId(user.id_cliente);
      const confirmados = pedidosDoCliente.filter((pedido) => pedido.status === 'confirmado');
      setPedidosConfirmados(confirmados);
    } catch (err) {
      setError('Erro ao carregar pedidos confirmados');
      console.error(err);
    }
  };

  const loadPixKey = async () => {
    try {
      const key = await configService.getPixKey();
      setPixKey(key);
      setPixKeyInput(key);
    } catch (err) {
      console.error(err);
    }
  };

  const createPixPayload = (key: string, amount: number): string => {
    const normalizeText = (value: string, maxLength: number): string => {
      const normalized = value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9 ]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toUpperCase();

      return normalized.slice(0, maxLength) || 'NA';
    };

    const tlv = (id: string, value: string): string => `${id}${String(value.length).padStart(2, '0')}${value}`;

    const crc16 = (payload: string): string => {
      let crc = 0xffff;

      for (let i = 0; i < payload.length; i += 1) {
        crc ^= payload.charCodeAt(i) << 8;

        for (let bit = 0; bit < 8; bit += 1) {
          if ((crc & 0x8000) !== 0) {
            crc = (crc << 1) ^ 0x1021;
          } else {
            crc <<= 1;
          }

          crc &= 0xffff;
        }
      }

      return crc.toString(16).toUpperCase().padStart(4, '0');
    };

    const pixKeyValue = key.trim();
    const amountValue = Number(amount).toFixed(2);
    const merchantName = normalizeText('Buteco TI', 25);
    const merchantCity = normalizeText('Londrina', 15);
    const txid = '***';

    const gui = tlv('00', 'BR.GOV.BCB.PIX');
    const keyField = tlv('01', pixKeyValue);
    const merchantAccountInfo = tlv('26', `${gui}${keyField}`);
    const additionalDataField = tlv('62', tlv('05', txid));

    const partialPayload = [
      tlv('00', '01'),
      tlv('01', '11'),
      merchantAccountInfo,
      tlv('52', '0000'),
      tlv('53', '986'),
      tlv('54', amountValue),
      tlv('58', 'BR'),
      tlv('59', merchantName),
      tlv('60', merchantCity),
      additionalDataField,
      '6304',
    ].join('');

    const checksum = crc16(partialPayload);
    return `${partialPayload}${checksum}`;
  };

  const isValidPixKeyFormat = (value: string): boolean => {
    const key = value.trim();
    if (!key) return false;

    const onlyDigits = key.replace(/\D/g, '');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+55\d{10,11}$/;
    const randomKeyRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    const isValidCpf = (cpf: string): boolean => {
      if (!/^\d{11}$/.test(cpf) || /^(\d)\1+$/.test(cpf)) return false;
      let sum = 0;
      for (let i = 0; i < 9; i += 1) sum += Number(cpf[i]) * (10 - i);
      let check = (sum * 10) % 11;
      if (check === 10) check = 0;
      if (check !== Number(cpf[9])) return false;
      sum = 0;
      for (let i = 0; i < 10; i += 1) sum += Number(cpf[i]) * (11 - i);
      check = (sum * 10) % 11;
      if (check === 10) check = 0;
      return check === Number(cpf[10]);
    };

    const isValidCnpj = (cnpj: string): boolean => {
      if (!/^\d{14}$/.test(cnpj) || /^(\d)\1+$/.test(cnpj)) return false;
      const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
      const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
      let sum = 0;
      for (let i = 0; i < 12; i += 1) sum += Number(cnpj[i]) * weights1[i];
      let check = sum % 11 < 2 ? 0 : 11 - (sum % 11);
      if (check !== Number(cnpj[12])) return false;
      sum = 0;
      for (let i = 0; i < 13; i += 1) sum += Number(cnpj[i]) * weights2[i];
      check = sum % 11 < 2 ? 0 : 11 - (sum % 11);
      return check === Number(cnpj[13]);
    };

    return (
      emailRegex.test(key)
      || phoneRegex.test(key)
      || isValidCpf(onlyDigits)
      || isValidCnpj(onlyDigits)
      || randomKeyRegex.test(key)
    );
  };

  const handleSavePixKey = async () => {
    if (!isValidPixKeyFormat(pixKeyInput)) {
      setError('Formato de chave PIX inválido (use CPF, CNPJ, email, telefone +55 ou chave aleatória)');
      return;
    }

    try {
      setSavingPixKey(true);
      const saved = await configService.setPixKey(pixKeyInput);
      setPixKey(saved);
      setError(null);
    } catch (err) {
      setError('Erro ao salvar chave PIX');
      console.error(err);
    } finally {
      setSavingPixKey(false);
    }
  };

  const togglePedidoSelection = (pedidoId: number) => {
    setSelectedPedidoIds((prev) => (
      prev.includes(pedidoId)
        ? prev.filter((id) => id !== pedidoId)
        : [...prev, pedidoId]
    ));
  };

  const formatPedidoDate = (dateValue?: string) => {
    if (!dateValue) return 'Data não informada';
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) return 'Data inválida';
    return parsed.toLocaleDateString('pt-BR');
  };

  useEffect(() => {
    const value = isAdmin ? newPagamento.valor : selectedPedidosTotal;
    if (!pixKey || value <= 0) {
      setQrPreview('');
      setPixCopiaCola('');
      return;
    }

    const payload = createPixPayload(pixKey, value);
    setPixCopiaCola(payload);
    void QRCode.toDataURL(payload, { width: 200, margin: 1 })
      .then(setQrPreview)
      .catch(() => setQrPreview(''));
  }, [pixKey, selectedPedidosTotal, newPagamento.valor, isAdmin]);

  const loadPagamentos = async () => {
    try {
      setLoading(true);
      const data = isAdmin
        ? await pagamentoService.getAllPagamentos()
        : await pagamentoService.getPagamentosByClienteId(user?.id_cliente ?? 0);

      const filtered = statusFilter
        ? data.filter((pagamento) => normalizeStatus(pagamento.status) === statusFilter)
        : data;

      setPagamentos(filtered);
      setCurrentPage(1);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar pagamentos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePagamento = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pixKey) {
      setError('Chave PIX não configurada');
      return;
    }

    try {
      if (!isAdmin) {
        if (!user?.id_cliente) {
          setError('Usuário sem cliente associado');
          return;
        }

        if (!selectedPedidoIds.length) {
          setError('Selecione ao menos um pedido confirmado');
          return;
        }

        const pixPayload = createPixPayload(pixKey, selectedPedidosTotal);
        const qrCodeDataUrl = await QRCode.toDataURL(pixPayload, { width: 300, margin: 1 });

        await pagamentoService.createPagamento({
          id_cliente: user.id_cliente,
          valor: selectedPedidosTotal,
          qrcode: qrCodeDataUrl,
          chavepix: pixKey,
          pedidoIds: selectedPedidoIds,
        });
      } else {
        if (newPagamento.id_cliente <= 0 || newPagamento.valor <= 0) {
          setError('Preencha cliente e valor');
          return;
        }

        const pixPayload = createPixPayload(pixKey, newPagamento.valor);
        const qrCodeDataUrl = await QRCode.toDataURL(pixPayload, { width: 300, margin: 1 });

        await pagamentoService.createPagamento({
          ...newPagamento,
          qrcode: qrCodeDataUrl,
          chavepix: pixKey,
        });
      }

      setSelectedPedidoIds([]);
      setNewPagamento({ valor: 0, qrcode: 'auto', chavepix: 'auto', id_cliente: user?.id_cliente ?? 0 });
      await loadPagamentos();
      setError(null);
    } catch (err) {
      setError('Erro ao criar pagamento');
      console.error(err);
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await pagamentoService.updatePagamentoStatus(id, status);
      loadPagamentos();
    } catch (err) {
      setError('Erro ao atualizar status');
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Deseja excluir este pagamento?')) return;
    try {
      await pagamentoService.deletePagamento(id);
      loadPagamentos();
    } catch (err) {
      setError('Erro ao excluir pagamento');
      console.error(err);
    }
  };

  if (loading) {
    return <div className="p-6">Carregando pagamentos...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Pagamentos</h1>

      {error && <div className="text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-2 mb-4">{error}</div>}

      <div className="filter-bar">
        <label className="text-sm font-semibold text-slate-700">Filtrar status:</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="filter-select border rounded-xl px-3 py-2 bg-white"
        >
          <option value="">Todos</option>
          <option value="pendente">Abertos</option>
          <option value="aprovado">Confirmados</option>
          <option value="rejeitado">Rejeitados</option>
          <option value="cancelado">Cancelados</option>
        </select>
      </div>

      {isAdmin && (
        <div className="mb-6 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold mb-2">Configuração PIX</h2>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
            <input
              type="text"
              placeholder="Chave PIX padrão da loja"
              value={pixKeyInput}
              onChange={(e) => setPixKeyInput(e.target.value)}
              className="border rounded-xl p-2"
            />
            <button
              type="button"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold"
              onClick={handleSavePixKey}
              disabled={savingPixKey}
            >
              {savingPixKey ? 'Salvando...' : 'Salvar chave PIX'}
            </button>
          </div>
        </div>
      )}

      <div className="mb-8 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-semibold mb-2">Criar novo pagamento</h2>
        <form onSubmit={handleCreatePagamento} className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {isAdmin ? (
              <>
                <input
                  type="number"
                  placeholder="ID do cliente"
                  value={newPagamento.id_cliente}
                  onChange={(e) => setNewPagamento({ ...newPagamento, id_cliente: Number(e.target.value) })}
                  className="border rounded-xl p-2"
                  required
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Valor"
                  value={newPagamento.valor}
                  onChange={(e) => setNewPagamento({ ...newPagamento, valor: Number(e.target.value) })}
                  className="border rounded-xl p-2"
                  required
                />
              </>
            ) : (
              <>
                <div className="border rounded-xl p-2 bg-slate-50 md:col-span-2">
                  <p className="text-sm font-semibold text-slate-700 mb-2">Selecione um ou mais pedidos confirmados</p>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {pedidosConfirmados.map((pedido) => {
                      const isSelected = selectedPedidoIds.includes(pedido.id);

                      return (
                        <label
                          key={pedido.id}
                          className={`flex items-center gap-2 text-sm rounded-lg px-2 py-1 border transition-colors ${
                            isSelected
                              ? 'text-emerald-800 border-emerald-300 bg-emerald-50'
                              : 'text-slate-700 border-transparent bg-transparent hover:bg-slate-100/70'
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={isSelected}
                            onChange={() => togglePedidoSelection(pedido.id)}
                          />
                          Pedido #{pedido.id} - R$ {pedido.total.toFixed(2)} - {formatPedidoDate(pedido.createdAt)}
                        </label>
                      );
                    })}
                    {!pedidosConfirmados.length && (
                      <p className="text-sm text-slate-500">Nenhum pedido confirmado disponível.</p>
                    )}
                  </div>
                </div>
              </>
            )}
            <input
              type="text"
              value={pixKey || 'Chave PIX não configurada'}
              className="border rounded-xl p-2 bg-slate-50 md:col-span-2"
              readOnly
            />
            <input
              type="text"
              value={isAdmin ? (newPagamento.valor > 0 ? `R$ ${newPagamento.valor.toFixed(2)}` : 'Informe um valor') : (selectedPedidosTotal > 0 ? `R$ ${selectedPedidosTotal.toFixed(2)}` : 'Selecione pedidos')}
              className="border rounded-xl p-2 bg-slate-50 md:col-span-2"
              readOnly
            />
          </div>

          {qrPreview && (
            <div className="mt-2 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <img src={qrPreview} alt="QR Code PIX" className="h-24 w-24 rounded-lg border border-slate-200 bg-white p-1" />
                <p className="text-sm text-slate-600">QR Code PIX válido gerado automaticamente com a chave PIX configurada.</p>
              </div>
              {pixCopiaCola && (
                <textarea
                  className="border rounded-xl p-2 bg-slate-50 w-full text-xs"
                  rows={3}
                  readOnly
                  value={pixCopiaCola}
                />
              )}
            </div>
          )}

          {!isAdmin && pedidosConfirmados.length === 0 && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              Você não possui pedidos confirmados disponíveis para pagamento.
            </p>
          )}

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl mt-2 font-semibold"
            disabled={(!isAdmin && pedidosConfirmados.length === 0) || !pixKey}
          >
            Criar pagamento
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow overflow-x-auto border border-slate-100">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">ID</th>
              <th className="px-4 py-2 text-left">Cliente</th>
              <th className="px-4 py-2 text-left">Valor</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Data Criação</th>
              {isAdmin && <th className="px-4 py-2 text-left">Ações</th>}
            </tr>
          </thead>
          <tbody>
            {pagedPagamentos.map((pagamento) => (
              <tr key={pagamento.id_pagamento} className="border-t">
                <td className="px-4 py-2">{pagamento.id_pagamento}</td>
                <td className="px-4 py-2">
                  {pagamento.cliente?.nome ? `${pagamento.cliente.nome} (${pagamento.id_cliente})` : pagamento.id_cliente}
                </td>
                <td className="px-4 py-2">{pagamento.valor.toFixed(2)}</td>
                <td className="px-4 py-2">{formatStatus(pagamento.status).toUpperCase()}</td>
                <td className="px-4 py-2">{new Date(pagamento.data_criacao).toLocaleDateString()}</td>
                {isAdmin && (
                  <td className="px-4 py-2 space-x-2">
                    <button
                      onClick={() => handleUpdateStatus(pagamento.id_pagamento, 'aprovado')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg font-semibold"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => handleDelete(pagamento.id_pagamento)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg font-semibold"
                    >
                      Excluir
                    </button>
                  </td>
                )}
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
    </div>
  );
};

export default Pagamentos;