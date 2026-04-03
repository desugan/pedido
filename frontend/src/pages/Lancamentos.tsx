import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { authService } from '../services/authService';
import { fornecedorService, Fornecedor } from '../services/fornecedorService';
import { lancamentoService, Lancamento, LancamentoItemData } from '../services/lancamentoService';
import { produtoService, Produto } from '../services/produtoService';

const fmtBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const Lancamentos: React.FC = () => {
  const [searchParams] = useSearchParams();
  const user = authService.getCurrentUser();
  const isAdmin = user?.id_perfil === 1;
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [selectedLancamentoId, setSelectedLancamentoId] = useState<number | null>(null);
  const [selectedLancamentoDetails, setSelectedLancamentoDetails] = useState<Lancamento | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [idFornecedor, setIdFornecedor] = useState<number>(0);
  const [dataLancamento, setDataLancamento] = useState<string>(new Date().toISOString().slice(0, 10));
  const [itemAtual, setItemAtual] = useState<LancamentoItemData>({ id_produto: 0, qtd: 1, vlr_item: 0 });
  const [itens, setItens] = useState<LancamentoItemData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmCancelId, setConfirmCancelId] = useState<number | null>(null);
  const query = (searchParams.get('q') || '').trim().toLowerCase();
  const filteredLancamentos = lancamentos.filter((lancamento) => {
    if (!query) return true;
    return [
      String(lancamento.id_lancamento),
      lancamento.fornecedor_nome || '',
      String(lancamento.id_fornecedor),
      Number(lancamento.total).toFixed(2),
      lancamento.status,
    ].some((value) => value.toLowerCase().includes(query));
  });

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.max(1, Math.ceil(filteredLancamentos.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const pagedLancamentos = filteredLancamentos.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const selectedLancamento = selectedLancamentoId
    ? selectedLancamentoDetails ?? lancamentos.find((lancamento) => lancamento.id_lancamento === selectedLancamentoId) ?? null
    : null;

  const total = useMemo(
    () => itens.reduce((acc, item) => acc + (item.vlr_total ?? item.qtd * item.vlr_item), 0),
    [itens]
  );

  const load = async () => {
    try {
      const [f, p, l] = await Promise.all([
        fornecedorService.getAll(),
        produtoService.getAll(),
        lancamentoService.getAll(),
      ]);
      setFornecedores(f);
      setProdutos(p);
      setLancamentos(l);
      setCurrentPage(1);
      setErro(null);
    } catch {
      setErro('Erro ao carregar dados de lançamentos');
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [query]);

  const addItem = () => {
    if (!itemAtual.id_produto || itemAtual.qtd <= 0 || itemAtual.vlr_item <= 0) {
      setErro('Informe produto, quantidade e valor válidos');
      return;
    }

    setItens([...itens, { ...itemAtual, vlr_total: itemAtual.qtd * itemAtual.vlr_item }]);
    setItemAtual({ id_produto: 0, qtd: 1, vlr_item: 0 });
    setErro(null);
  };

  const removeItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!idFornecedor || !itens.length) {
      setErro('Selecione um fornecedor e ao menos um item');
      return;
    }

    try {
      await lancamentoService.create({
        id_fornecedor: idFornecedor,
        data: dataLancamento,
        id_usuario: user?.id_usuario,
        itens,
      });
      setItens([]);
      setItemAtual({ id_produto: 0, qtd: 1, vlr_item: 0 });
      setIdFornecedor(0);
      await load();
    } catch {
      setErro('Erro ao salvar lançamento');
    }
  };

  const handleUpdateStatus = async (id: number, status: 'PENDENTE' | 'CONFIRMADO' | 'CANCELADO') => {
    try {
      await lancamentoService.updateStatus(id, status);
      await load();
      setErro(null);
      setConfirmCancelId(null);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        (err instanceof Error ? err.message : null) ||
        'Erro ao atualizar status do lançamento';
      setErro(msg);
      setConfirmCancelId(null);
    }
  };

  const handleCancelarClick = (lancamento: Lancamento) => {
    if (lancamento.status.toUpperCase() === 'CONFIRMADO') {
      setConfirmCancelId(lancamento.id_lancamento);
    } else {
      void handleUpdateStatus(lancamento.id_lancamento, 'CANCELADO');
    }
  };

  const openLancamentoModal = async (id: number) => {
    setSelectedLancamentoId(id);
    setSelectedLancamentoDetails(null);
    setDetailsLoading(true);

    try {
      const details = await lancamentoService.getById(id);
      setSelectedLancamentoDetails(details);
    } catch {
      setErro('Erro ao carregar itens do lançamento');
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeLancamentoModal = () => {
    setSelectedLancamentoId(null);
    setSelectedLancamentoDetails(null);
    setDetailsLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Lançamentos</h1>
      {erro && <div className="text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-2 mb-3">{erro}</div>}

      {isAdmin && (
      <form noValidate onSubmit={submit} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-6 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <select
            className="border rounded-xl p-2"
            value={idFornecedor || ''}
            onChange={(e) => setIdFornecedor(Number(e.target.value))}
            required
          >
            <option value="">Selecione fornecedor</option>
            {fornecedores.map((f) => (
              <option key={f.id_fornecedor} value={f.id_fornecedor}>
                {f.razao}
              </option>
            ))}
          </select>

          <input
            className="border rounded-xl p-2"
            type="date"
            value={dataLancamento}
            onChange={(e) => setDataLancamento(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
          <select
            className="border rounded-xl p-2"
            value={itemAtual.id_produto || ''}
            onChange={(e) => setItemAtual({ ...itemAtual, id_produto: Number(e.target.value) })}
          >
            <option value="">Produto</option>
            {produtos.map((p) => (
              <option key={p.id_produto} value={p.id_produto}>
                {p.nome}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-slate-600 whitespace-nowrap">Quantidade</label>
            <input
              className="border rounded-xl p-2 w-full"
              type="number"
              step="1"
              min={1}
              value={itemAtual.qtd}
              onChange={(e) => setItemAtual({ ...itemAtual, qtd: Number(e.target.value) })}
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-slate-600 whitespace-nowrap">Valor</label>
            <input
              className="border rounded-xl p-2 w-full"
              type="number"
              step="0.01"
              min={0}
              value={itemAtual.vlr_item}
              onChange={(e) => setItemAtual({ ...itemAtual, vlr_item: Number(e.target.value) })}
            />
          </div>

          <button type="button" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl p-2 font-semibold" onClick={addItem}>
            Adicionar item
          </button>
        </div>

        <div className="bg-gray-50 rounded-xl p-3 border border-slate-100">
          <h2 className="font-semibold mb-2">Itens</h2>
          {!itens.length && <p className="text-sm text-gray-600">Nenhum item adicionado.</p>}
          {itens.map((item, index) => {
            const produto = produtos.find((p) => p.id_produto === item.id_produto);
            return (
              <div key={`${item.id_produto}-${index}`} className="flex items-center justify-between py-1 border-b">
                <span>
                  {produto?.nome || item.id_produto} | Qtd: {item.qtd} | Unit: R$ {item.vlr_item.toFixed(2)} | Total: R$ {(item.vlr_total ?? item.qtd * item.vlr_item).toFixed(2)}
                </span>
                <button type="button" className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg font-semibold" onClick={() => removeItem(index)}>
                  Remover
                </button>
              </div>
            );
          })}
          <div className="mt-2 font-semibold">Total: R$ {total.toFixed(2)}</div>
        </div>

        <button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-2 font-semibold" type="submit">
          Salvar lançamento
        </button>
      </form>
      )}

      <div className="bg-white rounded-2xl shadow overflow-x-auto border border-slate-100">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">ID</th>
              <th className="px-4 py-2 text-left">Fornecedor</th>
              <th className="px-4 py-2 text-left">Total</th>
              <th className="px-4 py-2 text-left">Data</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Detalhes</th>
            </tr>
          </thead>
          <tbody>
            {pagedLancamentos.map((l) => (
              <tr key={l.id_lancamento} className="border-t">
                <td className="px-4 py-2">{l.id_lancamento}</td>
                <td className="px-4 py-2">{l.fornecedor_nome || l.id_fornecedor}</td>
                <td className="px-4 py-2">{fmtBRL(Number(l.total))}</td>
                <td className="px-4 py-2">{new Date(l.data).toLocaleDateString('pt-BR')}</td>
                <td className="px-4 py-2">{l.status.toUpperCase()}</td>
                <td className="px-4 py-2">
                  <button
                    type="button"
                    className="bg-slate-600 hover:bg-slate-700 text-white px-3 py-1 rounded-lg font-semibold"
                    onClick={() => void openLancamentoModal(l.id_lancamento)}
                  >
                    Ver
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedLancamento && (
        <div className="pedido-modal-backdrop" onClick={closeLancamentoModal}>
          <div className="pedido-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-3">
              <h3 className="text-lg font-semibold">Lançamento #{selectedLancamento.id_lancamento}</h3>
              <p className="text-sm text-gray-600">
                Fornecedor: {selectedLancamento.fornecedor_nome || selectedLancamento.id_fornecedor}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="border rounded-xl px-3 py-2 bg-slate-50">
                <p className="text-xs text-slate-500">Data</p>
                <p className="font-semibold">{new Date(selectedLancamento.data).toLocaleDateString('pt-BR')}</p>
              </div>
              <div className="border rounded-xl px-3 py-2 bg-slate-50">
                <p className="text-xs text-slate-500">Total</p>
                <p className="font-semibold">R$ {Number(selectedLancamento.total).toFixed(2)}</p>
              </div>
              <div className="border rounded-xl px-3 py-2 bg-slate-50 md:col-span-2">
                <p className="text-xs text-slate-500">Status</p>
                <p className="font-semibold">{selectedLancamento.status.toUpperCase()}</p>
              </div>
            </div>

            <div className="mt-3 border rounded-xl px-3 py-3 bg-slate-50">
              <p className="text-sm font-semibold text-slate-700 mb-2">Itens lançados</p>
              {detailsLoading ? (
                <p className="text-sm text-slate-500">Carregando itens...</p>
              ) : selectedLancamento.itens?.length ? (
                <div className="space-y-2 max-h-[36vh] overflow-y-auto pr-1">
                  {selectedLancamento.itens.map((item, index) => (
                    <div key={`${item.id_produto}-${index}`} className="border rounded-lg px-3 py-2 bg-white">
                      <p className="text-sm font-semibold text-slate-800">{item.produto_nome || `Produto ${item.id_produto}`}</p>
                      <p className="text-sm text-slate-600">
                        Qtd: {item.qtd} | Unit: R$ {Number(item.vlr_item).toFixed(2)} | Total: R$ {Number(item.vlr_total).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">Nenhum item encontrado para este lançamento.</p>
              )}
            </div>

            {isAdmin && (
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg font-semibold"
                  onClick={() => handleUpdateStatus(selectedLancamento.id_lancamento, 'PENDENTE')}
                >
                  Marcar pendente
                </button>
                <button
                  type="button"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg font-semibold"
                  onClick={() => handleUpdateStatus(selectedLancamento.id_lancamento, 'CONFIRMADO')}
                >
                  Confirmar
                </button>
                <button
                  type="button"
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg font-semibold"
                  onClick={() => handleCancelarClick(selectedLancamento)}
                >
                  Cancelar
                </button>
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-slate-600 hover:bg-slate-700 text-white font-semibold"
                onClick={closeLancamentoModal}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmCancelId !== null && (
        <div className="pedido-modal-backdrop" onClick={() => setConfirmCancelId(null)}>
          <div className="pedido-modal-card max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Cancelar lançamento confirmado?</h3>
            <p className="text-sm text-slate-600 mb-1">
              Este lançamento já teve entrada de estoque confirmada.
            </p>
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
              ⚠️ Se algum produto já foi vendido, o cancelamento será bloqueado para preservar a integridade do estoque.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 font-semibold"
                onClick={() => setConfirmCancelId(null)}
              >
                Voltar
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold"
                onClick={() => void handleUpdateStatus(confirmCancelId, 'CANCELADO')}
              >
                Confirmar cancelamento
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

export default Lancamentos;
