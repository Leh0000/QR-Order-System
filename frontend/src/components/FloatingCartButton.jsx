import { useCart } from '../context/CartContext';

export default function FloatingCartButton({ products, onClick }) {
  const { cart, cartCount } = useCart();

  const total = Object.entries(cart).reduce((sum, [id, qty]) => {
    const p = products.find((p) => String(p.id) === String(id));
    return sum + (p ? Number(p.price) * qty : 0);
  }, 0);

  if (cartCount === 0) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-10 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 bg-gradient-to-t from-bg via-bg to-transparent md:bottom-4 md:left-4 md:right-4 md:px-0 md:pb-4 md:pt-0 md:bg-none">
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between rounded-2xl px-5 py-3.5 shadow-lg bg-ink text-white"
      >
        <span className="flex items-center gap-2 text-sm font-semibold">
          <span className="flex items-center justify-center rounded-full text-xs w-[22px] h-[22px] bg-accent">
            {cartCount}
          </span>
          View order
        </span>
        <span className="text-sm font-semibold">₱{total.toFixed(0)}</span>
      </button>
    </div>
  );
}
