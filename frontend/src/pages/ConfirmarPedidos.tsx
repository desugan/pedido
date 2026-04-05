import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { pedidoService, Pedido } from '../services/pedidoService';

const formatStatus = (status: string) => String(status || '').replace(/_/g, ' ').trim().toUpperCase();

const ConfirmarPedidos: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const query = (searchParams.get('q') || '').trim().toLowerCase();

  const pendentes = useMemo(
    () => pedidos.filter((p) => p.status?.toLowerCase() === 'pendente'),
    [pedidos]
  );
  const filteredPendentes = pendentes.filter((pedido) => {
    if (!query) return true;
    return [
      String(pedido.id),
      String(pedido.clienteId),
      pedido.status,
      pedido.total.toFixed(2),
    ].some((value) => value.toLowerCase().includes(query));
  });
  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.max(1, Math.ceil(filteredPendentes.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const pagedPendentes = filteredPendentes.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const load = async () => {
    setLoading(true);
    const data = await pedidoService.getAllPedidos();
    setPedidos(data);
    setCurrentPage(1);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [query]);

  const confirmar = async (id: number) => {
    await pedidoService.updatePedidoStatus(id, 'confirmado');
    await load();
  };

  if (loading) return <div className="p-6">Carregando...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Confirmar Pedidos</h1>
      <div className="bg-white rounded-2xl shadow overflow-x-auto border border-slate-100">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">ID</th>
              <th className="px-4 py-2 text-left">Cliente</th>
              <th className="px-4 py-2 text-left">Total</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {pagedPendentes.map((pedido) => (
              <tr key={pedido.id} className="border-t">
                <td className="px-4 py-2">{pedido.id}</td>
                <td className="px-4 py-2">{pedido.clienteId}</td>
                <td className="px-4 py-2">{pedido.total.toFixed(2)}</td>
                <td className="px-4 py-2">{formatStatus(pedido.status)}</td>
                <td className="px-4 py-2">
                  <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg font-semibold" onClick={() => confirmar(pedido.id)}>
                    Confirmar
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

export default ConfirmarPedidos;
