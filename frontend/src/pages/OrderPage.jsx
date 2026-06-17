import { useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapPin, ArrowLeft, Plus, Minus, ShoppingBag, Check, Smartphone, CreditCard } from 'lucide-react';

import { useCart } from '../context/CartContext';
import { useProducts } from '../hooks/useProducts';
import MenuHeader from '../components/MenuHeader';
import CategoryTabs from '../components/CategoryTabs';
import MenuItemRow from '../components/MenuItemRow';
import ItemDetailModal from '../components/ItemDetailModal';
import FloatingCartButton from '../components/FloatingCartButton';
import PaymentSimulator from '../components/PaymentSimulator';

const TAX_RATE = 0.12;

export default function OrderPage() {
  const [searchParams] = useSearchParams();
  const tableNumber = searchParams.get('table');
  const { products, categories, loading, error } = useProducts();
  const { cart, cartCount, notes, setNotes, paymentMethod, setPaymentMethod, updateQty, clearCart } = useCart();
  const [screen, setScreen] = useState('menu'); // menu | cart | checkout | confirmation
  const [activeItem, setActiveItem] = useState(null);
  const [activeCategory, setActiveCategory] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const sectionRefs = useRef({});

  if (!tableNumber || isNaN(parseInt(tableNumber))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-soft">
        <div className="text-center px-8">
          <h1 className="font-serif text-2xl font-semibold text-ink mb-2">Invalid Table</h1>
          <p className="text-ink-soft text-sm">Please scan your table's QR code to start ordering.</p>
        </div>
      </div>
    );
  }

  const allProducts = products;
  function findProduct(id) { return allProducts.find((p) => String(p.id) === String(id)); }

  const subtotal = Object.entries(cart).reduce((sum, [id, qty]) => {
    const p = findProduct(id);
    return sum + (p ? Number(p.price) * qty : 0);
  }, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  function scrollToCategory(name) {
    setActiveCategory(name);
    sectionRefs.current[name]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function handlePaymentSuccess() {
    try {
      const items = Object.entries(cart).map(([product_id, quantity]) => ({
        product_id: parseInt(product_id),
        quantity,
      }));
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table_number: parseInt(tableNumber),
          items,
          payment_method: paymentMethod,
          notes,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Order failed');
      setConfirmedOrder(body.data);
      setScreen('confirmation');
      clearCart();
    } catch (e) {
      alert('Failed to submit order: ' + e.message);
      setScreen('cart');
    }
  }

  // ---- MENU SCREEN ----
  const renderMenu = () => (
    <>
      <MenuHeader tableNumber={tableNumber} />
      {loading && (
        <div className="flex-1 flex items-center justify-center text-ink-soft text-sm">Loading menu…</div>
      )}
      {error && (
        <div className="flex-1 flex items-center justify-center text-red-400 text-sm px-6 text-center">{error}</div>
      )}
      {!loading && !error && (
        <>
          <CategoryTabs
            categories={categories}
            activeCategory={activeCategory || categories[0]}
            onSelect={scrollToCategory}
          />
          <div className="flex-1 overflow-y-auto px-5" style={{ paddingBottom: cartCount > 0 ? 96 : 24 }}>
            {categories.map((cat) => (
              <div key={cat} ref={(el) => (sectionRefs.current[cat] = el)} className="pt-5">
                <h2 className="font-serif font-semibold text-[18px] text-ink mb-1">{cat}</h2>
                {products.filter((p) => p.category === cat).map((item) => (
                  <MenuItemRow key={item.id} item={item} onOpen={setActiveItem} />
                ))}
              </div>
            ))}
          </div>
        </>
      )}
      <FloatingCartButton products={products} onClick={() => setScreen('cart')} />
      {activeItem && <ItemDetailModal item={activeItem} onClose={() => setActiveItem(null)} />}
    </>
  );

  // ---- CART SCREEN ----
  const renderCart = () => (
    <>
      <div className="px-5 pt-5 pb-3 flex items-center justify-between flex-shrink-0 border-b border-line">
        <div className="flex items-center gap-3">
          <button onClick={() => setScreen('menu')} className="text-ink"><ArrowLeft size={20} /></button>
          <h1 className="font-serif font-semibold text-xl text-ink">Your order</h1>
        </div>
        <div className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium bg-accent-soft text-accent">
          <MapPin size={13} /><span>Table {tableNumber}</span>
        </div>
      </div>

      {cartCount === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <div className="flex items-center justify-center rounded-full mb-4 w-16 h-16 bg-bg-soft">
            <ShoppingBag size={28} className="text-ink-soft" />
          </div>
          <h3 className="font-semibold mb-1 text-ink">Your order is empty</h3>
          <p className="text-sm mb-5 text-ink-soft">Add a few dishes from the menu to get started.</p>
          <button onClick={() => setScreen('menu')} className="rounded-xl px-5 py-2.5 text-sm font-semibold bg-accent text-white">Browse menu</button>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-5 pt-2 pb-2">
            {Object.entries(cart).map(([id, qty]) => {
              const item = findProduct(id);
              if (!item) return null;
              return (
                <div key={id} className="flex items-center gap-3 py-3 border-b border-line">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink">{item.name}</p>
                    <p className="text-xs text-ink-soft">₱{Number(item.price).toFixed(0)} each</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => updateQty(id, qty - 1)} className="flex items-center justify-center rounded-full w-[26px] h-[26px] border border-line text-ink"><Minus size={13} /></button>
                    <span className="text-sm font-semibold w-4 text-center text-ink">{qty}</span>
                    <button onClick={() => updateQty(id, qty + 1)} className="flex items-center justify-center rounded-full w-[26px] h-[26px] bg-accent text-white"><Plus size={13} /></button>
                  </div>
                  <span className="text-sm font-semibold w-12 text-right flex-shrink-0 text-ink">₱{(Number(item.price) * qty).toFixed(0)}</span>
                </div>
              );
            })}
            <div className="pt-4">
              <label className="text-xs font-medium text-ink-soft">Note for the kitchen (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. No onions, less spicy…"
                rows={2}
                className="w-full mt-1.5 rounded-xl p-3 text-sm resize-none outline-none bg-bg-soft text-ink border border-line"
              />
            </div>
          </div>
          <div className="px-5 pt-3 pb-5 flex-shrink-0 border-t border-line">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-ink-soft">Subtotal</span>
              <span className="text-sm font-semibold text-ink">₱{subtotal.toFixed(0)}</span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-ink-soft">Tax (12%)</span>
              <span className="text-sm font-semibold text-ink">₱{tax.toFixed(0)}</span>
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold text-ink">Total</span>
              <span className="font-semibold text-lg text-accent">₱{total.toFixed(0)}</span>
            </div>
            <button onClick={() => setScreen('checkout')} className="w-full rounded-xl py-3 text-sm font-semibold bg-accent text-white">Proceed to checkout</button>
          </div>
        </>
      )}
    </>
  );

  // ---- CHECKOUT SCREEN ----
  const paymentOptions = [
    { id: 'gcash', label: 'GCash', Icon: Smartphone },
    { id: 'card', label: 'Card', Icon: CreditCard },
  ];

  const renderCheckout = () => (
    <>
      <div className="px-5 pt-5 pb-3 flex items-center gap-3 flex-shrink-0 border-b border-line">
        <button onClick={() => setScreen('cart')} className="text-ink"><ArrowLeft size={20} /></button>
        <h1 className="font-serif font-semibold text-xl text-ink">Checkout</h1>
      </div>
      <div className="flex-1 overflow-y-auto px-5 pt-4">
        <div className="rounded-2xl p-4 mb-5 flex items-start gap-3 bg-accent-soft">
          <MapPin size={18} className="text-accent mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-ink">Dine-in · Table {tableNumber}</p>
            <p className="text-xs mt-0.5 text-ink-soft">Your order will be brought to your table.</p>
          </div>
        </div>

        <h3 className="text-sm font-semibold mb-2 text-ink">Payment method</h3>
        <div className="flex gap-2 mb-5">
          {paymentOptions.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setPaymentMethod(id)}
              className={`flex-1 flex flex-col items-center gap-1.5 rounded-xl py-3 border-[1.5px] transition-colors ${
                paymentMethod === id ? 'bg-accent-soft border-accent' : 'bg-bg-soft border-transparent'
              }`}
            >
              <Icon size={18} className={paymentMethod === id ? 'text-accent' : 'text-ink-soft'} />
              <span className={`text-xs font-medium ${paymentMethod === id ? 'text-accent' : 'text-ink'}`}>{label}</span>
            </button>
          ))}
        </div>

        <h3 className="text-sm font-semibold mb-2 text-ink">Order summary</h3>
        <div className="mb-3">
          {Object.entries(cart).map(([id, qty]) => {
            const item = findProduct(id);
            if (!item) return null;
            return (
              <div key={id} className="flex items-center justify-between py-1.5 text-sm">
                <span className="text-ink">{qty} × {item.name}</span>
                <span className="text-ink-soft">₱{(Number(item.price) * qty).toFixed(0)}</span>
              </div>
            );
          })}
          {notes && <p className="text-xs mt-2 italic text-ink-soft">Note: {notes}</p>}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-line mb-1">
          <span className="text-sm text-ink-soft">Subtotal</span>
          <span className="text-sm font-semibold text-ink">₱{subtotal.toFixed(0)}</span>
        </div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-ink-soft">Tax (12%)</span>
          <span className="text-sm font-semibold text-ink">₱{tax.toFixed(0)}</span>
        </div>
        <div className="flex items-center justify-between mb-5">
          <span className="font-semibold text-ink">Total</span>
          <span className="font-semibold text-lg text-accent">₱{total.toFixed(0)}</span>
        </div>

        <PaymentSimulator
          onSuccess={handlePaymentSuccess}
          onFailure={() => {}}
          onCancel={() => setScreen('cart')}
        />
      </div>
    </>
  );

  // ---- CONFIRMATION SCREEN ----
  const steps = ['Order received', 'Preparing', 'Ready to serve'];
  const renderConfirmation = () => (
    <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
      <div className="flex items-center justify-center rounded-full mb-4 w-16 h-16 bg-accent-soft">
        <Check size={28} className="text-accent" />
      </div>
      <h2 className="font-serif font-semibold text-[22px] text-ink">Order placed!</h2>
      <p className="text-sm mt-1 mb-6 text-ink-soft">
        Order #{confirmedOrder?.order_number} has been sent to the kitchen for Table {tableNumber}.
      </p>

      <div className="w-full mb-6">
        <div className="flex items-center">
          {steps.map((step, i) => (
            <div key={step} className="contents">
              <div className="flex flex-col items-center" style={{ flex: i === 1 ? 'none' : 1 }}>
                <div
                  className={`flex items-center justify-center rounded-full text-xs font-semibold w-6 h-6 ${
                    i === 0 ? 'bg-accent text-white' : 'bg-bg-soft text-ink-soft'
                  }`}
                >
                  {i + 1}
                </div>
                <span className={`text-[10px] mt-1.5 text-center max-w-[70px] ${i === 0 ? 'text-ink' : 'text-ink-soft'}`}>{step}</span>
              </div>
              {i < steps.length - 1 && <div className="flex-1 h-px bg-line mb-[18px]" />}
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs mb-6 text-ink-soft">Estimated ready time: 15–20 minutes</p>
      <button
        onClick={() => { setScreen('menu'); setConfirmedOrder(null); }}
        className="rounded-xl px-6 py-3 text-sm font-semibold bg-accent text-white"
      >
        Back to menu
      </button>
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-bg-soft md:p-4">
      <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-bg md:mx-auto md:min-h-0 md:h-[calc(100vh-2rem)] md:max-h-[960px] md:max-w-5xl md:rounded-[28px] md:shadow-[0_24px_60px_-24px_rgba(0,0,0,0.25)]">
        {screen === 'menu' && renderMenu()}
        {screen === 'cart' && renderCart()}
        {screen === 'checkout' && renderCheckout()}
        {screen === 'confirmation' && renderConfirmation()}
      </div>
    </div>
  );
}
