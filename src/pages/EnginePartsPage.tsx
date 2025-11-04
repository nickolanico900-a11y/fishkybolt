import { useRef, useState } from 'react';
import ProductCard from '../components/ProductCard';
import Contact from '../components/Contact';

const products = [
  {
    id: 1,
    name: 'Поршень 96350120',
    price: 2500,
    image: 'https://i.ibb.co/7NLNWhk7/7087601-17512889-TD668-Ad.jpg',
    description: 'Поршень 96350120',
    uktzed: '8409.91.00.00', // Частини для поршневих двигунів внутрішнього згоряння
    sku: 'PRODUCT-260'
  },
  {
    id: 2,
    name: 'Ремінь ГРМ 2431226050',
    price: 3800,
    image: 'https://i.ibb.co/x0HWHSw/6635995-2741823.jpg',
    description: 'Ремінь ГРМ 2431226050',
    uktzed: '8483.30.80.00', // Ремені передачі для двигунів
    sku: 'PRODUCT-250'
  },
  {
    id: 3,
    name: 'Комплект прокладок двигуна',
    price: 7950,
    image: 'https://i.ibb.co/Y7sCy05z/7100798-11478250-h-C3vi-MW.jpg',
    description: 'Комплект прокладок 015228001',
    uktzed: '8484.10.00.00', // Ущільнення та прокладки з металу або гуми
    sku: 'PRODUCT-240'
  },
  {
    id: 4,
    name: 'Водяна помпа',
    price: 3200,
    image: 'https://i.ibb.co/SDGD82pR/45-PZf-SXJc.jpg',
    description: 'Помпа водяна 538008810',
    uktzed: '8413.30.80.00', // Насоси для охолоджувальних рідин автомобілів
    sku: 'PRODUCT-230'
  },
  {
    id: 5,
    name: '2382 NGK Свічка запалювання',
    price: 180,
    image: 'https://i.ibb.co/8gxrhDBm/7658015-23708687.jpg',
    description: '2382 NGK Свічка запалювання',
    uktzed: '8511.10.00.00', // Свічки запалювання
    sku: 'PRODUCT-220'
  },
  {
    id: 6,
    name: 'K20TT Denso Свічка запалювання',
    price: 230,
    image: 'https://i.ibb.co/208Pk4zS/2025-01-05-14-31-23-18477071.jpg',
    description: 'K20TT Denso Свічка запалювання',
    uktzed: '8511.10.00.00', // Свічки запалювання
    sku: 'PRODUCT-210'
  }
];


export default function EnginePartsPage() {
  const contactRef = useRef<HTMLDivElement>(null);
  const [selectedPackage, setSelectedPackage] = useState<{
    name: string;
    price: number;
    stickers: number;
  } | null>(null);

  const handleOrder = (product: typeof products[0]) => {
    setSelectedPackage({
      name: product.name,
      price: product.price,
      stickers: 1
    });
    contactRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleClearPackage = () => {
    setSelectedPackage(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Двигун і деталі
          </h1>
          <p className="text-xl text-slate-300">
            Якісні запчастини для ремонту та обслуговування двигуна
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 max-w-7xl mx-auto">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              name={product.name}
              price={product.price}
              image={product.image}
              description={product.description}
              onOrder={() => handleOrder(product)}
            />
          ))}
        </div>
      </div>
      </div>
      <div ref={contactRef}>
        <Contact
          onOpenPrivacy={() => {}}
          onOpenOffer={() => {}}
          selectedPackage={selectedPackage}
          onClearPackage={handleClearPackage}
        />
      </div>
    </div>
  );
}
