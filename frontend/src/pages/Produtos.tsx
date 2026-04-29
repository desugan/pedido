import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { produtoService, Produto, CreateProdutoData } from '../services/produtoService';
import { usePageToast } from '../components/Toast';

const Produtos: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [form, setForm] = useState<CreateProdutoData>({ nome: '', marca: '', valor: 0, saldo: 0 });
  const [editId, setEditId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const query = (searchParams.get('q') || '').trim().toLowerCase();
  const toast = usePageToast();
  const filteredProdutos = produtos.filter((produto) => {
    if (!query) return true;
    return [
      String(produto.id_produto),
      produto.nome,
      produto.marca,
      produto.valor.toFixed(2),
      produto.saldo.toFixed(2),
    ].some((value) => value.toLowerCase().includes(query));
  });

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.max(1, Math.ceil(filteredProdutos.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const pagedProdutos = filteredProdutos.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const load = async () => {
    try {
      setProdutos(await produtoService.getAll());
      setCurrentPage(1);
    } catch {
      toast.showError('Erro ao carregar produtos');
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [query]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        await produtoService.update(editId, { nome: form.nome, marca: form.marca });
      } else {
        await produtoService.create(form);
      }
      setForm({ nome: '', marca: '', valor: 0, saldo: 0 });
      setEditId(null);
      setShowCreateModal(false);
      setShowEditModal(false);
      await load();
      toast.showSuccess(editId ? 'Produto atualizado com sucesso.' : 'Produto criado com sucesso.');
    } catch {
      toast.showError('Erro ao salvar produto');
    }
  };

  const editar = (p: Produto) => {
    setEditId(p.id_produto);
    setForm({ nome: p.nome, marca: p.marca, valor: p.valor, saldo: p.saldo });
    setShowEditModal(true);
  };

  const totalProdutos = produtos.length;
  const totalEstoque = produtos.reduce((acc, p) => acc + Number(p.saldo || 0), 0);
  const valorEstoque = produtos.reduce((acc, p) => acc + (Number(p.saldo || 0) * Number(p.valor || 0)), 0);
  const ticketMedio = totalProdutos ? valorEstoque / totalProdutos : 0;

  return (
    <>
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">Produtos</h1>
        <button
          type="button"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold"
          onClick={() => { setEditId(null); setForm({ nome: '', marca: '', valor: 0, saldo: 0 }); setShowCreateModal(true); }}
        >
          Novo Produto
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow p-4 border border-slate-100">
          <div className="text-xs text-slate-500 uppercase tracking-wide">Produtos</div>
          <div className="text-xl font-bold mt-1">{totalProdutos}</div>
        </div>
        <div className="bg-white rounded-2xl shadow p-4 border border-slate-100">
          <div className="text-xs text-slate-500 uppercase tracking-wide">Itens em estoque</div>
          <div className="text-xl font-bold mt-1">{Math.floor(totalEstoque)}</div>
        </div>
        <div className="bg-white rounded-2xl shadow p-4 border border-slate-100">
          <div className="text-xs text-slate-500 uppercase tracking-wide">Valor em estoque</div>
          <div className="text-xl font-bold mt-1">R$ {valorEstoque.toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-2xl shadow p-4 border border-slate-100">
          <div className="text-xs text-slate-500 uppercase tracking-wide">Valor médio por produto</div>
          <div className="text-xl font-bold mt-1">R$ {ticketMedio.toFixed(2)}</div>
        </div>
      </div>

      <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 mb-4">
        Nesta tela, somente nome e marca podem ser alterados na edição. Valor, saldo e entrada de estoque devem ser feitos em Lançamentos.
      </div>


      <div className="bg-white rounded-2xl shadow overflow-x-auto border border-slate-100">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">ID</th>
              <th className="px-4 py-2 text-left">Nome</th>
              <th className="px-4 py-2 text-left">Marca</th>
              <th className="px-4 py-2 text-left">Valor</th>
              <th className="px-4 py-2 text-left">Saldo</th>
              <th className="px-4 py-2 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {pagedProdutos.map((p) => (
              <tr key={p.id_produto} className="border-t">
                <td className="px-4 py-2">{p.id_produto}</td>
                <td className="px-4 py-2">{p.nome}</td>
                <td className="px-4 py-2">{p.marca}</td>
                <td className="px-4 py-2">R$ {p.valor.toFixed(2)}</td>
                <td className="px-4 py-2">{Math.floor(p.saldo)}</td>
                <td className="px-4 py-2 space-x-2">
                  <button className="bg-green-600 hover:bg-green-600 text-white px-3 py-1 rounded-lg font-semibold" onClick={() => editar(p)}>Editar</button>
                </td>
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

      {showCreateModal && (
        <div className="pedido-modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="pedido-modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Novo Produto</h3>
            <form onSubmit={submit} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                  <input className="border rounded-xl p-2 w-full" placeholder="Nome do produto" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} maxLength={255} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
                  <input className="border rounded-xl p-2 w-full" placeholder="Marca" value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} maxLength={255} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
                  <input className="border rounded-xl p-2 w-full" type="number" step="0.01" min={0} placeholder="0.00" value={form.valor === 0 ? '' : form.valor} onChange={(e) => setForm({ ...form, valor: Number(e.target.value) })} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Saldo inicial</label>
                  <input className="border rounded-xl p-2 w-full" type="number" step="1" min={0} placeholder="0" value={form.saldo === 0 ? '' : form.saldo} onChange={(e) => setForm({ ...form, saldo: Number(e.target.value) })} />
                </div>
              </div>
              <div className="flex gap-2 justify-end mt-4">
                <button type="button" className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 font-semibold" onClick={() => setShowCreateModal(false)}>Cancelar</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && editId !== null && (
        <div className="pedido-modal-backdrop" onClick={() => { setShowEditModal(false); setEditId(null); }}>
          <div className="pedido-modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Editar Produto</h3>
            <form onSubmit={submit} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                  <input className="border rounded-xl p-2 w-full" placeholder="Nome do produto" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} maxLength={255} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
                  <input className="border rounded-xl p-2 w-full" placeholder="Marca" value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} maxLength={255} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
                  <input className="border rounded-xl p-2 w-full bg-slate-50" type="number" value={form.valor} readOnly tabIndex={-1} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Saldo</label>
                  <input className="border rounded-xl p-2 w-full bg-slate-50" type="number" value={form.saldo} readOnly tabIndex={-1} />
                </div>
              </div>
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">Valor e saldo são gerenciados via Lançamentos.</p>
              <div className="flex gap-2 justify-end mt-4">
                <button type="button" className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 font-semibold" onClick={() => { setShowEditModal(false); setEditId(null); }}>Cancelar</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold">Atualizar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Produtos;
