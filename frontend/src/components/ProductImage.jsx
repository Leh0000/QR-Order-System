import { useState } from 'react';
import CategoryIcon from './CategoryIcon';

const SIZES = {
  sm: { box: 'w-[46px] h-[46px]', icon: 20 },
  md: { box: 'w-10 h-10', icon: 18 },
  lg: { box: 'w-14 h-14', icon: 26 },
  hero: { box: 'w-full h-40', icon: 32, rounded: 'rounded-2xl' },
};

export default function ProductImage({ item, size = 'sm', className = '' }) {
  const [failed, setFailed] = useState(false);
  const { box, icon, rounded = 'rounded-full' } = SIZES[size] || SIZES.sm;
  const showImage = item.image_url && !failed;

  if (showImage) {
    return (
      <img
        src={item.image_url}
        alt={item.name}
        onError={() => setFailed(true)}
        className={`flex-shrink-0 object-cover ${box} ${rounded} ${className}`}
      />
    );
  }

  return (
    <div className={`flex items-center justify-center flex-shrink-0 bg-accent-soft ${box} ${rounded} ${className}`}>
      <CategoryIcon category={item.category} size={icon} className="text-accent" />
    </div>
  );
}
