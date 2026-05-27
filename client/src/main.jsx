import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './contexts/AuthContext';

import { ToastProvider } from './contexts/ToastContext';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your-google-client-id.apps.googleusercontent.com';

// Globally intercept fetch to include credentials (cookies) for our API
const originalFetch = window.fetch;
window.fetch = async (input, init = {}) => {
  if (typeof input === 'string' && (input.includes('/api/') || input.includes('localhost:3001'))) {
    init.credentials = 'include';
  }
  return originalFetch(input, init);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={clientId}>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>

    </GoogleOAuthProvider>
  </React.StrictMode>,
);
