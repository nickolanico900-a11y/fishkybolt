import { useRef, useState } from 'react';
import ProductCard from '../components/ProductCard';
import Contact from '../components/Contact';

const products = [
  {
    id: 1,
    name: 'Круїз-контроль 5K0054690E',
    price: 12500,
    image: 'https://i.ibb.co/QF9rJs8n/6569942-24916536-REd-N9-SF.jpg',
    description: 'Круїз-контроль 5K0054690E Бренд: VAG',
    uktzed: '8708.99.97.90', // Частини та приладдя до систем управління автомобілем
    sku: 'PRODUCT-110'
  },
  {
    id: 2,
    name: 'Стартер BN3610022805',
    price: 7200,
    image: 'https://i.ibb.co/MkvpZ6nm/7333530-10530490-FKm-Qxqw.jpg',
    description: 'Стартер BN3610022805',
    uktzed: '8511.40.00.90', // Стартери для двигунів внутрішнього згоряння,
    sku: 'PRODUCT-120'
  },
  {
    id: 3,
    name: 'Генератор 3730022650',
    price: 16800,
    image: 'https://i.ibb.co/1tVfHcTC/7337167-1531384-0s-B0f0-X.jpg',
    description: 'Генератор Hyundai/Kia',
    uktzed: '8511.50.00.90' // Генератори для двигунів внутрішнього згоряння
  },
  {
    id: 4,
    name: 'Реле кондиціонера 4RA933332541',
    price: 450,
    image: 'https://i.ibb.co/5hJ8tGFm/2022-21-01-22-18-59-9688302.jpg',
    description: 'Реле кондиціонера Бренд: Hella',
    uktzed: '8536.41.90.00' // Реле для напруги ≤ 60 В
  }
];


export default function ElectricalPage() {
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
            Електрика
          </h1>
          <p className="text-xl text-slate-300">
            Надійне електрообладнання для вашого автомобіля
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
