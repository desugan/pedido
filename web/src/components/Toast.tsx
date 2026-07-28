import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

export type ToastType = 'error' | 'success';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

export function usePageToast() {
  const toast = useToast();
  return {
    showError: (message: string) => toast.showError(message),
    showSuccess: (message: string) => toast.showSuccess(message),
  };
}

let toastIdCounter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const removeToast = useCallback((id: number) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType) => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    const timer = setTimeout(() => removeToast(id), 4500);
    timersRef.current.set(id, timer);
  }, [removeToast]);

  const showError = useCallback((message: string) => showToast(message, 'error'), [showToast]);
  const showSuccess = useCallback((message: string) => showToast(message, 'success'), [showToast]);

  return (
    <ToastContext.Provider value={{ showError, showSuccess }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const isError = toast.type === 'error';
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    let raf: number;
    const show = () => {
      requestAnimationFrame(() => setIsVisible(true));
    };
    raf = requestAnimationFrame(show);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (isVisible && !isLeaving) {
      const timer = setTimeout(() => {
        setIsLeaving(true);
        setTimeout(onDismiss, 400);
      }, 3800);
      return () => clearTimeout(timer);
    }
  }, [isVisible, isLeaving, onDismiss]);

  const handleDismiss = () => {
    if (!isLeaving) {
      setIsLeaving(true);
      setTimeout(onDismiss, 400);
    }
  };

  return (
    <div
      className={`
        pointer-events-auto min-w-[300px] max-w-[400px] rounded-2xl px-5 py-4 shadow-xl cursor-pointer
        transition-all duration-400 ease-out
        ${isError ? 'bg-red-50/95 border border-red-200 text-red-800' : 'bg-emerald-50/95 border border-emerald-200 text-emerald-800'}
        ${isVisible && !isLeaving ? 'opacity-100 translate-y-0 translate-x-0' : 'opacity-0 translate-y-4 translate-x-8'}
      `}
      style={{ transitionTimingFunction: isLeaving ? 'ease-in' : 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
      onClick={handleDismiss}
    >
      <p className="text-sm font-semibold leading-snug">{toast.message}</p>
      <p className="text-xs opacity-60 mt-1">Clique para fechar</p>
    </div>
  );
}