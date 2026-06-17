import { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  ComposedChart,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { STATS_PERIODS } from '../utils/periodUtils';
import {
  filterAnalyticsOrders,
  aggregateTopItems,
  aggregateByCategory,
  aggregatePeakHours,
  aggregateRevenueOverTime,
  summarizeAnalytics,
} from '../utils/analyticsUtils';

const CHART_COLORS = ['#3F5A44', '#B8893A', '#6B8E6F', '#D4A84B', '#9A958D', '#5C7A61', '#C9A227', '#8FA892'];

function ChartCard({ title, subtitle, children, tall }) {
  return (
    <div className="bg-white rounded-2xl border border-line p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="font-semibold text-ink">{title}</h3>
        {subtitle && <p className="text-xs text-ink-soft mt-0.5">{subtitle}</p>}
      </div>
      <div className={tall ? 'h-80' : 'h-72'}>{children}</div>
    </div>
  );
}

function PeriodPicker({ period, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      {STATS_PERIODS.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors ${
            period === key
              ? 'bg-accent text-white border-accent'
              : 'bg-white text-ink-soft border-line hover:bg-bg-soft'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function formatPeso(value) {
  return `₱${Math.round(value).toLocaleString('en-PH')}`;
}

function AnalyticsTooltip({ active, payload, label, valueFormatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-white px-3 py-2 text-xs shadow-sm">
      <p className="font-semibold text-ink mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }} className="text-ink-soft">
          {entry.name}: {valueFormatter ? valueFormatter(entry.value, entry.name) : entry.value}
        </p>
      ))}
    </div>
  );
}

export default function AnalyticsTab({ orders, products }) {
  const [period, setPeriod] = useState('today');

  const productCategoryMap = useMemo(() => {
    const map = new Map();
    for (const p of products) {
      map.set(p.id, p.category);
    }
    return map;
  }, [products]);

  const analyticsOrders = useMemo(
    () => filterAnalyticsOrders(orders, period),
    [orders, period]
  );

  const summary = useMemo(() => summarizeAnalytics(analyticsOrders), [analyticsOrders]);
  const topByRevenue = useMemo(
    () => aggregateTopItems(analyticsOrders, 'revenue'),
    [analyticsOrders]
  );
  const topByQuantity = useMemo(
    () => aggregateTopItems(analyticsOrders, 'quantity'),
    [analyticsOrders]
  );
  const byCategory = useMemo(
    () => aggregateByCategory(analyticsOrders, productCategoryMap),
    [analyticsOrders, productCategoryMap]
  );
  const peakHours = useMemo(() => aggregatePeakHours(analyticsOrders), [analyticsOrders]);
  const revenueOverTime = useMemo(
    () => aggregateRevenueOverTime(analyticsOrders, period),
    [analyticsOrders, period]
  );

  const hasData = analyticsOrders.length > 0;

  const kpis = [
    { label: 'Revenue', value: formatPeso(summary.revenue) },
    { label: 'Orders', value: summary.orders },
    { label: 'Avg order value', value: formatPeso(summary.avgOrderValue) },
  ];

  return (
    <div>
      <div className="mb-2">
        <h2 className="font-semibold text-ink">Analytics</h2>
        <p className="text-xs text-ink-soft mt-0.5">
          Paid orders only, excluding cancelled
        </p>
      </div>

      <PeriodPicker period={period} onChange={setPeriod} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {kpis.map(({ label, value }) => (
          <div key={label} className="bg-white rounded-2xl p-4 border border-line">
            <p className="text-xs text-ink-soft mb-1">{label}</p>
            <p className="text-2xl font-bold text-ink">{value}</p>
          </div>
        ))}
      </div>

      {!hasData ? (
        <div className="bg-white rounded-2xl border border-line py-16 text-center text-ink-soft text-sm">
          No paid orders in this period.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard title="Top items by revenue" subtitle="Best earners for this period">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topByRevenue} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EAE7E1" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => `₱${v}`} tick={{ fontSize: 11, fill: '#9A958D' }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  tick={{ fontSize: 11, fill: '#1D1B18' }}
                  tickFormatter={(v) => (v.length > 14 ? `${v.slice(0, 14)}…` : v)}
                />
                <Tooltip content={<AnalyticsTooltip valueFormatter={formatPeso} />} />
                <Bar dataKey="revenue" name="Revenue" fill="#3F5A44" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Top items by quantity" subtitle="Most ordered dishes">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topByQuantity} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EAE7E1" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#9A958D' }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  tick={{ fontSize: 11, fill: '#1D1B18' }}
                  tickFormatter={(v) => (v.length > 14 ? `${v.slice(0, 14)}…` : v)}
                />
                <Tooltip content={<AnalyticsTooltip />} />
                <Bar dataKey="quantity" name="Units sold" fill="#B8893A" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Revenue over time"
            subtitle={period === 'today' ? 'By hour' : period === 'all' ? 'By day or week' : 'By day'}
            tall
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueOverTime} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EAE7E1" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9A958D' }} interval="preserveStartEnd" />
                <YAxis tickFormatter={(v) => `₱${v}`} tick={{ fontSize: 11, fill: '#9A958D' }} width={56} />
                <Tooltip content={<AnalyticsTooltip valueFormatter={formatPeso} />} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#3F5A44"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#3F5A44' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Revenue by category" subtitle="Share of sales by menu section">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={byCategory}
                  dataKey="revenue"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {byCategory.map((entry, i) => (
                    <Cell key={entry.category} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatPeso(value)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Peak hours"
            subtitle="Order count (bars) and revenue (line) by hour of day"
            tall
          >
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={peakHours} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EAE7E1" />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#9A958D' }} interval={2} />
                <YAxis
                  yAxisId="orders"
                  tick={{ fontSize: 11, fill: '#9A958D' }}
                  width={32}
                  allowDecimals={false}
                />
                <YAxis
                  yAxisId="revenue"
                  orientation="right"
                  tickFormatter={(v) => `₱${v}`}
                  tick={{ fontSize: 11, fill: '#9A958D' }}
                  width={56}
                />
                <Tooltip
                  content={(
                    <AnalyticsTooltip
                      valueFormatter={(value, name) =>
                        name === 'Revenue' ? formatPeso(value) : value
                      }
                    />
                  )}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar yAxisId="orders" dataKey="orders" name="Orders" fill="#3F5A44" radius={[4, 4, 0, 0]} />
                <Line
                  yAxisId="revenue"
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#B8893A"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}
    </div>
  );
}
