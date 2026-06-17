import { useState } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import ProductImage from './ProductImage';
import { useCart } from '../context/CartContext';

export default function ItemDetailModal({ item, onClose }) {
  const { cart, updateQty } = useCart();
  const [qty, setQty] = useState(cart[String(item.id)] || 1);

  function confirm() {
    updateQty(item.id, qty);
    onClose();
  }

  const price = Number(item.price);

  return (
    <div
      className="absolute inset-0 z-20 flex items-end"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-t-3xl p-6 bg-bg animate-slide-up"
      >
        <div className="flex justify-between items-start mb-4 gap-3">
          <ProductImage item={item} size="hero" className="flex-1" />
          <button onClick={onClose} className="text-ink-soft flex-shrink-0">
            <X size={20} />
          </button>
        </div>

        {item.tag && (
          <span className="text-[10px] uppercase font-semibold rounded-full px-2 py-0.5 mb-1 inline-block bg-gold-soft text-gold tracking-[0.06em]">
            {item.tag}
          </span>
        )}

        <h3 className="font-serif font-semibold text-xl text-ink">{item.name}</h3>
        <p className="text-sm mt-1 mb-4 text-ink-soft">{item.description}</p>

        <div className="flex items-center justify-between mb-5">
          <span className="text-lg font-semibold text-accent">₱{price.toFixed(0)}</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="flex items-center justify-center rounded-full w-[34px] h-[34px] border border-line text-ink"
            >
              <Minus size={16} />
            </button>
            <span className="text-base font-semibold w-5 text-center text-ink">{qty}</span>
            <button
              onClick={() => setQty((q) => q + 1)}
              className="flex items-center justify-center rounded-full w-[34px] h-[34px] bg-accent text-white"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        <button
          onClick={confirm}
          className="w-full rounded-xl py-3 text-sm font-semibold bg-accent text-white"
        >
          {cart[String(item.id)] ? 'Update order' : 'Add to order'} · ₱{(price * qty).toFixed(0)}
        </button>
      </div>
    </div>
  );
}
