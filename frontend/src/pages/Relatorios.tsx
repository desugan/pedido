import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { relatorioService, RelatorioResponse } from '../services/relatorioService';
import { usuarioService, Usuario } from '../services/usuarioService';
import { authService } from '../services/authService';

const fmtBRL = (v: unknown) => {
  const n = Number(v);
  return (Number.isFinite(n) ? n : 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};
const fmtDate = (d: unknown) => {
  if (!d) return '—';
  const parsed = new Date(String(d));
  return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleDateString('pt-BR');
};
const fmtStatus = (value: unknown) => String(value || '').replace(/_/g, ' ').trim().toUpperCase();
const fmtName = (value: unknown) => String(value || '').trim().toUpperCase();
const isCurrencyMetric = (key: string) => /valor|saldo|credito|crédito|limite|faturamento|ticket/i.test(key);

const asNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const Relatorios: React.FC = () => {
  const [searchParams] = useSearchParams();
  const clienteParam = Number(searchParams.get('cliente') || 0);
  const currentUser = authService.getCurrentUser();
  const isAdmin = currentUser?.id_perfil === 1;
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<RelatorioResponse | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [idClienteSel, setIdClienteSel] = useState<number>(clienteParam || (currentUser?.id_cliente ?? 0));
  const [pagePedidos, setPagePedidos] = useState(1);
  const [pagePagamentos, setPagePagamentos] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    if (isAdmin) {
      usuarioService.getAll().then((list) => {
        const safeList = Array.isArray(list) ? list : [];
        setUsuarios(safeList);
        if (clienteParam > 0) {
          const exists = safeList.some((u) => u.id_cliente === clienteParam);
          if (exists) {
            setIdClienteSel(clienteParam);
            return;
          }
        }

        if (!idClienteSel && safeList.length > 0) {
          setIdClienteSel(safeList[0].id_cliente);
        }
      }).catch(() => {});
      return;
    }

    if (currentUser) {
      setUsuarios([
        {
          id_usuario: currentUser.id_usuario,
          id_cliente: currentUser.id_cliente,
          id_perfil: currentUser.id_perfil,
          usuario: currentUser.usuario,
          senha: '',
          cliente_nome: currentUser.cliente_nome || undefined,
          perfil_nome: currentUser.perfil || undefined,
        },
      ]);
      setIdClienteSel(currentUser.id_cliente);
    }
  }, [isAdmin, currentUser?.id_cliente, currentUser?.id_perfil, currentUser?.id_usuario, currentUser?.usuario, currentUser?.cliente_nome, currentUser?.perfil, idClienteSel, clienteParam]);

  const gerar = async () => {
    try {
      setLoading(true);
      setErro(null);
      setPagePedidos(1);
      setPagePagamentos(1);

      if (!idClienteSel) {
        setErro('Selecione um usuário');
        setLoading(false);
        return;
      }

      setResultado(await relatorioService.getRelatorioUsuario(idClienteSel));
    } catch (e) {
      setErro('Erro ao gerar relatório');
    } finally {
      setLoading(false);
    }
  };

  // deduplicate by id_cliente for user selector
  const uniqueClientes = Array.from(new Map(usuarios.filter(u => u.id_cliente).map(u => [u.id_cliente, u])).values());

  const pedidosUsuario = resultado?.pedidos as any[] | undefined;
  const pagamentosUsuario = resultado?.pagamentos as any[] | undefined;
  const clienteFinanceiroRaw = resultado?.cliente && (resultado.cliente as any).financeiro;
  const clienteFinanceiro = Array.isArray(clienteFinanceiroRaw)
    ? (clienteFinanceiroRaw[0] ?? null)
    : (clienteFinanceiroRaw ?? null);
  const limiteCredito = resultado?.cliente
    ? asNumber((resultado.cliente as any).limite_credito ?? clienteFinanceiro?.limite_credito ?? resultado?.totais?.limiteCredito)
    : 0;
  const creditoUtilizado = resultado?.cliente
    ? asNumber((resultado.cliente as any).credito_utilizado ?? clienteFinanceiro?.saldo_utilizado ?? resultado?.totais?.creditoUtilizado)
    : 0;
  const saldoRestanteFallback = limiteCredito - creditoUtilizado;
  const saldoRestante = resultado?.cliente
    ? asNumber((resultado.cliente as any).saldo_restante ?? saldoRestanteFallback ?? resultado?.totais?.saldoRestante)
    : 0;
  const totais = resultado && resultado.totais && typeof resultado.totais === 'object'
    ? resultado.totais
    : {};
  const totalPedidos = asNumber((totais as any).totalPedidos ?? (totais as any).quantidadePedidos ?? pedidosUsuario?.length);
  const valorTotalPedidos = asNumber((totais as any).valorTotalPedidos ?? (totais as any).valorTotal ?? (pedidosUsuario as any[] | undefined)?.reduce((acc: number, p: any) => acc + Number(p.total || 0), 0));
  const totalPagamentos = asNumber((totais as any).totalPagamentos ?? (totais as any).quantidadePagamentos ?? pagamentosUsuario?.length);
  const valorTotalPagamentos = asNumber((totais as any).valorTotalPagamentos ?? (pagamentosUsuario as any[] | undefined)?.reduce((acc: number, p: any) => acc + Number(p.valor || 0), 0));

  const totaisEntries = resultado
    ? Object.entries(totais).filter(([chave]) => {
      const explicitFields = ['limiteCredito', 'saldoRestante', 'creditoUtilizado', 'totalPedidos', 'quantidadePedidos', 'valorTotalPedidos', 'totalPagamentos', 'quantidadePagamentos', 'valorTotalPagamentos'];
      return !explicitFields.includes(chave);
    })
    : [];

  useEffect(() => {
    if (idClienteSel) {
      void gerar();
    }
  }, [idClienteSel]);

  const totalPagesPedidos = Math.max(1, Math.ceil((pedidosUsuario?.length ?? 0) / ITEMS_PER_PAGE));
  const pagedPedidos = pedidosUsuario?.slice((pagePedidos - 1) * ITEMS_PER_PAGE, pagePedidos * ITEMS_PER_PAGE);

  const totalPagesPagamentos = Math.max(1, Math.ceil((pagamentosUsuario?.length ?? 0) / ITEMS_PER_PAGE));
  const pagedPagamentos = pagamentosUsuario?.slice((pagePagamentos - 1) * ITEMS_PER_PAGE, pagePagamentos * ITEMS_PER_PAGE);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Relatório de Usuário</h1>

      <div className="bg-white rounded shadow p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="border rounded p-2 bg-slate-50 text-sm font-semibold text-slate-700 md:col-span-1">
          Tipo: Usuário
        </div>

        <select
          className="border rounded p-2 md:col-span-3"
          value={idClienteSel}
          onChange={(e) => setIdClienteSel(Number(e.target.value))}
          disabled={!isAdmin}
        >
          <option value={0}>Selecione o usuário</option>
          {uniqueClientes.map((u) => (
            <option key={u.id_cliente} value={u.id_cliente}>{fmtName(u.usuario)} — {fmtName(u.cliente_nome || `Cliente #${u.id_cliente}`)}</option>
          ))}
        </select>

        <button className="bg-blue-600 text-white rounded p-2 md:col-span-4" onClick={gerar} disabled={loading}>
          {loading ? 'Gerando...' : 'Gerar Relatório'}
        </button>
      </div>

      {erro && <div className="text-red-600 mb-4">{erro}</div>}

      {resultado && (
        <div className="space-y-6">
          {resultado.cliente && (
            <div className="bg-white rounded-2xl shadow p-5 border border-slate-100">
              <h2 className="text-xl font-bold mb-1">{fmtName(resultado.cliente.nome)}</h2>
              <span className="text-sm text-slate-500">Cliente #{resultado.cliente.id_cliente} · Status: {fmtStatus(resultado.cliente.status)}</span>
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-xl bg-slate-50 px-4 py-3">
                  <div className="text-xs uppercase tracking-wide text-slate-500">Limite de crédito</div>
                  <div className="mt-1 text-lg font-semibold text-slate-900">{fmtBRL(limiteCredito)}</div>
                </div>
                <div className="rounded-xl bg-slate-50 px-4 py-3">
                  <div className="text-xs uppercase tracking-wide text-slate-500">Crédito utilizado</div>
                  <div className="mt-1 text-lg font-semibold text-slate-900">{fmtBRL(creditoUtilizado)}</div>
                </div>
                <div className="rounded-xl bg-slate-50 px-4 py-3">
                  <div className="text-xs uppercase tracking-wide text-slate-500">Saldo restante</div>
                  <div className={`mt-1 text-lg font-semibold ${saldoRestante < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                    {fmtBRL(saldoRestante)}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl shadow p-4 border border-slate-100">
              <div className="text-xs text-slate-500 uppercase tracking-wide">Total de pedidos</div>
              <div className="text-xl font-bold mt-1">{totalPedidos}</div>
            </div>
            <div className="bg-white rounded-2xl shadow p-4 border border-slate-100">
              <div className="text-xs text-slate-500 uppercase tracking-wide">Valor total dos pedidos</div>
              <div className="text-xl font-bold mt-1">{fmtBRL(valorTotalPedidos)}</div>
            </div>
            <div className="bg-white rounded-2xl shadow p-4 border border-slate-100">
              <div className="text-xs text-slate-500 uppercase tracking-wide">Total de pagamentos</div>
              <div className="text-xl font-bold mt-1">{totalPagamentos}</div>
            </div>
            <div className="bg-white rounded-2xl shadow p-4 border border-slate-100">
              <div className="text-xs text-slate-500 uppercase tracking-wide">Valor total dos pagamentos</div>
              <div className="text-xl font-bold mt-1">{fmtBRL(valorTotalPagamentos)}</div>
            </div>
            {totaisEntries.map(([chave, valor]) => (
              <div key={chave} className="bg-white rounded-2xl shadow p-4 border border-slate-100">
                <div className="text-xs text-slate-500 uppercase tracking-wide">{chave.replace(/_/g, ' ')}</div>
                <div className="text-xl font-bold mt-1">{typeof valor === 'number' && isCurrencyMetric(chave) ? fmtBRL(valor) : valor}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
            {pedidosUsuario && pedidosUsuario.length > 0 && (
              <div className="bg-white rounded-2xl shadow border border-slate-100 overflow-x-auto h-full">
                <div className="px-5 py-3 border-b font-semibold text-slate-700">Pedidos ({pedidosUsuario.length})</div>
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">ID</th>
                      <th className="px-4 py-2 text-left">Data</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-right">Total</th>
                      <th className="px-4 py-2 text-left">Itens</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedPedidos!.map((p: any) => (
                      <tr key={p.id_pedido} className="border-t align-top">
                        <td className="px-4 py-2">#{p.id_pedido}</td>
                        <td className="px-4 py-2">{p.data ? fmtDate(p.data) : '—'}</td>
                        <td className="px-4 py-2 font-semibold">{fmtStatus(p.status)}</td>
                        <td className="px-4 py-2 text-right font-mono">{fmtBRL(p.total)}</td>
                        <td className="px-4 py-2 text-slate-500">{Array.isArray(p.pedido_item) ? p.pedido_item.length : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-3 mb-3 px-4 flex items-center justify-between">
                  <p className="page-indicator-card text-sm font-medium">Página {pagePedidos} de {totalPagesPedidos}</p>
                  <div className="space-x-2">
                    <button type="button" className="px-3 py-1.5 rounded-xl border bg-white disabled:opacity-50 font-semibold" onClick={() => setPagePedidos((p) => Math.max(1, p - 1))} disabled={pagePedidos === 1}>Anterior</button>
                    <button type="button" className="px-3 py-1.5 rounded-xl border bg-white disabled:opacity-50 font-semibold" onClick={() => setPagePedidos((p) => Math.min(totalPagesPedidos, p + 1))} disabled={pagePedidos === totalPagesPedidos}>Próxima</button>
                  </div>
                </div>
              </div>
            )}

            {pagamentosUsuario && pagamentosUsuario.length > 0 && (
              <div className="bg-white rounded-2xl shadow border border-slate-100 overflow-x-auto h-full">
                <div className="px-5 py-3 border-b font-semibold text-slate-700">Pagamentos ({pagamentosUsuario.length})</div>
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">ID</th>
                      <th className="px-4 py-2 text-left">Data</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedPagamentos!.map((p: any) => (
                      <tr key={p.id_pagamento} className="border-t align-top">
                        <td className="px-4 py-2">#{p.id_pagamento}</td>
                        <td className="px-4 py-2">{p.data_criacao ? fmtDate(p.data_criacao) : '—'}</td>
                        <td className="px-4 py-2 font-semibold">{fmtStatus(p.status)}</td>
                        <td className="px-4 py-2 text-right font-mono">{fmtBRL(p.valor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-3 mb-3 px-4 flex items-center justify-between">
                  <p className="page-indicator-card text-sm font-medium">Página {pagePagamentos} de {totalPagesPagamentos}</p>
                  <div className="space-x-2">
                    <button type="button" className="px-3 py-1.5 rounded-xl border bg-white disabled:opacity-50 font-semibold" onClick={() => setPagePagamentos((p) => Math.max(1, p - 1))} disabled={pagePagamentos === 1}>Anterior</button>
                    <button type="button" className="px-3 py-1.5 rounded-xl border bg-white disabled:opacity-50 font-semibold" onClick={() => setPagePagamentos((p) => Math.min(totalPagesPagamentos, p + 1))} disabled={pagePagamentos === totalPagesPagamentos}>Próxima</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Relatorios;
