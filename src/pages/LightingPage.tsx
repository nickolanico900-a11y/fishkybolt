import { useRef, useState } from 'react';
import ProductCard from '../components/ProductCard';
import Contact from '../components/Contact';

const products = [
  {
    id: 1,
    name: 'Лампа галогенна Philips H7',
    price: 378,
    image: 'https://i.ibb.co/pjg3f5jB/2023-30-08-12-32-11-15159010.jpg',
    description: '12972PRB1 Philips H7 Лампа дальнього світла'
  },
  {
    id: 2,
    name: 'Лампа галогенна Philips H4',
    price: 385,
    image: 'https://i.ibb.co/pjzQV0WK/2023-20-02-16-00-07-5355853.jpg',
    description: 'Лампа галогенна Philips Vision +30% 12В H4 60/55Вт +30%'
  },
  {
    id: 3,
    name: 'Кришка фари',
    price: 860,
    image: 'https://i.ibb.co/0jnF3sjF/2021-26-11-13-01-11-9490152.jpg',
    description: 'Кришка фари Hyundai/Kia'
  },
  {
    id: 4,
    name: 'Лампа галогенна Osram',
    price: 430,
    image: 'https://i.ibb.co/0yk906ZY/2023-30-08-12-34-42-15159751.jpg',
    description: 'Лампа галогенна Osram Original 12В H11 55Вт'
  },
  {
    id: 5,
    name: 'Фара протитуманна',
    price: 650,
    image: 'https://i.ibb.co/R4bTDWY7/4709998.jpg',
    description: 'Фара протитуманна Тип ламп:H11'
  }
];

export default function LightingPage() {
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
            Освітлення
          </h1>
          <p className="text-xl text-slate-300">
            Якісне освітлення для безпеки та стилю
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
