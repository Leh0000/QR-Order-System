export default function CategoryTabs({ categories, activeCategory, onSelect }) {
  return (
    <div className="flex gap-2 px-5 py-3 overflow-x-auto flex-shrink-0 border-b border-line">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            activeCategory === cat
              ? 'bg-accent text-white'
              : 'bg-bg-soft text-ink'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
