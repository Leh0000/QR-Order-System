import { useState, useEffect, useCallback } from 'react';

const FALLBACK_POLL_MS = 30000;

export function useTableOrders(tableNumber) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(() => {
    if (!tableNumber) return Promise.resolve();

    return fetch(`/api/orders?table_number=${tableNumber}`)
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error || `Server error ${r.status}`);
        setOrders(body.data ?? []);
        setError(null);
      })
      .catch((e) => setError(e.message || 'Could not fetch orders.'))
      .finally(() => setLoading(false));
  }, [tableNumber]);

  useEffect(() => {
    if (!tableNumber) return;

    fetchOrders();

    const es = new EventSource('/api/orders/events');
    es.addEventListener('orders_changed', () => {
      fetchOrders();
    });

    const fallbackId = setInterval(fetchOrders, FALLBACK_POLL_MS);

    return () => {
      es.close();
      clearInterval(fallbackId);
    };
  }, [tableNumber, fetchOrders]);

  return { orders, loading, error, refetch: fetchOrders };
}
