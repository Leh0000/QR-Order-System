import { useState, useEffect } from 'react';

const CATEGORY_ORDER = ['Appetizers', 'Main Dish', 'Desserts', 'Drinks'];

export function useProducts() {
  const [products, setProducts] = useState([]);
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
        setProducts(data);
        const seen = new Set();
        const cats = [];
        for (const p of data) {
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

  return { products, categories, loading, error };
}
