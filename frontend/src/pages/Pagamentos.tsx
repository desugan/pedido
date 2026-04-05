import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import QRCode from 'qrcode';
import { pagamentoService, Pagamento } from '../services/pagamentoService';
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
  const [pixNome, setPixNome] = useState('');
  const [pixNomeInput, setPixNomeInput] = useState('');
  const [savingPixKey, setSavingPixKey] = useState(false);
  const [savingPixNome, setSavingPixNome] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showPixConfigModal, setShowPixConfigModal] = useState(false);
  const [pendingPagamentoConfirmId, setPendingPagamentoConfirmId] = useState<number | null>(null);
  const [viewPedidoIds, setViewPedidoIds] = useState<number[]>([]);
  const [viewPedidos, setViewPedidos] = useState<Pedido[]>([]);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewPagamento, setViewPagamento] = useState<Pagamento | null>(null);
  const [localPaymentPedidos, setLocalPaymentPedidos] = useState<Record<number, Pedido[]>>({});
  const [viewQrCode, setViewQrCode] = useState('');
  const [qrPreview, setQrPreview] = useState('');
  const [pixCopiaCola, setPixCopiaCola] = useState('');
  const viewPedidosItens = viewPedidos.flatMap((pedido) =>
    ((pedido.itens as any[]) || []).map((item: any) => ({
      id: item.id,
      pedidoId: pedido.id,
      produtoNome: item.produtoNome || item.produto_nome || '',
      quantidade: Number(item.quantidade ?? item.qtd ?? 0),
      precoUnitario: Number(item.precoUnitario ?? item.vlr_item ?? item.vlr_venda ?? 0),
      subtotal: Number(item.subtotal ?? item.vlr_total ?? 0),
    }))
  );

  const normalizePedido = (raw: any): Pedido => {
    const itensRaw = Array.isArray(raw?.itens)
      ? raw.itens
      : (Array.isArray(raw?.pedido_item) ? raw.pedido_item : []);

    return {
      id: Number(raw?.id ?? raw?.id_pedido ?? 0),
      clienteId: Number(raw?.clienteId ?? raw?.id_cliente ?? 0),
      clienteNome: raw?.clienteNome ?? raw?.cliente_nome,
      status: String(raw?.status || '') as Pedido['status'],
      total: Number(raw?.total || 0),
      createdAt: String(raw?.createdAt ?? raw?.data ?? ''),
      updatedAt: String(raw?.updatedAt ?? raw?.data ?? ''),
      itens: itensRaw.map((item: any) => ({
        id: Number(item?.id ?? item?.id_item_pedido ?? 0),
        pedidoId: Number(item?.pedidoId ?? item?.id_pedido ?? raw?.id ?? raw?.id_pedido ?? 0),
        produtoNome: String(item?.produtoNome ?? item?.produto_nome ?? ''),
        quantidade: Number(item?.quantidade ?? item?.qtd ?? 0),
        precoUnitario: Number(item?.precoUnitario ?? item?.vlr_item ?? item?.vlr_venda ?? 0),
        subtotal: Number(item?.subtotal ?? item?.vlr_total ?? 0),
      })),
    };
  };

  const ensurePedidoItens = async (pedido: Pedido): Promise<Pedido> => {
    if (Array.isArray(pedido.itens) && pedido.itens.length > 0) {
      return pedido;
    }

    try {
      const itens = await pedidoService.getItemsByPedidoId(pedido.id);
      return {
        ...pedido,
        itens: (itens || []).map((item: any) => ({
          id: Number(item?.id ?? item?.id_item_pedido ?? 0),
          pedidoId: Number(item?.pedidoId ?? item?.id_pedido ?? pedido.id),
          produtoNome: String(item?.produtoNome ?? item?.produto_nome ?? ''),
          quantidade: Number(item?.quantidade ?? item?.qtd ?? 0),
          precoUnitario: Number(item?.precoUnitario ?? item?.vlr_item ?? item?.vlr_venda ?? 0),
          subtotal: Number(item?.subtotal ?? item?.vlr_total ?? 0),
        })),
      };
    } catch {
      return pedido;
    }
  };
  const formatDisplayText = (value: string | number | null | undefined): string => String(value || '').trim().toUpperCase();
  const normalizeStatus = (status: string | undefined): 'pendente' | 'aprovado' | 'rejeitado' | 'cancelado' | 'excluido' | '' => {
    const value = (status || '').trim().toLowerCase();

    if (value === 'aberto' || value === 'pendente' || value === 'aguardando' || value === 'em_aberto' || value === 'em aberto' || value === 'processando pagamento') return 'pendente';
    if (value === 'confirmado' || value === 'aprovado' || value === 'pago' || value === 'liquidado') return 'aprovado';
    if (value === 'excluido' || value === 'excluído') return 'excluido';

    return '';
  };
  const formatStatus = (status: string | undefined): string => {
    const normalizedStatus = normalizeStatus(status);

    if (normalizedStatus === 'pendente') return 'aberto';
    if (normalizedStatus === 'aprovado') return 'confirmado';
    if (normalizedStatus === 'excluido') return 'excluído';

    return status || '';
  };
  const formatStatusLabel = (status: string | undefined): string => String(formatStatus(status) || '').replace(/_/g, ' ').trim().toUpperCase();
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

  const selectedPedidos = pedidosConfirmados.filter((pedido) => selectedPedidoIds.includes(pedido.id));
  const selectedPedidosTotal = selectedPedidos.reduce((acc, pedido) => acc + pedido.total, 0);

  useEffect(() => {
    void loadPagamentos();
  }, [statusFilter]);

  useEffect(() => {
    void loadPedidosConfirmados();
  }, []);

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
      const confirmados = pedidosDoCliente.filter((pedido) => String(pedido.status || '').toLowerCase() === 'confirmado');
      setPedidosConfirmados(confirmados);
    } catch (err) {
      setError('Erro ao carregar pedidos confirmados');
      console.error(err);
    }
  };

  const loadPixKey = async () => {
    try {
      const [key, nome] = await Promise.all([
        configService.getPixKey(),
        configService.getPixNome(),
      ]);
      setPixKey(key);
      setPixKeyInput(key);
      setPixNome(nome);
      setPixNomeInput(nome);
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
    const merchantName = normalizeText(pixNome || 'Loja', 25);
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
      setShowPixConfigModal(false);
      setSuccessMessage('Chave PIX salva com sucesso.');
    } catch (err) {
      setError('Erro ao salvar chave PIX');
      console.error(err);
    } finally {
      setSavingPixKey(false);
    }
  };

  const handleSavePixNome = async () => {
    const nome = pixNomeInput.trim();
    if (!nome) {
      setError('Nome PIX é obrigatório');
      return;
    }

    try {
      setSavingPixNome(true);
      const saved = await configService.setPixNome(nome);
      setPixNome(saved);
      setError(null);
      setShowPixConfigModal(false);
      setSuccessMessage('Nome PIX salvo com sucesso.');
    } catch (err) {
      setError('Erro ao salvar nome PIX');
      console.error(err);
    } finally {
      setSavingPixNome(false);
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
    const value = selectedPedidosTotal;
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
  }, [pixKey, pixNome, selectedPedidosTotal]);

  useEffect(() => {
    if (!viewPagamento) {
      setViewQrCode('');
      return;
    }

    const copiaCola = String(viewPagamento.chavepix || '').trim();
    const isPixPayload = /^000201\d+/.test(copiaCola);

    if (isPixPayload) {
      void QRCode.toDataURL(copiaCola, { width: 220, margin: 1 })
        .then(setViewQrCode)
        .catch(() => setViewQrCode(String(viewPagamento.qrcode || '')));
      return;
    }

    setViewQrCode(String(viewPagamento.qrcode || ''));
  }, [viewPagamento]);

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
      if (!user?.id_cliente) {
        setError('Usuário sem cliente associado');
        return;
      }

      if (!selectedPedidoIds.length) {
        setError('Selecione ao menos um pedido confirmado');
        return;
      }

      const selectedPedidosSnapshot = [...selectedPedidos];

      const pixPayload = createPixPayload(pixKey, selectedPedidosTotal);
      const qrCodeDataUrl = await QRCode.toDataURL(pixPayload, { width: 300, margin: 1 });

      const createdPagamento = await pagamentoService.createPagamento({
        id_cliente: user.id_cliente,
        valor: selectedPedidosTotal,
        qrcode: qrCodeDataUrl,
        chavepix: pixPayload,
        pedidoIds: selectedPedidoIds,
      });

      setLocalPaymentPedidos((prev) => ({
        ...prev,
        [createdPagamento.id_pagamento]: selectedPedidosSnapshot,
      }));

      setSelectedPedidoIds([]);
      setShowPayModal(false);
      await loadPagamentos();
      await loadPedidosConfirmados();
      await openPedidosModal(createdPagamento, selectedPedidosSnapshot);
      setError(null);
      setSuccessMessage('Pagamento criado com sucesso.');
    } catch (err) {
      setError('Erro ao criar pagamento');
      console.error(err);
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await pagamentoService.updatePagamentoStatus(id, status);
      void loadPagamentos();
      setSuccessMessage(
        status === 'aprovado'
          ? `Pagamento #${id} confirmado com sucesso.`
          : `Pagamento #${id} atualizado com sucesso.`
      );
    } catch (err) {
      setError(`Erro ao confirmar pagamento #${id}.`);
      console.error(err);
    }
  };

  const openPedidosModal = async (pagamento: Pagamento, fallbackPedidos?: Pedido[]) => {
    setViewLoading(true);
    setViewPedidos([]);
    setViewPedidoIds([]);

    try {
      const full = await pagamentoService.getPagamentoById(pagamento.id_pagamento);
      setViewPagamento(full);
      const pedidosFromPayload = Array.isArray((full as any).pedidos)
        ? (full as any).pedidos.map(normalizePedido).filter((pedido: Pedido) => pedido.id > 0)
        : [];

      if (pedidosFromPayload.length) {
        const normalizedWithItems = await Promise.all(pedidosFromPayload.map(ensurePedidoItens));
        setViewPedidos(normalizedWithItems);
        setViewPedidoIds(normalizedWithItems.map((pedido) => pedido.id));
        setViewLoading(false);
        return;
      }

      const idsFromLinks = Array.isArray(full.pagamentopedido)
        ? full.pagamentopedido
          .map((pp: any) => Number(pp?.id_pedido ?? pp?.idPedido ?? pp?.id))
          .filter((id: number) => Number.isFinite(id) && id > 0)
        : [];

      const idsFromArray = Array.isArray((full as any).pedidoIds)
        ? (full as any).pedidoIds
          .map((id: any) => Number(id))
          .filter((id: number) => Number.isFinite(id) && id > 0)
        : [];

      const idsFromPedidos = Array.isArray((full as any).pedidos)
        ? (full as any).pedidos
          .map((p: any) => Number(p?.id ?? p?.id_pedido ?? 0))
          .filter((id: number) => Number.isFinite(id) && id > 0)
        : [];

      const uniqueIds = Array.from(new Set([...idsFromLinks, ...idsFromArray, ...idsFromPedidos]));

      setViewPedidoIds(uniqueIds);
      if (!uniqueIds.length) {
        const cachedPedidos = fallbackPedidos && fallbackPedidos.length
          ? fallbackPedidos
          : (localPaymentPedidos[pagamento.id_pagamento] || []);

        if (cachedPedidos.length) {
          const cachedIds = cachedPedidos.map((pedido) => pedido.id);
          setViewPedidoIds(cachedIds);
          const settled = await Promise.allSettled(cachedIds.map((id) => pedidoService.getPedidoById(id)));
          const detailsRaw = settled
            .filter((result): result is PromiseFulfilledResult<Pedido> => result.status === 'fulfilled')
            .map((result) => normalizePedido(result.value));
          const details = await Promise.all(detailsRaw.map(ensurePedidoItens));
          setViewPedidos(details);
        }

        setViewLoading(false);
        return;
      }

      const settled = await Promise.allSettled(uniqueIds.map((id) => pedidoService.getPedidoById(id)));
      let detailsRaw = settled
        .filter((result): result is PromiseFulfilledResult<Pedido> => result.status === 'fulfilled')
        .map((result) => normalizePedido(result.value));

      if (!detailsRaw.length && Array.isArray((full as any).pedidos)) {
        detailsRaw = (full as any).pedidos.map(normalizePedido).filter((pedido: Pedido) => pedido.id > 0);
      }

      const details = await Promise.all(detailsRaw.map(ensurePedidoItens));

      if (!details.length && Array.isArray((full as any).pagamentopedido) && (full as any).pagamentopedido.length > 0) {
        const fallbackIds = (full as any).pagamentopedido
          .map((pp: any) => Number(pp?.id_pedido ?? pp?.idPedido ?? pp?.id))
          .filter((id: number) => Number.isFinite(id) && id > 0);
        setViewPedidoIds(Array.from(new Set(fallbackIds)));
      }

      if (details.length) {
        setViewPedidoIds(details.map((pedido) => pedido.id));
      }
      setViewPedidos(details);
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar pedidos vinculados ao pagamento');
    } finally {
      setViewLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Carregando pagamentos...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Pagamentos</h1>

      {error && <div className="text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-2 mb-4">{error}</div>}
      {successMessage && <div className="text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 mb-4">{successMessage}</div>}

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
          <option value="excluido">Excluídos</option>
        </select>
      </div>

      {isAdmin && (
        <div className="mb-6 flex justify-end">
          <button
            type="button"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-semibold"
            onClick={() => {
              setError(null);
              setSuccessMessage(null);
              setShowPixConfigModal(true);
            }}
          >
            Configuração PIX
          </button>
        </div>
      )}

      <div className="mb-8 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-xl font-semibold">Pagamento</h2>
            <p className="text-sm text-slate-500">Selecione pedidos confirmados e gere QR Code para pagamento.</p>
          </div>
          <button
            type="button"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold"
            disabled={pedidosConfirmados.length === 0 || !pixKey}
            onClick={() => {
              setError(null);
              setSuccessMessage(null);
              setShowPayModal(true);
            }}
          >
            PAGAR
          </button>
        </div>

        {!pedidosConfirmados.length && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mt-3">
            Você não possui pedidos confirmados disponíveis para pagamento.
          </p>
        )}
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
              <th className="px-4 py-2 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {pagedPagamentos.map((pagamento) => (
              <tr key={pagamento.id_pagamento} className="border-t">
                <td className="px-4 py-2">{pagamento.id_pagamento}</td>
                <td className="px-4 py-2">
                  {pagamento.cliente?.nome ? formatDisplayText(pagamento.cliente.nome) : pagamento.id_cliente}
                </td>
                <td className="px-4 py-2">R$ {pagamento.valor.toFixed(2)}</td>
                <td className="px-4 py-2">{formatStatusLabel(pagamento.status)}</td>
                <td className="px-4 py-2">{new Date(pagamento.data_criacao).toLocaleDateString()}</td>
                <td className="px-4 py-2 space-x-2">
                  <button
                    onClick={() => void openPedidosModal(pagamento)}
                    className="bg-slate-100 hover:bg-slate-700 text-white px-3 py-1 rounded-lg font-semibold"
                  >
                    Ver pedido
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setError(null);
                        setSuccessMessage(null);
                        if (normalizeStatus(pagamento.status) === 'pendente') {
                          setPendingPagamentoConfirmId(pagamento.id_pagamento);
                        } else {
                          setError(`Pagamento #${pagamento.id_pagamento} não pode ser confirmado pois não está em aberto (status atual: ${formatStatusLabel(pagamento.status)}).`);
                        }
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg font-semibold"
                    >
                      Confirmar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showPayModal && (
        <div className="pedido-modal-backdrop" onClick={() => setShowPayModal(false)}>
          <div className="pedido-modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-3">Pagar pedidos</h3>
            <form onSubmit={handleCreatePagamento} className="space-y-3">
              <div className="border rounded-xl p-2 bg-slate-50">
                <p className="text-sm font-semibold text-slate-700 mb-2">Selecione um ou mais pedidos confirmados</p>
                <div className="max-h-44 overflow-y-auto space-y-1">
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
                </div>
              </div>

              <input
                type="text"
                value={pixKey ? `${pixNome ? `Chave: ${pixKey}. Nome: ` : 'Chave: '}${pixNome || pixKey}` : 'Chave PIX não configurada'}
                className="border rounded-xl p-2 bg-slate-50 w-full"
                readOnly
              />
              <input
                type="text"
                value={selectedPedidosTotal > 0 ? `R$ ${selectedPedidosTotal.toFixed(2)}` : 'Selecione pedidos'}
                className="border rounded-xl p-2 bg-slate-50 w-full"
                readOnly
              />

              {qrPreview && (
                <div className="mt-2 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <img src={qrPreview} alt="QR Code PIX" className="h-24 w-24 rounded-lg border border-slate-200 bg-white p-1" />
                    <p className="text-sm text-slate-600">QR Code PIX gerado automaticamente.</p>
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

              <div className="mt-3 flex justify-end gap-2">
                <button type="button" className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 font-semibold" onClick={() => setShowPayModal(false)}>
                  Fechar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold"
                  disabled={!selectedPedidoIds.length || !pixKey}
                >
                  Confirmar pagamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPixConfigModal && (
        <div className="pedido-modal-backdrop" onClick={() => setShowPixConfigModal(false)}>
          <div className="pedido-modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-3">Configuração PIX</h3>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2 mb-2">
              <input
                type="text"
                placeholder="Nome do recebedor (aparece no PIX)"
                value={pixNomeInput}
                onChange={(e) => setPixNomeInput(e.target.value)}
                className="border rounded-xl p-2"
                maxLength={80}
              />
              <button
                type="button"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold"
                onClick={handleSavePixNome}
                disabled={savingPixNome}
              >
                {savingPixNome ? 'Salvando...' : 'Salvar nome'}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2 mb-4">
              <input
                type="text"
                placeholder="Chave PIX padrão da loja"
                value={pixKeyInput}
                onChange={(e) => setPixKeyInput(e.target.value)}
                className="border rounded-xl p-2"
                maxLength={255}
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

            <div className="flex justify-end">
              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-slate-600 hover:bg-slate-700 text-white font-semibold"
                onClick={() => setShowPixConfigModal(false)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingPagamentoConfirmId !== null && (
        <div className="pedido-modal-backdrop" onClick={() => setPendingPagamentoConfirmId(null)}>
          <div className="pedido-modal-card max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Confirmar pagamento?</h3>
            <p className="text-sm text-slate-600 mb-4">
              Deseja realmente confirmar o pagamento #{pendingPagamentoConfirmId}?
            </p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 font-semibold"
                onClick={() => setPendingPagamentoConfirmId(null)}
              >
                Voltar
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                onClick={() => {
                  void handleUpdateStatus(pendingPagamentoConfirmId, 'aprovado');
                  setPendingPagamentoConfirmId(null);
                  setViewPagamento(null);
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {viewPagamento && (
        <div className="pedido-modal-backdrop" onClick={() => setViewPagamento(null)}>
          <div className="pedido-modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-3">Pagamento #{viewPagamento.id_pagamento} - Pedidos vinculados</h3>
            <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm text-slate-700">
                <span className="font-semibold">Valor:</span> R$ {Number(viewPagamento.valor || 0).toFixed(2)}
              </p>
              <p className="text-sm text-slate-700">
                <span className="font-semibold">Status:</span> {formatStatusLabel(viewPagamento.status)}
              </p>
            </div>

            {viewPagamento.qrcode && (
              <div className="mb-4 rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-sm font-semibold text-slate-700 mb-2">QR Code do pagamento</p>
                <div className="flex items-start gap-3 flex-wrap">
                  <img src={viewQrCode || viewPagamento.qrcode} alt="QR Code do pagamento" className="h-28 w-28 rounded-lg border border-slate-200 bg-white p-1" />
                  <div className="min-w-[220px] flex-1">
                    <p className="text-xs text-slate-600 mb-1">PIX Copia e Cola:</p>
                    <textarea
                      className="border rounded-xl p-2 bg-slate-50 w-full text-xs"
                      rows={3}
                      readOnly
                      value={viewPagamento.chavepix || ''}
                    />
                  </div>
                </div>
              </div>
            )}

            {viewLoading ? (
              <p className="text-sm text-slate-500">Carregando pedidos...</p>
            ) : !viewPedidoIds.length ? (
              <p className="text-sm text-slate-500">Nenhum pedido vinculado.</p>
            ) : (
              <>
                <div className="space-y-2 max-h-[34vh] overflow-y-auto pr-1 mb-3">
                  {viewPedidos.map((pedido) => (
                    <div key={pedido.id} className="border rounded-md px-3 py-2 bg-slate-50">
                      <p className="font-semibold text-sm">Pedido #{pedido.id}</p>
                      <p className="text-sm text-slate-600">Status: {String(pedido.status || '').replace(/_/g, ' ').toUpperCase()} | Total: R$ {pedido.total.toFixed(2)}</p>
                      <p className="text-sm text-slate-500">Data: {pedido.createdAt ? new Date(pedido.createdAt).toLocaleDateString('pt-BR') : '—'}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className="bg-slate-100 px-3 py-2">
                    <p className="text-sm font-semibold text-slate-700">Itens comprados</p>
                  </div>
                  {!viewPedidosItens.length ? (
                    <p className="px-3 py-2 text-sm text-slate-500">Nenhum item encontrado para os pedidos vinculados.</p>
                  ) : (
                    <div className="max-h-[28vh] overflow-y-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 text-slate-600">
                          <tr>
                            <th className="text-left px-3 py-2">Pedido</th>
                            <th className="text-left px-3 py-2">Produto</th>
                            <th className="text-right px-3 py-2">Qtd</th>
                            <th className="text-right px-3 py-2">Unitário</th>
                            <th className="text-right px-3 py-2">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {viewPedidosItens.map((item, idx) => (
                            <tr key={`${item.pedidoId}-${item.id || idx}`} className="border-t">
                              <td className="px-3 py-2">#{item.pedidoId}</td>
                              <td className="px-3 py-2">{item.produtoNome}</td>
                              <td className="px-3 py-2 text-right">{Number(item.quantidade || 0).toFixed(2)}</td>
                              <td className="px-3 py-2 text-right">R$ {Number(item.precoUnitario || 0).toFixed(2)}</td>
                              <td className="px-3 py-2 text-right">R$ {Number(item.subtotal || 0).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
            <div className="mt-4 flex justify-end">
              <button type="button" className="px-4 py-2 rounded-xl bg-slate-600 hover:bg-slate-700 text-white font-semibold" onClick={() => setViewPagamento(null)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

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