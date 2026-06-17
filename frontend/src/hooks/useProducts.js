import { useState, useEffect } from 'react';

const CATEGORY_ORDER = ['Appetizers', 'Main Dish', 'Desserts', 'Drinks'];
const BESTSELLER_LIMIT = 3;

function enrichProducts(data) {
  const withCounts = data.map((p) => ({
    ...p,
    units_sold: Number(p.units_sold) || 0,
  }));
  const maxSold = Math.max(0, ...withCounts.map((p) => p.units_sold));
  const products = withCounts.map((p) => ({
    ...p,
    tag: maxSold > 0 && p.units_sold === maxSold ? 'Best seller' : undefined,
  }));
  const bestsellers = [...withCounts]
    .filter((p) => p.units_sold > 0)
    .sort((a, b) => b.units_sold - a.units_sold)
    .slice(0, BESTSELLER_LIMIT)
    .map((p) => products.find((item) => item.id === p.id));
  return { products, bestsellers };
}

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [bestsellers, setBestsellers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/products')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(({ data }) => {
        if (!Array.isArray(data)) throw new Error('Invalid menu data');
        const { products: enriched, bestsellers: top } = enrichProducts(data);
        setProducts(enriched);
        setBestsellers(top);
        const seen = new Set();
        const cats = [];
        for (const p of enriched) {
          if (!seen.has(p.category)) {
            seen.add(p.category);
            cats.push(p.category);
          }
        }
        cats.sort((a, b) => {
          const ai = CATEGORY_ORDER.indexOf(a);
          const bi = CATEGORY_ORDER.indexOf(b);
          return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
        });
        setCategories(cats);
      })
      .catch(() => setError('Could not load menu. Please refresh.'))
      .finally(() => setLoading(false));
  }, []);

  return { products, bestsellers, categories, loading, error };
}
