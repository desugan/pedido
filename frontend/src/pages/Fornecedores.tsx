import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fornecedorService, CreateFornecedorData, Fornecedor } from '../services/fornecedorService';

const Fornecedores: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [form, setForm] = useState<CreateFornecedorData>({ razao: '', cnpj: '', status: 'ATIVO' });
  const [editId, setEditId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
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
      setShowCreateModal(false);
      setShowEditModal(false);
      await load();
    } catch (error: any) {
      setErro(error?.response?.data?.error || 'Erro ao salvar fornecedor');
    }
  };

  const editar = (f: Fornecedor) => {
    setEditId(f.id_fornecedor);
    setForm({ razao: f.razao, cnpj: f.cnpj, status: f.status });
    setShowEditModal(true);
  };

  return (
    <>
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">Fornecedores</h1>
        <button
          type="button"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold"
          onClick={() => { setEditId(null); setForm({ razao: '', cnpj: '', status: 'ATIVO' }); setShowCreateModal(true); }}
        >
          Novo Fornecedor
        </button>
      </div>
      {erro && <div className="text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-2 mb-3">{erro}</div>}

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
                <td className="px-4 py-2">{String(f.status || '').toUpperCase()}</td>
                <td className="px-4 py-2 space-x-2">
                  <button className="bg-green-600 hover:bg-green-600 text-white px-3 py-1 rounded-lg font-semibold" onClick={() => editar(f)}>
                    Editar
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

      {showCreateModal && (
        <div className="pedido-modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="pedido-modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Novo Fornecedor</h3>
            <form onSubmit={submit} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Razão Social</label>
                  <input className="border rounded-xl p-2 w-full" placeholder="Razão Social" value={form.razao} onChange={(e) => setForm({ ...form, razao: e.target.value })} maxLength={255} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
                  <input className="border rounded-xl p-2 w-full" placeholder="00.000.000/0001-00" value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} inputMode="numeric" maxLength={18} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select className="border rounded-xl p-2 w-full" value={form.status || 'ATIVO'} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="ATIVO">ATIVO</option>
                    <option value="INATIVO">INATIVO</option>
                  </select>
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
            <h3 className="text-lg font-semibold mb-4">Editar Fornecedor</h3>
            <form onSubmit={submit} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Razão Social</label>
                  <input className="border rounded-xl p-2 w-full" placeholder="Razão Social" value={form.razao} onChange={(e) => setForm({ ...form, razao: e.target.value })} maxLength={255} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
                  <input className="border rounded-xl p-2 w-full" placeholder="00.000.000/0001-00" value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} inputMode="numeric" maxLength={18} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select className="border rounded-xl p-2 w-full" value={form.status || 'ATIVO'} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="ATIVO">ATIVO</option>
                    <option value="INATIVO">INATIVO</option>
                  </select>
                </div>
              </div>
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

export default Fornecedores;
