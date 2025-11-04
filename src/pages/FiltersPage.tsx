import { useRef, useState } from 'react';
import ProductCard from '../components/ProductCard';
import Contact from '../components/Contact';

const products = [
  {
    id: 1,
    name: 'Кришка паливного фільтра',
    price: 4820,
    image: 'https://i.ibb.co/CKYwdZrh/2021-30-04-07-45-53-8783772.jpg',
    description: 'Кришка фільтра паливного Бренд: Citroen/Peugeot',
    uktzed: '8421.99.00.00', // Частини до фільтрів
    sku: 'PRODUCT-310'
  },
  {
    id: 2,
    name: 'Корпус паливного фільтру',
    price: 2180,
    image: 'https://i.ibb.co/j9nF4xXf/2022-03-05-23-49-42-13282539.jpg',
    description: 'Корпус паливного фільтру Бренд: febi',
    uktzed: '8421.99.00.00', // Частини до фільтрів
    sku: 'PRODUCT-320'
  },
  {
    id: 3,
    name: 'W 811/80 Mann Оливний фільтр',
    price: 490,
    image: 'https://i.ibb.co/SwDM2bZk/45-Xe7-RGje.jpg',
    description: 'Фільтр масляний W 811/80 Mann',
    uktzed: '8421.23.00.00', // Фільтри для мастил
    sku: 'PRODUCT-330'
  },
  {
    id: 4,
    name: 'Elf Evolution Full-Tech FE 5W-30 (1 л) моторна олива',
    price: 680,
    image: 'https://i.ibb.co/6cMZ5QZ3/23609177-1.jpg',
    description: 'Elf Evolution Full-Tech FE 5W-30 (1 л) моторна олива',
    uktzed: '2710.19.81.00', // Моторні оливи
    sku: 'PRODUCT-340'
  },
  {
    id: 5,
    name: 'Фільтр АКПП',
    price: 2950,
    image: 'https://i.ibb.co/SXqHmQrZ/6659265-41388643.jpg',
    description: 'Фільтр АКПП',
    uktzed: '8421.23.00.00', // Фільтри для мастил трансмісії
    sku: 'PRODUCT-350'
  },
  {
    id: 6,
    name: 'General Motors Semi Synthetic 10W-40 (1 л) моторна олива',
    price: 350,
    image: 'https://i.ibb.co/mFt6gKty/21996366-1.jpg',
    description: 'General Motors Semi Synthetic 10W-40 (1 л) моторна олива',
    uktzed: '2710.19.81.00', // Моторні оливи
    sku: 'PRODUCT-360'
  },
  {
    id: 7,
    name: 'Standard червоний -24 °C, 0,85 л готовий антифриз',
    price: 135,
    image: 'https://i.ibb.co/4Zh0xrGP/34245428-1.jpg',
    description: 'Standard червоний -24 °C, 0,85 л готовий антифриз',
    uktzed: '3820.00.00.00', // Антифризи та готові рідини для охолодження
    sku: 'PRODUCT-370'
  },
  {
    id: 8,
    name: 'VIPOIL Profi 40 G12 червоний -30 °C, 5 л (701403) готовий антифриз',
    price: 510,
    image: 'https://i.ibb.co/yF4ydmWF/447890193.webp',
    description: 'VIPOIL Profi 40 G12 червоний -30 °C, 5 л (701403) готовий антифриз',
    uktzed: '3820.00.00.00', // Антифризи та готові рідини для охолодження
    sku: 'PRODUCT-380'
  }
];


export default function FiltersPage() {
  const contactRef = useRef<HTMLDivElement>(null);
  const [selectedPackage, setSelectedPackage] = useState<{
    name: string;
    price: number;
    stickers: number;
    sku: string;
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
            Фільтри
          </h1>
          <p className="text-xl text-slate-300">
            Чисте повітря та паливо для довговічності двигуна
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
