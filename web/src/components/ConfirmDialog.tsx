import React from 'react';

interface ConfirmDialogProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
}

/**
 * Modal de confirmação de ação.
 * @param {ConfirmDialogProps} props - Propriedades do modal.
 * @returns {JSX.Element} Modal de confirmação.
 */
export function ConfirmDialog({ title, message, onConfirm, onCancel, confirmLabel = 'Confirmar', cancelLabel = 'Voltar' }: ConfirmDialogProps): React.ReactElement {
  return (
    <div className="pedido-modal-backdrop" onClick={onCancel}>
      <div className="pedido-modal-card max-w-sm" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
        <p className="text-sm text-slate-600 mb-4">{message}</p>
        <div className="flex gap-2 justify-end">
          <button type="button" className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 font-semibold" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
