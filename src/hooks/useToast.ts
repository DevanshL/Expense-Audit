import { useState } from 'react';
import type { Toast } from '../components/Toast';

// Hook for managing toasts
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? 5000
    };
    
    setToasts(prev => [...prev, newToast]);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const dismissAll = () => {
    setToasts([]);
  };

  return {
    toasts,
    showToast,
    dismissToast,
    dismissAll,
    success: (title: string, message?: string, duration?: number) => 
      showToast({ type: 'success', title, message, duration }),
    error: (title: string, message?: string, duration?: number) => 
      showToast({ type: 'error', title, message, duration }),
    info: (title: string, message?: string, duration?: number) => 
      showToast({ type: 'info', title, message, duration }),
    warning: (title: string, message?: string, duration?: number) => 
      showToast({ type: 'warning', title, message, duration })
  };
}
