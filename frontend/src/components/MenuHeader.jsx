import { MapPin } from 'lucide-react';

export default function MenuHeader({ tableNumber }) {
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
        <div className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium flex-shrink-0 bg-accent-soft text-accent">
          <MapPin size={13} />
          <span>Table {tableNumber}</span>
        </div>
      </div>
    </div>
  );
}
