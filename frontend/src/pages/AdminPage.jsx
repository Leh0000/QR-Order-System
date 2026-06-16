import { useState } from 'react';
import { RefreshCw, QrCode } from 'lucide-react';
import { useOrders } from '../hooks/useOrders';

const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];
const ORDER_STATUSES = ['received', 'preparing', 'ready', 'completed', 'cancelled'];

const PAYMENT_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-600',
  refunded: 'bg-purple-100 text-purple-700',
};
const ORDER_COLORS = {
  received: 'bg-blue-100 text-blue-700',
  preparing: 'bg-orange-100 text-orange-700',
  ready: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-500',
};

function StatusBadge({ value, colorMap }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${colorMap[value] || 'bg-gray-100 text-gray-500'}`}>
      {value}
    </span>
  );
}

function StatsBar({ orders }) {
  const today = new Date().toDateString();
  const todayOrders = orders.filter((o) => new Date(o.created_at).toDateString() === today);
  const pending = orders.filter((o) => o.order_status !== 'completed' && o.order_status !== 'cancelled').length;
  const completed = orders.filter((o) => o.order_status === 'completed').length;
  const revenue = orders
    .filter((o) => o.payment_status === 'paid')
    .reduce((sum, o) => sum + parseFloat(o.total), 0);

  const stats = [
    { label: "Today's orders", value: todayOrders.length },
    { label: 'Active', value: pending },
    { label: 'Completed', value: completed },
    { label: 'Revenue (paid)', value: `₱${revenue.toFixed(0)}` },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map(({ label, value }) => (
        <div key={label} className="bg-white rounded-2xl p-4 border border-line">
          <p className="text-xs text-ink-soft mb-1">{label}</p>
          <p className="text-2xl font-bold text-ink">{value}</p>
        </div>
      ))}
    </div>
  );
}

export default function AdminPage() {
  const { orders, loading, error, refetch, updateOrder } = useOrders(15000);
  const [updating, setUpdating] = useState({});

  async function handleStatusChange(orderId, field, value) {
    setUpdating((prev) => ({ ...prev, [`${orderId}-${field}`]: true }));
    try {
      await updateOrder(orderId, { [field]: value });
    } catch (e) {
      alert('Update failed: ' + e.message);
    } finally {
      setUpdating((prev) => ({ ...prev, [`${orderId}-${field}`]: false }));
    }
  }

  function formatTime(ts) {
    return new Date(ts).toLocaleString('en-PH', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  return (
    <div className="min-h-screen bg-bg-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif font-semibold text-2xl text-ink">Admin Dashboard</h1>
            <p className="text-sm text-ink-soft mt-0.5">Olive &amp; Oak — Order Management</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={refetch}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium border border-line bg-white text-ink hover:bg-bg-soft transition-colors"
            >
              <RefreshCw size={15} />
              Refresh
            </button>
            <a
              href="/qr-generator"
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold bg-accent text-white"
            >
              <QrCode size={15} />
              QR Codes
            </a>
          </div>
        </div>

        {/* Stats */}
        {!loading && !error && <StatsBar orders={orders} />}

        {/* Loading / Error */}
        {loading && <div className="text-center py-12 text-ink-soft">Loading orders…</div>}
        {error && <div className="text-center py-12 text-red-400">{error}</div>}

        {/* Orders table */}
        {!loading && !error && (
          <div className="bg-white rounded-2xl border border-line overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-line">
              <h2 className="font-semibold text-ink">All Orders</h2>
              <p className="text-xs text-ink-soft mt-0.5">Auto-refreshes every 15 seconds</p>
            </div>

            {orders.length === 0 ? (
              <div className="py-16 text-center text-ink-soft text-sm">No orders yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-bg-soft border-b border-line text-xs text-ink-soft uppercase tracking-wide">
                      <th className="px-4 py-3 text-left">Order</th>
                      <th className="px-4 py-3 text-left">Table</th>
                      <th className="px-4 py-3 text-left">Items</th>
                      <th className="px-4 py-3 text-right">Subtotal</th>
                      <th className="px-4 py-3 text-right">Tax</th>
                      <th className="px-4 py-3 text-right">Total</th>
                      <th className="px-4 py-3 text-left">Payment</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-bg-soft/60 transition-colors">
                        <td className="px-4 py-3 font-semibold text-ink">#{order.id}</td>
                        <td className="px-4 py-3 text-ink">Table {order.table_number}</td>
                        <td className="px-4 py-3 text-ink-soft max-w-[200px]">
                          <details className="cursor-pointer">
                            <summary className="text-xs font-medium text-accent outline-none">
                              {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                            </summary>
                            <ul className="mt-1 space-y-0.5">
                              {(order.items || []).map((item) => (
                                <li key={item.id} className="text-xs text-ink-soft">
                                  {item.quantity}× {item.product_name} — ₱{parseFloat(item.line_total).toFixed(0)}
                                </li>
                              ))}
                            </ul>
                          </details>
                        </td>
                        <td className="px-4 py-3 text-right text-ink">₱{parseFloat(order.subtotal).toFixed(0)}</td>
                        <td className="px-4 py-3 text-right text-ink-soft">₱{parseFloat(order.tax).toFixed(0)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-accent">₱{parseFloat(order.total).toFixed(0)}</td>
                        <td className="px-4 py-3">
                          <select
                            value={order.payment_status}
                            disabled={updating[`${order.id}-payment_status`]}
                            onChange={(e) => handleStatusChange(order.id, 'payment_status', e.target.value)}
                            className={`rounded-lg px-2 py-1 text-xs font-semibold border-0 outline-none cursor-pointer ${PAYMENT_COLORS[order.payment_status] || 'bg-gray-100 text-gray-500'}`}
                          >
                            {PAYMENT_STATUSES.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={order.order_status}
                            disabled={updating[`${order.id}-order_status`]}
                            onChange={(e) => handleStatusChange(order.id, 'order_status', e.target.value)}
                            className={`rounded-lg px-2 py-1 text-xs font-semibold border-0 outline-none cursor-pointer ${ORDER_COLORS[order.order_status] || 'bg-gray-100 text-gray-500'}`}
                          >
                            {ORDER_STATUSES.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-xs text-ink-soft whitespace-nowrap">{formatTime(order.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
