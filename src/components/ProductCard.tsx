import { ShoppingCart } from 'lucide-react';

interface ProductCardProps {
  name: string;
  price: number;
  image: string;
  description?: string;
  onOrder: () => void;
}

export default function ProductCard({ name, price, image, description, onOrder }: ProductCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
      <div className="aspect-square bg-gray-100 overflow-hidden">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
        />
      </div>
      <div className="p-3 md:p-6">
        <h3 className="text-sm md:text-xl font-bold text-gray-900 mb-1 md:mb-2 line-clamp-2">{name}</h3>
        {description && (
          <p className="text-gray-600 text-xs md:text-sm mb-2 md:mb-4 line-clamp-2">{description}</p>
        )}
        <div className="flex flex-col gap-2">
          <span className="text-lg md:text-2xl font-bold text-orange-600">{price} грн</span>
          <button
            onClick={onOrder}
            className="bg-orange-600 hover:bg-orange-700 text-white px-3 md:px-6 py-2 md:py-3 rounded-lg flex items-center justify-center gap-1 md:gap-2 transition-colors text-sm md:text-base w-full"
          >
            <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">Замовити</span>
            <span className="sm:hidden">Купити</span>
          </button>
        </div>
      </div>
    </div>
  );
}
