import { Plus, Minus } from 'lucide-react';
import CategoryIcon from './CategoryIcon';
import { useCart } from '../context/CartContext';

export default function MenuItemRow({ item, onOpen }) {
  const { cart, updateQty } = useCart();
  const qty = cart[String(item.id)] || 0;

  return (
    <div
      onClick={() => onOpen(item)}
      className="flex items-center gap-3 py-3 cursor-pointer border-b border-line"
    >
      <div className="flex items-center justify-center rounded-full flex-shrink-0 w-[46px] h-[46px] bg-accent-soft">
        <CategoryIcon category={item.category} size={20} className="text-accent" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-ink">{item.name}</span>
          {item.tag && (
            <span className="text-[10px] uppercase font-semibold rounded-full px-2 py-0.5 flex-shrink-0 bg-gold-soft text-gold tracking-[0.06em]">
              {item.tag}
            </span>
          )}
        </div>
        <p className="text-xs truncate mt-0.5 text-ink-soft">{item.description}</p>
        <span className="text-sm font-semibold text-accent">₱{Number(item.price).toFixed(0)}</span>
      </div>

      {qty === 0 ? (
        <button
          onClick={(e) => { e.stopPropagation(); updateQty(item.id, 1); }}
          className="flex items-center justify-center rounded-full flex-shrink-0 w-8 h-8 bg-accent text-white"
        >
          <Plus size={16} />
        </button>
      ) : (
        <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => updateQty(item.id, qty - 1)}
            className="flex items-center justify-center rounded-full w-7 h-7 border border-line text-ink"
          >
            <Minus size={14} />
          </button>
          <span className="text-sm font-semibold w-4 text-center text-ink">{qty}</span>
          <button
            onClick={() => updateQty(item.id, qty + 1)}
            className="flex items-center justify-center rounded-full w-7 h-7 bg-accent text-white"
          >
            <Plus size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
