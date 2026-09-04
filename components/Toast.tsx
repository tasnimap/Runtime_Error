'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const toastStyles: Record<string, React.CSSProperties> = {
    success: {
      background: 'rgba(7,9,18,0.95)',
      border: '1px solid rgba(0,212,255,0.3)',
      color: '#e8edf5',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(0,212,255,0.1)',
      backdropFilter: 'blur(20px)',
    },
    error: {
      background: 'rgba(7,9,18,0.95)',
      border: '1px solid rgba(239,68,68,0.3)',
      color: '#e8edf5',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(239,68,68,0.1)',
      backdropFilter: 'blur(20px)',
    },
    info: {
      background: 'rgba(7,9,18,0.95)',
      border: '1px solid rgba(168,85,247,0.3)',
      color: '#e8edf5',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(168,85,247,0.1)',
      backdropFilter: 'blur(20px)',
    },
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl text-sm"
            style={{ ...toastStyles[toast.type], borderRadius: '14px', padding: '12px 16px' }}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#00d4ff' }} />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#f87171' }} />}
            {toast.type === 'info' && <Info className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#a855f7' }} />}
            <div className="flex-1 leading-snug" style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px' }}>
              {toast.message}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              style={{ color: '#4b5563' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#e8edf5')}
              onMouseLeave={e => (e.currentTarget.style.color = '#4b5563')}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
