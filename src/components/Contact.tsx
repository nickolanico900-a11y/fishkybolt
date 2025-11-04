import { useState, useEffect } from 'react';
import { Loader, CheckCircle, ShoppingCart, X, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ContactProps {
  onOpenPrivacy: () => void;
  onOpenOffer: () => void;
  selectedPackage?: {
    name: string;
    price: number;
    stickers: number;
    bonus?: number;
    productToCount?: boolean;
    sku?: string;
  } | null;
  onClearPackage?: () => void;
  isRaffleProduct?: boolean;
}

export default function Contact({ onOpenPrivacy, onOpenOffer, selectedPackage, onClearPackage }: ContactProps) {
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    phone: '',
    email: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaymentSimulation, setShowPaymentSimulation] = useState(false);
  const [paymentProgress, setPaymentProgress] = useState(0);
  const [orderComplete, setOrderComplete] = useState(false);
  const [showInactiveModal, setShowInactiveModal] = useState(false);

  useEffect(() => {
    if (selectedPackage) {
      const element = document.getElementById('contact');
      element?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedPackage]);

  const checkTimerStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('timer_settings')
        .select('is_active, end_date')
        .maybeSingle();

      if (error) throw error;

      if (!data || !data.is_active) {
        return false;
      }

      const endDate = new Date(data.end_date).getTime();
      const now = new Date().getTime();

      if (endDate <= now) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking timer status:', error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPackage) {
      alert('Оберіть товар для замовлення');
      return;
    }

    const isActive = await checkTimerStatus();
    if (!isActive) {
      setShowInactiveModal(true);
      return;
    }

    setIsSubmitting(true);
    setShowPaymentSimulation(true);
    setPaymentProgress(0);

    const progressInterval = setInterval(() => {
      setPaymentProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const newOrderId = crypto.randomUUID();
      const amountInKopecks = selectedPackage.price * 100;

      const currentUrl = window.location.origin;
      const redirectUrl = `${currentUrl}/success?orderId=${newOrderId}`;
      const webHookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/monobank-webhook`;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-monobank-invoice`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            amount: amountInKopecks,
            orderReference: newOrderId,
            customerName: `${formData.name} ${formData.surname}`,
            customerEmail: formData.email,
            customerPhone: formData.phone,
            packageName: selectedPackage.name,
            redirectUrl: redirectUrl,
            webHookUrl: webHookUrl,
            firstName: formData.name,
            lastName: formData.surname,
            packagePrice: selectedPackage.price,
            stickerCount: selectedPackage.stickers + (selectedPackage.bonus || 0),
            productToCount: selectedPackage.productToCount || false,
            sku: selectedPackage.sku || 'PRODUCT-DEFAULT'
          })
        }
      );

      clearInterval(progressInterval);
      setPaymentProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Не вдалося створити рахунок');
      }

      const invoiceData = await response.json();

      console.log('Invoice response:', invoiceData);

      if (!invoiceData.pageUrl) {
        const errorMsg = invoiceData.error || 'Не вдалося отримати посилання для оплати';
        console.error('Missing payment URL:', invoiceData);
        throw new Error(errorMsg);
      }

      console.log('Redirecting to Monobank payment page...');
      await new Promise(resolve => setTimeout(resolve, 500));
      window.location.href = invoiceData.pageUrl;
    } catch (error) {
      console.error('Error submitting order:', error);

      let errorMessage = 'Помилка при створенні оплати. Спробуйте ще раз.';

      if (error instanceof Error) {
        if (error.message.includes('Monobank') || error.message.includes('не вдалося')) {
          errorMessage = error.message;
        } else if (error.message.includes('Network') || error.message.includes('fetch')) {
          errorMessage = 'Проблема з підключенням до мережі. Перевірте інтернет та спробуйте ще раз.';
        }
      }

      alert(errorMessage);
      setIsSubmitting(false);
      setShowPaymentSimulation(false);
      setPaymentProgress(0);
    }
  };

  const handleReset = () => {
    setOrderComplete(false);
    setFormData({
      name: '',
      surname: '',
      phone: '',
      email: ''
    });
    if (onClearPackage) {
      onClearPackage();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (orderComplete) {
    return (
      <section id="contact" className="relative py-20 sm:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1d2230] via-[#2a1f1f] to-[#3d2015]" />
        <div className="absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-t from-orange-600/25 via-red-700/15 to-transparent" />

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-2xl mx-auto bg-white rounded-2xl p-8 md:p-12 shadow-2xl">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-gray-800 mb-2">
                Оплата успішна!
              </h1>
            </div>

            <div className="bg-blue-50 rounded-xl p-6 mb-8">
              <div className="flex items-start gap-3">
                <div className="text-blue-600 flex-shrink-0 mt-1">
                  📧
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 mb-2">Перевірте вашу пошту</h3>
                  <p className="text-gray-600 text-sm">
                    Ми відправили вам підтвердження з деталями замовлення та номерами ваших позицій на {formData.email}.
                    Якщо лист не прийшов, перевірте папку "Спам".
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105"
            >
              Оформити ще одне замовлення
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="contact" className="relative py-20 sm:py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#1d2230] via-[#2a1f1f] to-[#3d2015]" />
      <div className="absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-t from-orange-600/25 via-red-700/15 to-transparent" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-10 sm:mb-12">
          <h2
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-wide"
            style={{
              background: 'linear-gradient(to bottom, #f5e6d3 0%, #ff8c1a 50%, #ff4500 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: '0 0 60px rgba(255, 107, 26, 0.4)'
            }}
          >
            ЗАМОВЛЕННЯ
          </h2>
        </div>

        <div className="max-w-2xl mx-auto">
          {selectedPackage && (
            <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 mb-6 text-white relative">
              <button
                onClick={onClearPackage}
                className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
                type="button"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-3 mb-4">
                <ShoppingCart className="w-8 h-8" />
                <h3 className="text-2xl font-bold">Ваше замовлення</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-lg">Товар:</span>
                  <span className="text-2xl font-bold">{selectedPackage.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-lg">Кількість товару:</span>
                  <span className="text-2xl font-bold">{selectedPackage.stickers}</span>
                </div>
                {selectedPackage.bonus && selectedPackage.bonus > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-lg">Бонус:</span>
                    <span className="text-2xl font-bold text-yellow-300">+{selectedPackage.bonus}</span>
                  </div>
                )}
                <div className="border-t border-white/30 pt-3 flex justify-between items-center">
                  <span className="text-xl font-semibold">До сплати:</span>
                  <span className="text-3xl font-black">{selectedPackage.price} грн</span>
                </div>
              </div>
            </div>
          )}

          {showPaymentSimulation && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
                <div className="text-center">
                  <Loader className="w-16 h-16 text-orange-500 animate-spin mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">Обробка платежу...</h3>
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-red-600 h-full transition-all duration-300"
                      style={{ width: `${paymentProgress}%` }}
                    />
                  </div>
                  <p className="text-gray-600 mt-4">{paymentProgress}%</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="ІМ'Я"
                required
                className="w-full px-6 py-4 bg-[rgba(20,30,45,0.8)] border-2 border-gray-600/50 rounded-2xl text-white placeholder-gray-400 text-lg font-medium focus:outline-none focus:border-orange-500/50 transition-all duration-300"
              />
            </div>

            <div>
              <input
                type="text"
                name="surname"
                value={formData.surname}
                onChange={handleChange}
                placeholder="ПРІЗВИЩЕ"
                required
                className="w-full px-6 py-4 bg-[rgba(20,30,45,0.8)] border-2 border-gray-600/50 rounded-2xl text-white placeholder-gray-400 text-lg font-medium focus:outline-none focus:border-orange-500/50 transition-all duration-300"
              />
            </div>

            <div>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="ТЕЛЕФОН"
                required
                className="w-full px-6 py-4 bg-[rgba(20,30,45,0.8)] border-2 border-gray-600/50 rounded-2xl text-white placeholder-gray-400 text-lg font-medium focus:outline-none focus:border-orange-500/50 transition-all duration-300"
              />
            </div>

            <div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="ПОШТА"
                required
                className="w-full px-6 py-4 bg-[rgba(20,30,45,0.8)] border-2 border-gray-600/50 rounded-2xl text-white placeholder-gray-400 text-lg font-medium focus:outline-none focus:border-orange-500/50 transition-all duration-300"
              />
            </div>

            <div className="text-center mt-6 text-xs text-gray-400">
              Ознайомтесь з{' '}
              <button
                type="button"
                onClick={onOpenPrivacy}
                className="text-orange-400 hover:text-orange-300 underline transition-colors"
              >
                Політикою Конфіденційності
              </button>
              {' '}та{' '}
              <button
                type="button"
                onClick={onOpenOffer}
                className="text-orange-400 hover:text-orange-300 underline transition-colors"
              >
                Публічною Офертою
              </button>
            </div>

            <button
              type="submit"
              disabled={!selectedPackage || isSubmitting}
              className="w-full py-5 mt-6 bg-gradient-to-r from-orange-600 via-orange-500 to-red-600 hover:from-orange-500 hover:via-orange-400 hover:to-red-500 text-white rounded-2xl font-black text-xl uppercase tracking-wide transition-all duration-300 shadow-[0_8px_30px_rgba(255,107,26,0.4)] hover:shadow-[0_12px_40px_rgba(255,107,26,0.6)] transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {selectedPackage ? 'ОФОРМИТИ' : 'ОБЕРІТЬ ТОВАР ВИЩЕ'}
            </button>
          </form>
        </div>
      </div>

      {/* Модальне вікно про неактивність продажів */}
      {showInactiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gradient-to-b from-[#1d2230] to-[#2a1f1f] rounded-2xl max-w-md w-full p-8 shadow-2xl border-2 border-orange-500/30">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-6">
                <Clock className="w-12 h-12 text-orange-600" />
              </div>
              <h2 className="text-3xl font-black text-[#f5e6d3] mb-4 uppercase">
                Продажі призупинено
              </h2>
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                На даний момент платежі не приймаються. Будь ласка, очікуйте на старт нових продажів!
              </p>
              <p className="text-orange-400 text-sm mb-8">
                Слідкуйте за оновленнями в наших соціальних мережах
              </p>
              <button
                onClick={() => setShowInactiveModal(false)}
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105"
              >
                Зрозуміло
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
