import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState({});
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('gcash');

  function updateQty(productId, qty) {
    setCart((prev) => {
      const next = { ...prev };
      if (qty <= 0) delete next[productId];
      else next[String(productId)] = qty;
      return next;
    });
  }

  function addItem(product) {
    const id = String(product.id);
    setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  }

  function removeItem(productId) {
    setCart((prev) => {
      const next = { ...prev };
      delete next[String(productId)];
      return next;
    });
  }

  function clearCart() {
    setCart({});
    setNotes('');
    setPaymentMethod('gcash');
  }

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);

  return (
    <CartContext.Provider
      value={{ cart, addItem, removeItem, updateQty, clearCart, cartCount, notes, setNotes, paymentMethod, setPaymentMethod }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
