import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, RefreshCw, QrCode, Trash2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { jsPDF } from 'jspdf';
import { useOrders } from '../hooks/useOrders';

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

function downloadQR(tableNumber) {
  const svg = document.getElementById(`qr-table-${tableNumber}`);
  if (!svg) return;

  const svgData = new XMLSerializer().serializeToString(svg);
  const canvas = document.createElement('canvas');
  const size = 300;
  canvas.width = size;
  canvas.height = size + 40;

  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const img = new Image();
  img.onload = () => {
    ctx.drawImage(img, 0, 0, size, size);
    ctx.fillStyle = '#1D1B18';
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Table ${tableNumber}`, size / 2, size + 28);

    const link = document.createElement('a');
    link.download = `table-${tableNumber}-qr.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };
  img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
}

function downloadAll(count) {
  const toImageDataUrl = (tableNumber) => new Promise((resolve, reject) => {
    const svg = document.getElementById(`qr-table-${tableNumber}`);
    if (!svg) {
      reject(new Error(`QR for table ${tableNumber} not found.`));
      return;
    }

    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 900;
      canvas.height = 900;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error(`Failed to render QR for table ${tableNumber}.`));
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  });

  (async () => {
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const qrSize = 320;
      const qrX = (pageWidth - qrSize) / 2;
      const qrY = 170;

      for (let i = 1; i <= count; i += 1) {
        if (i > 1) {
          pdf.addPage();
        }

        const imageDataUrl = await toImageDataUrl(i);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(26);
        pdf.text(`Table ${i}`, pageWidth / 2, 90, { align: 'center' });

        pdf.addImage(imageDataUrl, 'PNG', qrX, qrY, qrSize, qrSize, undefined, 'FAST');
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(12);
        pdf.text(`${window.location.origin}/order?table=${i}`, pageWidth / 2, qrY + qrSize + 34, { align: 'center' });
      }

      pdf.save(`table-qrs-1-to-${count}.pdf`);
    } catch (err) {
      alert('Failed to create PDF: ' + err.message);
    }
  })();
}

