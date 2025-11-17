import { ShoppingCart } from 'lucide-react';
import Countdown from './Countdown';

interface StickerPacksProps {
  onSelectPackage: (pack: { name: string; price: number; stickers: number; productToCount: boolean; sku: string }) => void;
}

interface StickerPack {
  id: string;
  name: string;
  stickers: number;
  price: number;
  bonus: number;
  productToCount: boolean,
  carImage?: string;
  isPhysical?: boolean;
  description?: string;
  sku: string;
}

const packs: StickerPack[] = [
  {
    id: 'product-1',
    name: 'Наліпка',
    stickers: 1,
    price: 99,
    bonus: 0,
    productToCount: true,
    carImage: 'https://i.ibb.co/WpFZMtyM/2222.png',
    isPhysical: true,
    description: '6х7 см наліпка',
    sku: 'PRODUCT-001'
  },
  {
    id: 'product-2',
    name: 'Наліпки 5шт + 1шт (6шт)',
    stickers: 5,
    price: 495,
    bonus: 1,
    productToCount: true,
    carImage: 'https://i.ibb.co/WpFZMtyM/2222.png',
    isPhysical: true,
    description: '6х7 см наліпка',
    sku: 'PRODUCT-002'
  },
  {
    id: 'product-3',
    name: 'Наліпка',
    stickers: 1,
    price: 99,
    bonus: 0,
    productToCount: true,
    carImage: 'https://i.ibb.co/WpFZMtyM/2222.png',
    isPhysical: true,
    description: '6х7 см наліпка',
    sku: 'PRODUCT-003'
  },
  {
    id: 'product-4',
    name: 'Наліпка',
    stickers: 1,
    price: 99,
    bonus: 0,
    productToCount: true,
    carImage: 'https://i.ibb.co/WpFZMtyM/2222.png',
    isPhysical: true,
    description: '6х7 см наліпка',
    sku: 'PRODUCT-004'
  },
  {
    id: 'product-5',
    name: 'Наліпка',
    stickers: 1,
    price: 99,
    bonus: 0,
    productToCount: true,
    carImage: 'https://i.ibb.co/WpFZMtyM/2222.png',
    isPhysical: true,
    description: '6х7 см наліпка',
    sku: 'PRODUCT-005'
  },
  {
    id: 'product-6',
    name: 'Наліпка',
    stickers: 1,
    price: 99,
    bonus: 0,
    productToCount: true,
    carImage: 'https://i.ibb.co/WpFZMtyM/2222.png',
    isPhysical: true,
    description: '6х7 см наліпка',
    sku: 'PRODUCT-006'
  },
  {
    id: 'product-7',
    name: 'Наліпка',
    stickers: 1,
    price: 99,
    bonus: 0,
    productToCount: true,
    carImage: 'https://i.ibb.co/WpFZMtyM/2222.png',
    isPhysical: true,
    description: '6х7 см наліпка',
    sku: 'PRODUCT-007'
  },
  {
    id: 'product-8',
    name: 'Наліпка',
    stickers: 1,
    price: 99,
    bonus: 0,
    productToCount: true,
    carImage: 'https://i.ibb.co/WpFZMtyM/2222.png',
    isPhysical: true,
    description: '6х7 см наліпка',
    sku: 'PRODUCT-008'
  },
  {
    id: 'product-9',
    name: 'Наліпка',
    stickers: 1,
    price: 99,
    bonus: 5,
    productToCount: true,
    carImage: 'https://i.ibb.co/WpFZMtyM/2222.png',
    isPhysical: true,
    description: '6х7 см наліпка',
    sku: 'PRODUCT-009'
  },
  {
    id: 'product-10',
    name: 'Наліпка',
    stickers: 1,
    price: 99,
    bonus: 2,
    productToCount: true,
    carImage: 'https://i.ibb.co/WpFZMtyM/2222.png',
    isPhysical: true,
    description: '6х7 см наліпка',
    sku: 'PRODUCT-010'
  }
];

export default function StickerPacks({ onSelectPackage }: StickerPacksProps) {
  const handleBuyClick = (pack: StickerPack) => {
    const totalStickers = pack.stickers + pack.bonus;
    onSelectPackage({
      name: pack.name,
      price: pack.price,
      stickers: totalStickers,
      productToCount: pack.productToCount,
      sku: pack.sku
    });
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Наліпки AVTO DOM
          </h1>
          <p className="text-xl text-slate-300 mb-8">
            Стильні наліпки для вашого автомобіля
          </p>
          <div className="flex justify-center">
            <Countdown compact={true} />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 max-w-7xl mx-auto">
          {packs.map((pack) => (
            <div
              key={pack.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
            >
              <div className="aspect-square bg-gray-100 overflow-hidden">
                <img
                  src={pack.carImage || 'https://i.ibb.co/hJ5c22ps/image.png'}
                  alt={pack.name}
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                />
              </div>
              <div className="p-3 md:p-6">
                <h3 className="text-sm md:text-xl font-bold text-gray-900 mb-1 md:mb-2 line-clamp-2">{pack.name}</h3>
                {pack.description && (
                  <p className="text-gray-600 text-xs md:text-sm mb-2 md:mb-4 line-clamp-2">{pack.description}</p>
                )}
                <div className="flex flex-col gap-2">
                  <span className="text-lg md:text-2xl font-bold text-orange-600">{pack.price} грн</span>
                  <button
                    onClick={() => handleBuyClick(pack)}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-3 md:px-6 py-2 md:py-3 rounded-lg flex items-center justify-center gap-1 md:gap-2 transition-colors text-sm md:text-base w-full"
                  >
                    <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="hidden sm:inline">Замовити</span>
                    <span className="sm:hidden">Купити</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
