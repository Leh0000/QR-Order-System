import { createContext, useContext, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState({});
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('gcash');

  function updateQty(productId, qty) {
    setCart((prev) => {
      const next = { ...prev };
      const key = String(productId);
      if (qty <= 0) delete next[key];
      else next[key] = qty;
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
      value={{ cart, updateQty, clearCart, cartCount, notes, setNotes, paymentMethod, setPaymentMethod }}
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
