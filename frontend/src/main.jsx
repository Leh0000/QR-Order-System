import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

import OrderPage from './pages/OrderPage';
import AdminPage from './pages/AdminPage';
import { CartProvider } from './context/CartContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <CartProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route path="/order" element={<OrderPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/qr-generator" element={<Navigate to="/admin?tab=qr" replace />} />
        </Routes>
      </CartProvider>
    </BrowserRouter>
  </React.StrictMode>
);
