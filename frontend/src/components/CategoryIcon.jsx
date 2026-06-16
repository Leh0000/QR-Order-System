import { Soup, Drumstick, IceCreamCone, CupSoda, UtensilsCrossed } from 'lucide-react';

const MAP = {
  Appetizers: Soup,
  'Main Dish': Drumstick,
  Desserts: IceCreamCone,
  Drinks: CupSoda,
};

export default function CategoryIcon({ category, size = 20, className = '' }) {
  const Icon = MAP[category] || UtensilsCrossed;
  return <Icon size={size} className={className} />;
}
