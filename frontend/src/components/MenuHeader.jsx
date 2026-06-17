import { MapPin, ClipboardList } from 'lucide-react';

export default function MenuHeader({ tableNumber, onMyOrders, activeOrderCount = 0 }) {
  return (
    <div className="px-5 pt-5 pb-3 flex-shrink-0 border-b border-line">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.15em] mb-1 text-ink-soft">
            Scan &amp; Order
          </p>
          <h1 className="font-serif font-semibold italic text-[26px] leading-tight text-ink">
            Olive &amp; Oak
          </h1>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {onMyOrders && (
            <button
              onClick={onMyOrders}
              className="relative flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium bg-bg-soft text-ink"
            >
              <ClipboardList size={13} />
              <span>My orders</span>
              {activeOrderCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center rounded-full w-4 h-4 text-[10px] font-bold bg-accent text-white">
                  {activeOrderCount}
                </span>
              )}
            </button>
          )}
          <div className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium bg-accent-soft text-accent">
            <MapPin size={13} />
            <span>Table {tableNumber}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
