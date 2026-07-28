import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/**
 * Componente de paginação reutilizável.
 * @param {PaginationProps} props - Propriedades da paginação.
 * @returns {JSX.Element} Barra de paginação.
 */
export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps): React.ReactElement {
  return (
    <div className="mt-4 flex items-center justify-between">
      <p className="page-indicator-card text-sm font-medium">
        Página {currentPage} de {totalPages}
      </p>
      <div className="space-x-2">
        <button
          type="button"
          className="px-3 py-1.5 rounded-xl border bg-white disabled:opacity-50 font-semibold"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          Anterior
        </button>
        <button
          type="button"
          className="px-3 py-1.5 rounded-xl border bg-white disabled:opacity-50 font-semibold"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
        >
          Próxima
        </button>
      </div>
    </div>
  );
}
