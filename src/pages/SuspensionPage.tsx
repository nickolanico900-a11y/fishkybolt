import { useRef, useState } from 'react';
import ProductCard from '../components/ProductCard';
import Contact from '../components/Contact';

const products = [
  {
    id: 1,
    name: 'C2W001ABE ABE Гальмівні колодки',
    price: 890,
    image: 'https://i.ibb.co/kTdYnrw/7609798-10239076-l-KQch-XR.jpg',
    description: 'C2W001ABE ABE Гальмівні колодки',
    uktzed: '8708.30.10.00', // Гальмівні колодки для транспортних засобів
    sku: 'PRODUCT-510'
  },
  {
    id: 2,
    name: 'Петля капоту лівого 1099LACLH',
    price: 720,
    image: 'https://i.ibb.co/XZ1grqXd/45-9p-GR5-QB.jpg',
    description: 'Петля капоту лівого 1099LACLH',
    uktzed: '8708.29.90.00', // Частини кузова (кріплення, петлі)
    sku: 'PRODUCT-520'
  },
  {
    id: 3,
    name: 'Пружина підвіски задня RA6147',
    price: 2161,
    image: 'https://i.ibb.co/fVF2sYwp/2024-20-12-21-32-48-17436595.jpg',
    description: 'Пружина підвіски задня RA6147 Бренд: KYB (Kayaba)',
    uktzed: '8708.80.99.00', // Пружини підвіски
    sku: 'PRODUCT-530'
  },
  {
    id: 4,
    name: 'Бампер BMW F80 M3',
    price: 12450,
    image: 'https://i.ibb.co/3mXdxjnt/bmw-f80-m3-buferis.jpg',
    description: 'Бампер BMW F80 M3',
    uktzed: '8708.10.00.10', // Бампери для легкових автомобілів
    sku: 'PRODUCT-540'
  },
  {
    id: 5,
    name: 'Наконечник рульової тяги CEM49',
    price: 1800,
    image: 'https://i.ibb.co/CK3FPkvx/7481864-10233420-Nlq-I5-Ak.jpg',
    description: 'Наконечник рульової тяги CEM49',
    uktzed: '8708.94.20.00', // Частини рульового управління
    sku: 'PRODUCT-550'
  },
  {
    id: 6,
    name: 'Стійка стабілізатора заднього',
    price: 1650,
    image: 'https://i.ibb.co/JjRm4Gfx/45-Pz7-YEqn.jpg',
    description: 'Стійка стабілізатора заднього 2677502 Lemforder',
    uktzed: '8708.80.99.00', // Частини підвіски, включно зі стабілізаторами
    sku: 'PRODUCT-560'
  }
];


export default function SuspensionPage() {
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
      stickers: 1,
      sku: product.sku
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
            Кузовні деталі, підвіска і рульове
          </h1>
          <p className="text-xl text-slate-300">
            Комфортна їзда та точне керування
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
