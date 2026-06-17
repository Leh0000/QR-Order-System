const ADMIN_TABS = [
  { key: 'orders', label: 'Orders' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'qr', label: 'QR Codes' },
];

export default function AdminTabBar({ activeTab, onTabChange }) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {ADMIN_TABS.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => onTabChange(key)}
          className={`rounded-full px-4 py-2 text-sm font-semibold border transition-colors ${
            activeTab === key
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
