'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const dismiss = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none" style={{ maxWidth: 380 }}>
        {toasts.map(t => <ToastBubble key={t.id} t={t} onDismiss={dismiss} />)}
      </div>
    </ToastContext.Provider>
  );
}

function ToastBubble({ t, onDismiss }: { t: ToastItem; onDismiss: (id: string) => void }) {
  const cfg = {
    success: { Icon: CheckCircle, cls: 'bg-green-50 border-green-200 text-green-800' },
    error:   { Icon: XCircle,      cls: 'bg-red-50 border-red-200 text-red-800' },
    info:    { Icon: Info,          cls: 'bg-prof-50 border-prof-200 text-prof-800' },
  }[t.type];

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg pointer-events-auto ${cfg.cls}`}>
      <cfg.Icon size={16} className="flex-shrink-0 mt-0.5" />
      <p className="text-sm flex-1">{t.message}</p>
      <button onClick={() => onDismiss(t.id)} className="opacity-60 hover:opacity-100 flex-shrink-0">
        <X size={14} />
      </button>
    </div>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
