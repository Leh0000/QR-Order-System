import { Trophy } from 'lucide-react';
import CategoryIcon from './CategoryIcon';

export default function BestsellerSection({ items, onOpen }) {
  if (!items.length) return null;

  return (
    <section className="px-5 pt-4 flex-shrink-0">
      <div className="flex items-center gap-2 mb-3">
        <Trophy size={16} className="text-gold flex-shrink-0" />
        <h2 className="font-serif font-semibold text-[18px] text-ink">Best sellers</h2>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1 -mx-5 px-5 snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-3 md:overflow-visible md:mx-0 md:px-0 md:gap-4">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onOpen(item)}
            className="flex-shrink-0 w-[min(72vw,220px)] md:w-auto snap-start text-left rounded-2xl p-4 border border-line bg-bg-soft transition-colors hover:border-gold/50"
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center justify-center rounded-full w-10 h-10 bg-accent-soft flex-shrink-0">
                <CategoryIcon category={item.category} size={18} className="text-accent" />
              </div>
              {item.tag && (
                <span className="text-[10px] uppercase font-semibold rounded-full px-2 py-0.5 flex-shrink-0 bg-gold-soft text-gold tracking-[0.06em]">
                  {item.tag}
                </span>
              )}
            </div>

            <p className="font-semibold text-sm text-ink line-clamp-1">{item.name}</p>
            <p className="text-xs text-ink-soft mt-0.5 line-clamp-2 min-h-[2.5rem]">{item.description}</p>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-line">
              <span className="text-sm font-semibold text-accent">₱{Number(item.price).toFixed(0)}</span>
              <span className="text-[11px] text-ink-soft">
                {item.units_sold} ordered
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
