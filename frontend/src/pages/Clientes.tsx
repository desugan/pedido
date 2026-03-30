import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { clienteService, CreateClienteData } from '../services/clienteService';
import { Cliente } from '../types';

const Clientes: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState<CreateClienteData>({
    nome: '',
    status: 'ATIVO',
  });
  const query = (searchParams.get('q') || '').trim().toLowerCase();
  const filteredClientes = clientes.filter((cliente) => {
    if (!query) return true;
    return [
      String(cliente.id_cliente),
      cliente.nome,
      cliente.status,
      String(cliente.pedido?.length || 0),
    ].some((value) => value.toLowerCase().includes(query));
  });

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.max(1, Math.ceil(filteredClientes.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const pagedClientes = filteredClientes.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const normalizeStatus = (status: string): string => {
    const raw = String(status || '').trim().toUpperCase();
    if (raw === 'INADINPLENTE') return 'INADIMPLENTE';
    return raw;
  };

  useEffect(() => {
    loadClientes();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [query]);

  const loadClientes = async () => {
    try {
      setLoading(true);
      const data = await clienteService.getAllClientes();
      setClientes(data);
      setCurrentPage(1);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar clientes');
      console.error('Erro ao carregar clientes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCliente) {
        await clienteService.updateCliente(editingCliente.id_cliente, formData);
      } else {
        await clienteService.createCliente(formData);
      }
      await loadClientes();
      resetForm();
    } catch (err) {
      const message = (err as any)?.response?.data?.error || 'Erro ao salvar cliente';
      setError(message);
      console.error('Erro ao salvar cliente:', err);
    }
  };

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setFormData({
      nome: cliente.nome,
      status: normalizeStatus(cliente.status),
    });
    setShowForm(true);
  };



  const resetForm = () => {
    setFormData({ nome: '', status: 'ATIVO' });
    setEditingCliente(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Clientes</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold"
        >
          Novo Cliente
        </button>
      </div>

      {error && (
        <div className="text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-white shadow-sm border border-slate-100 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {editingCliente ? 'Editar Cliente' : 'Novo Cliente'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ATIVO">Ativo</option>
                  <option value="INATIVO">Inativo</option>
                  <option value="INADIMPLENTE">Inadimplente</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold"
              >
                {editingCliente ? 'Atualizar' : 'Salvar'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="btn-cancel-neutral px-4 py-2 rounded-xl font-semibold"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow rounded-2xl overflow-hidden border border-slate-100">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pedidos
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {pagedClientes.map((cliente) => (
              <tr key={cliente.id_cliente} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {cliente.id_cliente}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {cliente.nome}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {(() => {
                    const status = normalizeStatus(cliente.status);
                    return (
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      status === 'ATIVO'
                        ? 'bg-green-100 text-green-800'
                        : status === 'INADIMPLENTE'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {status}
                  </span>
                    );
                  })()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <button
                    type="button"
                    className="text-blue-700 font-semibold hover:underline"
                    onClick={() => navigate(`/relatorios?cliente=${cliente.id_cliente}`)}
                  >
                    {cliente.pedido?.length || 0}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEdit(cliente)}
                    className="bg-green-600 hover:bg-green-600 text-white px-3 py-1 rounded-lg font-semibold mr-2"
                  >
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

      {clientes.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          Nenhum cliente encontrado.
        </div>
      )}
    </div>
  );
};

export default Clientes;