export default function AdminPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { orders, loading, error, refetch, updateOrder, deleteOrder } = useOrders(15000);
  const [updating, setUpdating] = useState({});
  const [deleting, setDeleting] = useState({});
  const [statusFilter, setStatusFilter] = useState('all');
  const [tableCount, setTableCount] = useState(10);
  const qrOpen = searchParams.get('tab') === 'qr';
  const baseUrl = `${window.location.origin}/order`;
  const tables = Array.from({ length: tableCount }, (_, i) => i + 1);

  const activeStatuses = ['received', 'preparing'];

  const filterOptions = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'ready', label: 'Ready' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  const filteredOrders = orders.filter((order) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return activeStatuses.includes(order.order_status);
    return order.order_status === statusFilter;
  });

  async function handleOrderStatusChange(orderId, value) {
    setUpdating((prev) => ({ ...prev, [`${orderId}-order_status`]: true }));
    try {
      await updateOrder(orderId, { order_status: value });
    } catch (e) {
      alert('Update failed: ' + e.message);
    } finally {
      setUpdating((prev) => ({ ...prev, [`${orderId}-order_status`]: false }));
    }
  }

  async function handleDelete(order) {
    const confirmed = window.confirm(
      `Delete order #${order.order_number} (Table ${order.table_number}, ₱${parseFloat(order.total).toFixed(0)})? This cannot be undone.`
    );
    if (!confirmed) return;

    setDeleting((prev) => ({ ...prev, [order.id]: true }));
    try {
      await deleteOrder(order.id);
    } catch (e) {
      alert('Delete failed: ' + e.message);
    } finally {
      setDeleting((prev) => ({ ...prev, [order.id]: false }));
    }
  }

  function formatTime(ts) {
    return new Date(ts).toLocaleString('en-PH', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  function toggleQrPanel() {
    const next = new URLSearchParams(searchParams);
    if (qrOpen) {
      next.delete('tab');
    } else {
      next.set('tab', 'qr');
    }
    setSearchParams(next, { replace: true });
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
            <button
              type="button"
              onClick={toggleQrPanel}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold bg-accent text-white"
            >
              <QrCode size={15} />
              {qrOpen ? 'Hide QR Codes' : 'QR Codes'}
            </button>
          </div>
        </div>

        {/* Stats */}
        {!loading && !error && <StatsBar orders={orders} />}

        {qrOpen && (
          <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-line">
            <div className="flex items-center justify-between gap-4 flex-wrap mb-5">
              <div>
                <h2 className="font-semibold text-ink">QR Codes</h2>
                <p className="text-xs text-ink-soft mt-0.5">
                  Generate and download QR codes for each table.
                </p>
              </div>

              <button
                type="button"
                onClick={() => downloadAll(tableCount)}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold bg-accent text-white"
              >
                <Download size={16} />
                Download PDF ({tableCount})
              </button>
            </div>

            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <span className="text-sm font-medium text-ink">Tables: {tableCount}</span>
              <button
                type="button"
                onClick={() => setTableCount((prev) => Math.max(1, prev - 1))}
                disabled={tableCount <= 1}
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Remove Table
              </button>
              <button
                type="button"
                onClick={() => setTableCount((prev) => Math.min(50, prev + 1))}
                disabled={tableCount >= 50}
                className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add Table
              </button>
            </div>

            <p className="text-xs text-ink-soft mb-5">
              QR codes link to: <code className="bg-bg-soft px-1.5 py-0.5 rounded text-accent">{baseUrl}?table=N</code>
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {tables.map((n) => (
                <div key={n} className="bg-bg rounded-2xl p-4 flex flex-col items-center gap-3 shadow-sm border border-line">
                  <p className="text-sm font-semibold text-ink">Table {n}</p>
                  <div className="p-2 bg-white rounded-xl">
                    <QRCodeSVG
                      id={`qr-table-${n}`}
                      value={`${baseUrl}?table=${n}`}
                      size={120}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                  <a
                    href={`${baseUrl}?table=${n}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full rounded-lg border border-line px-2 py-1.5 text-xs font-medium text-center text-accent hover:bg-bg-soft transition-colors break-all"
                  >
                    Open Table {n} Link
                  </a>
                  <button
                    type="button"
                    onClick={() => downloadQR(n)}
                    className="flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent/80 transition-colors"
                  >
                    <Download size={13} />
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading / Error */}
        {loading && <div className="text-center py-12 text-ink-soft">Loading orders…</div>}
        {error && <div className="text-center py-12 text-red-400">{error}</div>}

        {/* Orders board */}
        {!loading && !error && (
          <div className="bg-white rounded-2xl border border-line overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-line">
              <h2 className="font-semibold text-ink">Orders Board</h2>
              <p className="text-xs text-ink-soft mt-0.5">Auto-refreshes every 15 seconds</p>

              <div className="mt-3 flex flex-wrap gap-2">
                {filterOptions.map((filter) => (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => setStatusFilter(filter.key)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors ${
                      statusFilter === filter.key
                        ? 'bg-accent text-white border-accent'
                        : 'bg-white text-ink-soft border-line hover:bg-bg-soft'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {orders.length === 0 ? (
              <div className="py-16 text-center text-ink-soft text-sm">No orders yet.</div>
            ) : filteredOrders.length === 0 ? (
              <div className="py-16 text-center text-ink-soft text-sm">No orders for this filter.</div>
            ) : (
              <div className="p-4 sm:p-6">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredOrders.map((order) => (
                    <article key={order.id} className="rounded-xl border border-line bg-bg-soft p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold text-ink">#{order.order_number}</p>
                          <p className="text-xs text-ink-soft mt-0.5">Table {order.table_number} - {formatTime(order.created_at)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDelete(order)}
                          disabled={deleting[order.id]}
                          title="Delete order"
                          className="inline-flex items-center justify-center rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <StatusBadge value={order.payment_status} colorMap={PAYMENT_COLORS} />
                        <select
                          value={order.order_status}
                          disabled={updating[`${order.id}-order_status`]}
                          onChange={(e) => handleOrderStatusChange(order.id, e.target.value)}
                          className={`rounded-lg px-2 py-1 text-xs font-semibold border-0 outline-none cursor-pointer ${ORDER_COLORS[order.order_status] || 'bg-gray-100 text-gray-500'}`}
                        >
                          {ORDER_STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>

                      <div className="mt-4 rounded-lg bg-white border border-line p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft mb-2">Items</p>
                        <ul className="space-y-1.5">
                          {(order.items || []).map((item) => (
                            <li key={item.id} className="flex items-start justify-between gap-3 text-sm">
                              <span className="text-ink">
                                {item.quantity}x {item.product_name}
                              </span>
                              <span className="text-ink-soft whitespace-nowrap">₱{parseFloat(item.line_total).toFixed(0)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {order.notes?.trim() && (
                        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-1">Kitchen note</p>
                          <p className="text-sm text-amber-900">{order.notes}</p>
                        </div>
                      )}

                      <div className="mt-4 pt-3 border-t border-line space-y-1 text-sm">
                        <div className="flex items-center justify-between text-ink-soft">
                          <span>Subtotal</span>
                          <span>₱{parseFloat(order.subtotal).toFixed(0)}</span>
                        </div>
                        <div className="flex items-center justify-between text-ink-soft">
                          <span>Tax</span>
                          <span>₱{parseFloat(order.tax).toFixed(0)}</span>
                        </div>
                        <div className="flex items-center justify-between font-semibold text-accent">
                          <span>Total</span>
                          <span>₱{parseFloat(order.total).toFixed(0)}</span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
