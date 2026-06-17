import { filterOrdersByPeriod, getPeriodStart } from './periodUtils';

export function filterAnalyticsOrders(orders, period) {
  return filterOrdersByPeriod(orders, period).filter(
    (o) => o.payment_status === 'paid' && o.order_status !== 'cancelled'
  );
}

function formatHour(h) {
  if (h === 0) return '12 AM';
  if (h < 12) return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
}

function formatDayLabel(date, period) {
  if (period === 'week') {
    return date.toLocaleDateString('en-PH', { weekday: 'short' });
  }
  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getWeekStartKey(date) {
  const d = new Date(date);
  const day = d.getDay();
  const daysFromMonday = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - daysFromMonday);
  return toDateKey(d);
}

export function aggregateTopItems(orders, sortBy = 'revenue', limit = 10) {
  const map = new Map();

  for (const order of orders) {
    for (const item of order.items || []) {
      const existing = map.get(item.product_id) || {
        product_id: item.product_id,
        name: item.product_name,
        revenue: 0,
        quantity: 0,
      };
      existing.revenue += parseFloat(item.line_total);
      existing.quantity += item.quantity;
      map.set(item.product_id, existing);
    }
  }

  const items = [...map.values()];
  items.sort((a, b) => (sortBy === 'revenue' ? b.revenue - a.revenue : b.quantity - a.quantity));
  return items.slice(0, limit);
}

export function aggregateByCategory(orders, productCategoryMap) {
  const map = new Map();

  for (const order of orders) {
    for (const item of order.items || []) {
      const category = productCategoryMap.get(item.product_id) || 'Unknown';
      const existing = map.get(category) || { category, revenue: 0, quantity: 0 };
      existing.revenue += parseFloat(item.line_total);
      existing.quantity += item.quantity;
      map.set(category, existing);
    }
  }

  return [...map.values()].sort((a, b) => b.revenue - a.revenue);
}

export function aggregatePeakHours(orders) {
  const hours = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    label: formatHour(hour),
    orders: 0,
    revenue: 0,
  }));

  for (const order of orders) {
    const h = new Date(order.created_at).getHours();
    hours[h].orders += 1;
    hours[h].revenue += parseFloat(order.total);
  }

  return hours;
}

function fillDailyBuckets(period) {
  const start = getPeriodStart(period);
  const now = new Date();
  const bucketMap = new Map();

  if (!start) return bucketMap;

  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(0, 0, 0, 0);

  while (cursor <= end) {
    const key = toDateKey(cursor);
    bucketMap.set(key, {
      key,
      label: formatDayLabel(cursor, period),
      revenue: 0,
      orders: 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return bucketMap;
}

function aggregateDailyBuckets(orders, period) {
  const bucketMap = fillDailyBuckets(period);

  for (const order of orders) {
    const key = toDateKey(new Date(order.created_at));
    const bucket = bucketMap.get(key) || {
      key,
      label: formatDayLabel(new Date(order.created_at), period),
      revenue: 0,
      orders: 0,
    };
    bucket.revenue += parseFloat(order.total);
    bucket.orders += 1;
    bucketMap.set(key, bucket);
  }

  return [...bucketMap.values()].sort((a, b) => a.key.localeCompare(b.key));
}

function aggregateWeeklyBuckets(orders) {
  const bucketMap = new Map();

  for (const order of orders) {
    const date = new Date(order.created_at);
    const key = getWeekStartKey(date);
    const weekStart = new Date(key);
    const bucket = bucketMap.get(key) || {
      key,
      label: weekStart.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }),
      revenue: 0,
      orders: 0,
    };
    bucket.revenue += parseFloat(order.total);
    bucket.orders += 1;
    bucketMap.set(key, bucket);
  }

  return [...bucketMap.values()].sort((a, b) => a.key.localeCompare(b.key));
}

export function aggregateRevenueOverTime(orders, period) {
  if (period === 'today') {
    const buckets = Array.from({ length: 24 }, (_, hour) => ({
      key: String(hour),
      label: formatHour(hour),
      revenue: 0,
      orders: 0,
    }));

    for (const order of orders) {
      const h = new Date(order.created_at).getHours();
      buckets[h].revenue += parseFloat(order.total);
      buckets[h].orders += 1;
    }

    return buckets;
  }

  if (period === 'all') {
    const uniqueDays = new Set(orders.map((o) => toDateKey(new Date(o.created_at))));
    if (uniqueDays.size > 90) {
      return aggregateWeeklyBuckets(orders);
    }

    const bucketMap = new Map();
    for (const order of orders) {
      const date = new Date(order.created_at);
      const key = toDateKey(date);
      const bucket = bucketMap.get(key) || {
        key,
        label: formatDayLabel(date, 'month'),
        revenue: 0,
        orders: 0,
      };
      bucket.revenue += parseFloat(order.total);
      bucket.orders += 1;
      bucketMap.set(key, bucket);
    }
    return [...bucketMap.values()].sort((a, b) => a.key.localeCompare(b.key));
  }

  return aggregateDailyBuckets(orders, period);
}

export function summarizeAnalytics(orders) {
  const revenue = orders.reduce((sum, o) => sum + parseFloat(o.total), 0);
  const count = orders.length;
  return {
    revenue,
    orders: count,
    avgOrderValue: count > 0 ? revenue / count : 0,
  };
}
