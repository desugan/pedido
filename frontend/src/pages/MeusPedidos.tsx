import React, { useEffect, useState } from 'react';
import { pedidoService, Pedido } from '../services/pedidoService';
import { authService } from '../services/authService';

const formatPedidoStatus = (status: string): string => {
  const normalized = String(status || '').trim().toLowerCase().replace(/_/g, ' ');
  if (!normalized) return '';
  return normalized.toUpperCase();
};

const MeusPedidos: React.FC = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const normalizeProdutoNome = (value: string): string => {
    if (!value) return 'Produto';

    if (!/[ÃÂ]/.test(value)) {
      return value.toUpperCase();
    }

    try {
      const bytes = Uint8Array.from(value.split('').map((char) => char.charCodeAt(0)));
      const decoded = new TextDecoder('utf-8').decode(bytes);
      return (decoded.includes('�') ? value : decoded).toUpperCase();
    } catch {
      return value.toUpperCase();
    }
  };

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.max(1, Math.ceil(pedidos.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const pagedPedidos = pedidos.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  useEffect(() => {
    const load = async () => {
      const user = authService.getCurrentUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const data = await pedidoService.getPedidosByClienteId(user.id_cliente);
      setPedidos(data);
      setCurrentPage(1);
      setLoading(false);
    };

    load();
  }, []);

  if (loading) return <div className="p-6">Carregando...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Meus Pedidos</h1>
      <div className="bg-white rounded-2xl shadow overflow-x-auto border border-slate-100">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">ID</th>
              <th className="px-4 py-2 text-left">Itens</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Total</th>
            </tr>
          </thead>
          <tbody>
            {pagedPedidos.map((pedido) => (
              <tr key={pedido.id} className="border-t">
                <td className="px-4 py-2">{pedido.id}</td>
                <td className="px-4 py-2">
                  {pedido.itens?.length ? (
                    <div className="space-y-1">
                      {pedido.itens.map((item, idx) => (
                        <div key={`${pedido.id}-${item.id ?? idx}`} className="text-sm">
                          {normalizeProdutoNome(item.produtoNome || 'Produto')} x{item.quantidade} (R$ {item.precoUnitario.toFixed(2)})
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">Sem itens</span>
                  )}
                </td>
                <td className="px-4 py-2">{formatPedidoStatus(pedido.status)}</td>
                <td className="px-4 py-2">{pedido.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="page-indicator-card text-sm font-medium">
          Página {currentPage} de {totalPages}
        </p>
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

export default MeusPedidos;
