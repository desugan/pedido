import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fornecedorService, CreateFornecedorData, Fornecedor } from '../services/fornecedorService';
import axios from 'axios';

const Fornecedores: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [form, setForm] = useState<CreateFornecedorData>({ razao: '', cnpj: '', status: 'ATIVO' });
  const [editId, setEditId] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const query = (searchParams.get('q') || '').trim().toLowerCase();
  const filteredFornecedores = fornecedores.filter((fornecedor) => {
    if (!query) return true;
    return [
      String(fornecedor.id_fornecedor),
      fornecedor.razao,
      fornecedor.cnpj,
      fornecedor.status,
    ].some((value) => value.toLowerCase().includes(query));
  });

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.max(1, Math.ceil(filteredFornecedores.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const pagedFornecedores = filteredFornecedores.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const hasValidCnpjLength = (value: string): boolean => value.replace(/\D/g, '').length === 14;

  const load = async () => {
    try {
      setFornecedores(await fornecedorService.getAll());
      setCurrentPage(1);
      setErro(null);
    } catch (error) {
      setErro('Erro ao carregar fornecedores');
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

    const razao = form.razao.trim();
    const cnpj = form.cnpj.trim();

    if (!razao || !cnpj) {
      setErro('Razão social e CNPJ são obrigatórios');
      return;
    }

    if (!hasValidCnpjLength(cnpj)) {
      setErro('CNPJ deve conter 14 números');
      return;
    }

    try {
      if (editId) {
        await fornecedorService.update(editId, { ...form, razao, cnpj });
      } else {
        await fornecedorService.create({ ...form, razao, cnpj });
      }
      setForm({ razao: '', cnpj: '', status: 'ATIVO' });
      setEditId(null);
      await load();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setErro(error.response?.data?.error || 'Erro ao salvar fornecedor');
      } else {
        setErro('Erro ao salvar fornecedor');
      }
    }
  };

  const editar = (f: Fornecedor) => {
    setEditId(f.id_fornecedor);
    setForm({ razao: f.razao, cnpj: f.cnpj, status: f.status });
  };

  const excluir = async (id: number) => {
    if (!window.confirm('Excluir fornecedor?')) return;
    try {
      await fornecedorService.delete(id);
      await load();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setErro(error.response?.data?.error || 'Erro ao excluir fornecedor');
      } else {
        setErro('Erro ao excluir fornecedor');
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Fornecedores</h1>
      {erro && <div className="text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-2 mb-3">{erro}</div>}

      <form onSubmit={submit} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-6 grid grid-cols-1 md:grid-cols-4 gap-2">
        <input
          className="border rounded-xl p-2 md:col-span-2"
          placeholder="Razão Social"
          value={form.razao}
          onChange={(e) => setForm({ ...form, razao: e.target.value })}
          required
        />
        <input
          className="border rounded-xl p-2"
          placeholder="CNPJ"
          value={form.cnpj}
          onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
          inputMode="numeric"
          maxLength={18}
          required
        />
        <select
          className="border rounded-xl p-2"
          value={form.status || 'ATIVO'}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
        >
          <option value="ATIVO">ATIVO</option>
          <option value="INATIVO">INATIVO</option>
        </select>
        <button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-2 md:col-span-4 font-semibold" type="submit">
          {editId ? 'Atualizar' : 'Salvar'}
        </button>
      </form>

      <div className="bg-white rounded-2xl shadow overflow-x-auto border border-slate-100">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">ID</th>
              <th className="px-4 py-2 text-left">Razão Social</th>
              <th className="px-4 py-2 text-left">CNPJ</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {pagedFornecedores.map((f) => (
              <tr key={f.id_fornecedor} className="border-t">
                <td className="px-4 py-2">{f.id_fornecedor}</td>
                <td className="px-4 py-2">{f.razao}</td>
                <td className="px-4 py-2">{f.cnpj}</td>
                <td className="px-4 py-2">{f.status}</td>
                <td className="px-4 py-2 space-x-2">
                  <button className="bg-green-600 hover:bg-green-600 text-white px-3 py-1 rounded-lg font-semibold" onClick={() => editar(f)}>
                    Editar
                  </button>
                  <button className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg font-semibold" onClick={() => excluir(f.id_fornecedor)}>
                    Excluir
                  </button>
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

export default Fornecedores;
