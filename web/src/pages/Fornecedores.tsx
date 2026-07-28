import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFornecedores } from '../hooks/useFornecedores';
import { usePageToast } from '../components/Toast';
import { Pagination } from '../components/Pagination';

/**
 * Página de gerenciamento de fornecedores.
 * @returns {JSX.Element} Página de fornecedores.
 */
const Fornecedores: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { fornecedores, total, currentPage, load, create, update } = useFornecedores();
  const toast = usePageToast();

  const [form, setForm] = useState({ razao: '', cnpj: '', status: 'ATIVO' });
  const [editId, setEditId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState<'create' | 'edit' | null>(null);

  const query = (searchParams.get('q') || '').trim().toLowerCase();

  useEffect(() => { load(1, query || undefined); }, [query]);

  const hasValidCnpjLength = (value: string) => value.replace(/\D/g, '').length === 14;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const razao = form.razao.trim();
    const cnpj = form.cnpj.trim();
    if (!razao || !cnpj) { toast.showError('Razão social e CNPJ são obrigatórios'); return; }
    if (!hasValidCnpjLength(cnpj)) { toast.showError('CNPJ deve conter 14 números'); return; }
    try {
      if (editId) {
        await update(editId, { ...form, razao, cnpj });
        toast.showSuccess('Fornecedor atualizado.');
      } else {
        await create({ ...form, razao, cnpj });
        toast.showSuccess('Fornecedor criado.');
      }
      setForm({ razao: '', cnpj: '', status: 'ATIVO' });
      setEditId(null);
      setShowForm(null);
      await load();
    } catch (err: any) {
      toast.showError(err?.response?.data?.error || 'Erro ao salvar fornecedor');
    }
  };

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">Fornecedores</h1>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold"
            onClick={() => { setEditId(null); setForm({ razao: '', cnpj: '', status: 'ATIVO' }); setShowForm('create'); }}>
            Novo Fornecedor
          </button>
        </div>

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
              {fornecedores.map((f) => (
                <tr key={f.id_fornecedor} className="border-t">
                  <td className="px-4 py-2">{f.id_fornecedor}</td>
                  <td className="px-4 py-2">{f.razao}</td>
                  <td className="px-4 py-2">{f.cnpj}</td>
                  <td className="px-4 py-2">{String(f.status || '').toUpperCase()}</td>
                  <td className="px-4 py-2">
                    <button className="bg-green-600 hover:bg-green-600 text-white px-3 py-1 rounded-lg font-semibold"
                      onClick={() => { setEditId(f.id_fornecedor); setForm({ razao: f.razao, cnpj: f.cnpj, status: f.status }); setShowForm('edit'); }}>
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination currentPage={currentPage} totalPages={Math.max(1, Math.ceil(total / 10))} onPageChange={(p) => load(p, query || undefined)} />
      </div>

      {showForm && (
        <div className="pedido-modal-backdrop" onClick={() => { setShowForm(null); setEditId(null); }}>
          <div className="pedido-modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">{editId ? 'Editar Fornecedor' : 'Novo Fornecedor'}</h3>
            <form onSubmit={submit} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Razão Social</label>
                  <input className="border rounded-xl p-2 w-full" placeholder="Razão Social" value={form.razao}
                    onChange={(e) => setForm({ ...form, razao: e.target.value })} maxLength={255} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
                  <input className="border rounded-xl p-2 w-full" placeholder="00.000.000/0001-00" value={form.cnpj}
                    onChange={(e) => setForm({ ...form, cnpj: e.target.value })} inputMode="numeric" maxLength={18} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select className="border rounded-xl p-2 w-full" value={form.status || 'ATIVO'}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="ATIVO">ATIVO</option>
                    <option value="INATIVO">INATIVO</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 justify-end mt-4">
                <button type="button" className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 font-semibold"
                  onClick={() => { setShowForm(null); setEditId(null); }}>Cancelar</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold">
                  {editId ? 'Atualizar' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Fornecedores;
