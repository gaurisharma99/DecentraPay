import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { PaymentsProvider } from './context/PaymentsContext';
import { AuthProvider } from './context/AuthContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <PaymentsProvider>
        <App />
      </PaymentsProvider>
    </AuthProvider>
  </React.StrictMode>
);
