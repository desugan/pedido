import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { produtoService, Produto, CreateProdutoData } from '../services/produtoService';
import axios from 'axios';

const Produtos: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [form, setForm] = useState<CreateProdutoData>({ nome: '', marca: '', valor: 0, saldo: 0 });
  const [editId, setEditId] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const query = (searchParams.get('q') || '').trim().toLowerCase();
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
      setErro('Erro ao carregar produtos');
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
        await produtoService.update(editId, form);
      } else {
        await produtoService.create(form);
      }
      setForm({ nome: '', marca: '', valor: 0, saldo: 0 });
      setEditId(null);
      setErro(null);
      await load();
    } catch {
      setErro('Erro ao salvar produto');
    }
  };

  const editar = (p: Produto) => {
    setEditId(p.id_produto);
    setForm({ nome: p.nome, marca: p.marca, valor: p.valor, saldo: p.saldo });
  };

  const excluir = async (id: number) => {
    if (!window.confirm('Excluir produto?')) return;
    try {
      await produtoService.delete(id);
      setErro(null);
      await load();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setErro(error.response?.data?.error || 'Erro ao excluir produto');
      } else {
        setErro('Erro ao excluir produto');
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Produtos</h1>
      {erro && <div className="text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-2 mb-3">{erro}</div>}

      <form onSubmit={submit} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-6 grid grid-cols-1 md:grid-cols-4 gap-2">
        <input className="border rounded-xl p-2" placeholder="Nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
        <input className="border rounded-xl p-2" placeholder="Marca" value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} required />
        <input className="border rounded-xl p-2" type="number" step="0.01" placeholder="Valor" value={form.valor} onChange={(e) => setForm({ ...form, valor: Number(e.target.value) })} required />
        <input className="border rounded-xl p-2" type="number" step="0.01" placeholder="Saldo" value={form.saldo} onChange={(e) => setForm({ ...form, saldo: Number(e.target.value) })} required />
        <button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-2 md:col-span-4 font-semibold" type="submit">{editId ? 'Atualizar' : 'Salvar'}</button>
      </form>

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
                <td className="px-4 py-2">{p.valor.toFixed(2)}</td>
                <td className="px-4 py-2">{p.saldo.toFixed(2)}</td>
                <td className="px-4 py-2 space-x-2">
                  <button className="bg-green-600 hover:bg-green-600 text-white px-3 py-1 rounded-lg font-semibold" onClick={() => editar(p)}>Editar</button>
                  <button className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg font-semibold" onClick={() => excluir(p.id_produto)}>Excluir</button>
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
  );
};

export default Produtos;
