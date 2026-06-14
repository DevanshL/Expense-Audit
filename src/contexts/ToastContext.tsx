import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { ToastContainer } from '../components/Toast';
import type { Toast } from '../components/Toast';

interface ToastContextType {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { ...toast, id, duration: toast.duration ?? 5000 }]);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{
      toasts,
      showToast,
      dismissToast,
      success: (title, message) => showToast({ type: 'success', title, message }),
      error: (title, message) => showToast({ type: 'error', title, message }),
      info: (title, message) => showToast({ type: 'info', title, message }),
      warning: (title, message) => showToast({ type: 'warning', title, message }),
    }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
