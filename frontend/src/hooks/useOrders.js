import { useState, useEffect, useCallback } from 'react';

export function useOrders(refreshInterval = 15000) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(() => {
    fetch('/api/orders')
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error || `Server error ${r.status}`);
        setOrders(body.data ?? []);
        setError(null);
      })
      .catch((e) => setError(e.message || 'Could not fetch orders.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchOrders();
    const id = setInterval(fetchOrders, refreshInterval);
    return () => clearInterval(id);
  }, [fetchOrders, refreshInterval]);

  async function updateOrder(id, payload) {
    const res = await fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error || 'Update failed');
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, ...body.data } : o))
    );
    return body.data;
  }

  async function deleteOrder(id) {
    const res = await fetch(`/api/orders/${id}`, { method: 'DELETE' });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error || 'Delete failed');
    await fetchOrders();
    return body.data;
  }

  return { orders, loading, error, refetch: fetchOrders, updateOrder, deleteOrder };
}
