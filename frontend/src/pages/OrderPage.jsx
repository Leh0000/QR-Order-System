import { useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapPin, ArrowLeft, Plus, Minus, ShoppingBag, Check, Smartphone, CreditCard, Clock, ClipboardList } from 'lucide-react';

import { useCart } from '../context/CartContext';
import { useProducts } from '../hooks/useProducts';
import { useTableOrders } from '../hooks/useTableOrders';
import MenuHeader from '../components/MenuHeader';
import CategoryTabs from '../components/CategoryTabs';
import MenuItemRow from '../components/MenuItemRow';
import ItemDetailModal from '../components/ItemDetailModal';
import FloatingCartButton from '../components/FloatingCartButton';
import PaymentSimulator from '../components/PaymentSimulator';

const TAX_RATE = 0.12;
const STATUS_STEPS = ['Order received', 'Preparing', 'Ready to serve'];

const STATUS_LABELS = {
  received: 'Order received',
  preparing: 'Preparing',
  ready: 'Ready to serve',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const STATUS_COLORS = {
  received: 'bg-blue-100 text-blue-700',
  preparing: 'bg-orange-100 text-orange-700',
  ready: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-500',
};

function statusStepIndex(orderStatus) {
  if (orderStatus === 'received') return 0;
  if (orderStatus === 'preparing') return 1;
  if (orderStatus === 'ready' || orderStatus === 'completed') return 2;
  return -1;
}

function formatOrderTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function OrderStatusProgress({ orderStatus }) {
  const activeStep = statusStepIndex(orderStatus);
  const isCancelled = orderStatus === 'cancelled';
  const isCompleted = orderStatus === 'completed';

  if (isCancelled) {
    return <p className="text-sm font-medium text-red-500">This order was cancelled.</p>;
  }

  return (
    <div className="w-full">
      <div className="flex items-center">
        {STATUS_STEPS.map((step, i) => (
          <div key={step} className="contents">
            <div className="flex flex-col items-center" style={{ flex: i === 1 ? 'none' : 1 }}>
              <div
                className={`flex items-center justify-center rounded-full text-xs font-semibold w-6 h-6 ${
                  isCompleted || i <= activeStep ? 'bg-accent text-white' : 'bg-bg-soft text-ink-soft'
                }`}
              >
                {isCompleted || i < activeStep ? <Check size={12} /> : i + 1}
              </div>
              <span
                className={`text-[10px] mt-1.5 text-center max-w-[70px] ${
                  isCompleted || i <= activeStep ? 'text-ink' : 'text-ink-soft'
                }`}
              >
                {step}
              </span>
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div className={`flex-1 h-px mb-[18px] ${isCompleted || i < activeStep ? 'bg-accent' : 'bg-line'}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function OrderStatusBadge({ status }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-500'}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

export default function OrderPage() {
  const [searchParams] = useSearchParams();
  const tableNumber = searchParams.get('table');
  const { products, categories, loading, error } = useProducts();
  const { orders: tableOrders, loading: ordersLoading, refetch: refetchTableOrders } = useTableOrders(tableNumber);
  const { cart, cartCount, notes, setNotes, paymentMethod, setPaymentMethod, updateQty, clearCart } = useCart();
  const [screen, setScreen] = useState('menu'); // menu | cart | checkout | confirmation | my-orders
  const [activeItem, setActiveItem] = useState(null);
  const [activeCategory, setActiveCategory] = useState('');
  const [confirmedOrderId, setConfirmedOrderId] = useState(null);
  const [placedOrderSnapshot, setPlacedOrderSnapshot] = useState(null);
  const sectionRefs = useRef({});

  const activeOrderCount = tableOrders.filter(
    (o) => o.order_status !== 'completed' && o.order_status !== 'cancelled'
  ).length;

  const confirmedOrder = confirmedOrderId
    ? tableOrders.find((o) => o.id === confirmedOrderId) ?? placedOrderSnapshot
    : null;

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
      setConfirmedOrderId(body.data.id);
      setPlacedOrderSnapshot(body.data);
      refetchTableOrders();
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
      <MenuHeader
        tableNumber={tableNumber}
        onMyOrders={() => setScreen('my-orders')}
        activeOrderCount={activeOrderCount}
      />
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

  // ---- MY ORDERS SCREEN ----
  const renderMyOrders = () => (
    <>
      <div className="px-5 pt-5 pb-3 flex items-center gap-3 flex-shrink-0 border-b border-line">
        <button onClick={() => setScreen('menu')} className="text-ink"><ArrowLeft size={20} /></button>
        <h1 className="font-serif font-semibold text-xl text-ink">My orders</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {ordersLoading && (
          <p className="text-sm text-center text-ink-soft py-8">Loading your orders…</p>
        )}
        {!ordersLoading && tableOrders.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-12 px-4">
            <div className="flex items-center justify-center rounded-full mb-4 w-16 h-16 bg-bg-soft">
              <ClipboardList size={28} className="text-ink-soft" />
            </div>
            <h3 className="font-semibold mb-1 text-ink">No orders yet</h3>
            <p className="text-sm mb-5 text-ink-soft">Place an order from the menu and track its status here.</p>
            <button onClick={() => setScreen('menu')} className="rounded-xl px-5 py-2.5 text-sm font-semibold bg-accent text-white">
              Browse menu
            </button>
          </div>
        )}
        {!ordersLoading && tableOrders.map((order) => (
          <div key={order.id} className="rounded-2xl p-4 mb-3 border border-line bg-bg">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <p className="text-sm font-semibold text-ink">Order #{order.order_number}</p>
                <p className="text-xs text-ink-soft flex items-center gap-1 mt-0.5">
                  <Clock size={11} />
                  {formatOrderTime(order.created_at)}
                </p>
              </div>
              <OrderStatusBadge status={order.order_status} />
            </div>

            <div className="mb-3">
              {order.items?.map((item) => (
                <p key={item.id} className="text-xs text-ink-soft">
                  {item.quantity} × {item.product_name}
                </p>
              ))}
            </div>

            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-ink-soft">Total</span>
              <span className="text-sm font-semibold text-accent">₱{parseFloat(order.total).toFixed(0)}</span>
            </div>

            {order.order_status !== 'completed' && order.order_status !== 'cancelled' && (
              <OrderStatusProgress orderStatus={order.order_status} />
            )}
            {order.order_status === 'completed' && (
              <p className="text-xs text-ink-soft">Your order has been served. Enjoy!</p>
            )}
          </div>
        ))}
      </div>
    </>
  );

  // ---- CONFIRMATION SCREEN ----
  const renderConfirmation = () => (
    <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
      <div className="flex items-center justify-center rounded-full mb-4 w-16 h-16 bg-accent-soft">
        <Check size={28} className="text-accent" />
      </div>
      <h2 className="font-serif font-semibold text-[22px] text-ink">Order placed!</h2>
      <p className="text-sm mt-1 mb-6 text-ink-soft">
        Order #{confirmedOrder?.order_number ?? '…'} has been sent to the kitchen for Table {tableNumber}.
      </p>

      <div className="w-full mb-6">
        <OrderStatusProgress orderStatus={confirmedOrder?.order_status ?? 'received'} />
      </div>

      {confirmedOrder?.order_status === 'ready' && (
        <p className="text-sm font-medium mb-4 text-emerald-600">Your order is ready — it's on its way!</p>
      )}
      {confirmedOrder?.order_status === 'completed' && (
        <p className="text-sm font-medium mb-4 text-ink">Your order has been served. Enjoy!</p>
      )}
      {(!confirmedOrder || (confirmedOrder.order_status !== 'ready' && confirmedOrder.order_status !== 'completed')) && (
        <p className="text-xs mb-6 text-ink-soft">Estimated ready time: 15–20 minutes</p>
      )}

      <div className="flex flex-col gap-2 w-full max-w-[240px]">
        <button
          onClick={() => setScreen('my-orders')}
          className="rounded-xl px-6 py-3 text-sm font-semibold bg-bg-soft text-ink border border-line"
        >
          View my orders
        </button>
        <button
          onClick={() => { setScreen('menu'); setConfirmedOrderId(null); setPlacedOrderSnapshot(null); }}
          className="rounded-xl px-6 py-3 text-sm font-semibold bg-accent text-white"
        >
          Back to menu
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-bg-soft md:p-4">
      <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-bg md:mx-auto md:min-h-0 md:h-[calc(100vh-2rem)] md:max-h-[960px] md:max-w-5xl md:rounded-[28px] md:shadow-[0_24px_60px_-24px_rgba(0,0,0,0.25)]">
        {screen === 'menu' && renderMenu()}
        {screen === 'cart' && renderCart()}
        {screen === 'checkout' && renderCheckout()}
        {screen === 'confirmation' && renderConfirmation()}
        {screen === 'my-orders' && renderMyOrders()}
      </div>
    </div>
  );
}
