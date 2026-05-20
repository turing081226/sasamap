import React, { createContext, useContext, useState, useCallback } from 'react';
import { Check, X } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [notif, setNotif] = useState({ type: '', text: '' });

  const showToast = useCallback((type, text) => {
    setNotif({ type, text });
    setTimeout(() => setNotif({ type: '', text: '' }), 4000);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {notif.text && (
        <div className="toast-popup" style={{
          background: notif.type === 'success' ? '#dcfce7' : '#fee2e2',
          border: `1px solid ${notif.type === 'success' ? '#22c55e' : '#ef4444'}`,
          color: notif.type === 'success' ? '#14532d' : '#7f1d1d',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          display: 'flex', alignItems: 'center', gap: '8px',
          animation: 'toastFade 3s ease-in-out forwards',
        }}>
          {notif.type === 'success' ? <Check size={14} /> : <X size={14} />}
          {notif.text}
        </div>
      )}
    </ToastContext.Provider>
  );
};
