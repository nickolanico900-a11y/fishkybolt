import { useRef, useState, useEffect } from 'react';
import StickerPacks from '../components/StickerPacks';
import Contact from '../components/Contact';
import Countdown from '../components/Countdown';

export default function StickersPage() {
  const contactRef = useRef<HTMLDivElement>(null);
  const [selectedPackage, setSelectedPackage] = useState<{
    name: string;
    price: number;
    stickers: number;
    productToCount: boolean;
    sku: string;
  } | null>(null);

  useEffect(() => {
    if (window.fbq) {
      window.fbq('track', 'ViewContent', {
        content_name: 'Stickers Promo Page',
        content_type: 'product_group'
      });
    }
  }, []);

  const handleSelectPackage = (pack: { name: string; price: number; stickers: number; productToCount: boolean; sku: string }) => {
    setSelectedPackage(pack);
    contactRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleClearPackage = () => {
    setSelectedPackage(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <StickerPacks onSelectPackage={handleSelectPackage} />
      <div ref={contactRef}>
        <Contact
          onOpenPrivacy={() => {}}
          onOpenOffer={() => {}}
          selectedPackage={selectedPackage}
          onClearPackage={handleClearPackage}
          isRaffleProduct={true}
        />
      </div>
    </div>
  );
}
