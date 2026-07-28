import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useClientes } from '../hooks/useClientes';
import { usePageToast } from '../components/Toast';
import { Pagination } from '../components/Pagination';
import { TableSkeleton } from '../components/TableSkeleton';

const fmtBRL = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const normalizeStatus = (status: string): string => {
  const raw = String(status || '').trim().toUpperCase();
  return raw === 'INADINPLENTE' ? 'INADIMPLENTE' : raw;
};

/**
 * Página de gerenciamento de clientes.
 * @returns {JSX.Element} Página de clientes.
 */
const Clientes: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clientes, loading, total, currentPage, load, create: createCliente, update: updateCliente } = useClientes();
  const toast = usePageToast();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ nome: '', status: 'ATIVO', limite_credito: 0 });

  const query = (searchParams.get('q') || '').trim().toLowerCase();

  useEffect(() => { load(1, query || undefined); }, [query]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateCliente(editingId, formData);
        toast.showSuccess('Cliente atualizado com sucesso.');
      } else {
        await createCliente(formData);
        toast.showSuccess('Cliente criado com sucesso.');
      }
      setFormData({ nome: '', status: 'ATIVO', limite_credito: 0 });
      setEditingId(null);
      setShowForm(false);
      await load();
    } catch (err: any) {
      toast.showError(err?.response?.data?.error || 'Erro ao salvar cliente');
    }
  };

  const handleEdit = (cliente: any) => {
    setEditingId(cliente.id_cliente);
    setFormData({ nome: cliente.nome, status: normalizeStatus(cliente.status), limite_credito: cliente.limiteCredito ?? 0 });
    setShowForm(true);
  };

  if (loading) return <div className="container mx-auto px-4 py-8"><TableSkeleton rows={8} /></div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Clientes</h1>
        <button onClick={() => { setEditingId(null); setFormData({ nome: '', status: 'ATIVO', limite_credito: 0 }); setShowForm(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold">Novo Cliente</button>
      </div>

      {showForm && (
        <div className="pedido-modal-backdrop" onClick={() => { setShowForm(false); setEditingId(null); }}>
          <div className="pedido-modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-semibold mb-4">{editingId ? 'Editar Cliente' : 'Novo Cliente'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                  <input type="text" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl" maxLength={150} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl">
                    <option value="ATIVO">Ativo</option>
                    <option value="INATIVO">Inativo</option>
                    <option value="INADIMPLENTE">Inadimplente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Limite de crédito</label>
                  <input type="number" step="0.01" min={0} value={formData.limite_credito} onChange={(e) => setFormData({ ...formData, limite_credito: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl" required />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold">{editingId ? 'Atualizar' : 'Salvar'}</button>
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 font-semibold">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-2xl overflow-hidden border border-slate-100">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600 uppercase">Nome</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600 uppercase">Limite</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600 uppercase">Saldo</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600 uppercase">Pedidos</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((cliente: any) => (
              <tr key={cliente.id_cliente} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{cliente.id_cliente}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{cliente.nome}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    normalizeStatus(cliente.status) === 'ATIVO' ? 'bg-green-100 text-green-800'
                    : normalizeStatus(cliente.status) === 'INADIMPLENTE' ? 'bg-amber-100 text-amber-800'
                    : 'bg-red-100 text-red-800'}`}>{normalizeStatus(cliente.status)}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{fmtBRL(cliente.limiteCredito || 0)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <span className={(cliente.saldoRestante || 0) < 0 ? 'text-red-600' : 'text-emerald-700'}>{fmtBRL(cliente.saldoRestante || 0)}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button type="button" className="text-blue-700 font-semibold hover:underline"
                    onClick={() => navigate(`/relatorios?cliente=${cliente.id_cliente}`)}>{cliente.totalPedidos || 0}</button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button onClick={() => handleEdit(cliente)} className="bg-green-600 hover:bg-green-600 text-white px-3 py-1 rounded-lg font-semibold">Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={currentPage} totalPages={Math.max(1, Math.ceil(total / 10))} onPageChange={(p) => load(p, query || undefined)} />

      {clientes.length === 0 && !loading && <div className="text-center py-8 text-gray-500">Nenhum cliente encontrado.</div>}
    </div>
  );
};

export default Clientes;
