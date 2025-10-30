import { useRef, useState } from 'react';
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
  } | null>(null);

  const handleSelectPackage = (pack: { name: string; price: number; stickers: number; productToCount: boolean }) => {
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
