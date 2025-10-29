import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import EnginePartsPage from './pages/EnginePartsPage';
import SuspensionPage from './pages/SuspensionPage';
import ElectricalPage from './pages/ElectricalPage';
import LightingPage from './pages/LightingPage';
import FiltersPage from './pages/FiltersPage';
import StickersPage from './pages/StickersPage';
import Checkout from './pages/Checkout';
import Success from './pages/Success';
import Admin from './pages/Admin';
import Owner from './pages/Owner';
import { useState } from 'react';

function App() {
  const [isOfferOpen, setIsOfferOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isDeliveryOpen, setIsDeliveryOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/engine-parts" element={<EnginePartsPage />} />
        <Route path="/suspension" element={<SuspensionPage />} />
        <Route path="/electrical" element={<ElectricalPage />} />
        <Route path="/lighting" element={<LightingPage />} />
        <Route path="/filters" element={<FiltersPage />} />
        <Route path="/stickers" element={<StickersPage />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/success" element={<Success />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/owner" element={<Owner />} />
      </Routes>
      <Footer
        isOfferOpen={isOfferOpen}
        onOfferClose={() => setIsOfferOpen(false)}
        isPrivacyOpen={isPrivacyOpen}
        onPrivacyClose={() => setIsPrivacyOpen(false)}
        isDeliveryOpen={isDeliveryOpen}
        onDeliveryClose={() => setIsDeliveryOpen(false)}
        onOfferOpen={() => setIsOfferOpen(true)}
        onPrivacyOpen={() => setIsPrivacyOpen(true)}
        onDeliveryOpen={() => setIsDeliveryOpen(true)}
      />
    </div>
  );
}

export default App;
