import React, { useEffect, useState } from 'react';
import { pagamentoService, Pagamento } from '../services/pagamentoService';
import { authService } from '../services/authService';

const MeusPagamentos: React.FC = () => {
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.max(1, Math.ceil(pagamentos.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const pagedPagamentos = pagamentos.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  useEffect(() => {
    const load = async () => {
      const user = authService.getCurrentUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const data = await pagamentoService.getPagamentosByClienteId(user.id_cliente);
      setPagamentos(data);
      setCurrentPage(1);
      setLoading(false);
    };

    load();
  }, []);

  if (loading) return <div className="p-6">Carregando...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Meus Pagamentos</h1>
      <div className="bg-white rounded-2xl shadow overflow-x-auto border border-slate-100">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">ID</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Valor</th>
            </tr>
          </thead>
          <tbody>
            {pagedPagamentos.map((pagamento) => (
              <tr key={pagamento.id_pagamento} className="border-t">
                <td className="px-4 py-2">{pagamento.id_pagamento}</td>
                <td className="px-4 py-2">{pagamento.status.toUpperCase()}</td>
                <td className="px-4 py-2">{pagamento.valor.toFixed(2)}</td>
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

export default MeusPagamentos;
