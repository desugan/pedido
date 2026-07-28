import React from 'react';

interface StatusFilterProps {
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (value: string) => void;
}

/**
 * Filtro de status com botões tipo chip.
 * @param {StatusFilterProps} props - Propriedades do filtro.
 * @returns {JSX.Element} Barra de filtros.
 */
export function StatusFilter({ options, selected, onSelect }: StatusFilterProps): React.ReactElement {
  return (
    <div className="filter-bar">
      <span className="text-sm font-semibold text-slate-700">Status:</span>
      <div className="flex flex-wrap gap-2">
        {options.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => onSelect(item.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              selected === item.value
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
