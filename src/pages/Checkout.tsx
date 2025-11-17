import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShoppingCart, User, Mail, Phone, ArrowLeft, CreditCard } from 'lucide-react';
import { TEST_MODE } from '../lib/supabase';

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const packageName = searchParams.get('package') || '';
  const packagePrice = parseInt(searchParams.get('price') || '0');
  const stickerCount = parseInt(searchParams.get('stickers') || '0');
  const productToCount = searchParams.get('productToCount') === 'true';
  const sku = searchParams.get('sku') || 'PRODUCT-DEFAULT';

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaymentSimulation, setShowPaymentSimulation] = useState(false);
  const [paymentProgress, setPaymentProgress] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setShowPaymentSimulation(true);
    setPaymentProgress(0);

    const progressInterval = setInterval(() => {
      setPaymentProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const orderId = crypto.randomUUID();
      const amountInKopecks = packagePrice * 100;

      const currentUrl = window.location.origin;
      const redirectUrl = `${currentUrl}/success?orderId=${orderId}`;
      const webHookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/monobank-webhook`;

      sessionStorage.setItem('pendingOrder', JSON.stringify({
        ...formData,
        packageName,
        packagePrice,
        stickerCount,
        orderId
      }));

      if (TEST_MODE) {
        console.log('TEST MODE: Skipping payment, creating entries directly');

        const entries = [];
        for (let i = 0; i < stickerCount; i++) {
          entries.push({
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone,
            email: formData.email,
            package_name: packageName,
            package_price: packagePrice,
            order_id: orderId,
            payment_status: 'completed'
          });
        }

        if (productToCount) {
          entries.push({
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone,
            email: formData.email,
            package_name: sku,
            package_price: packagePrice,
            order_id: orderId,
            payment_status: 'completed'
          });
        }

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-entries`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({ entries })
          }
        );

        clearInterval(progressInterval);
        setPaymentProgress(100);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Не вдалося створити записи');
        }

        const result = await response.json();
        console.log('TEST MODE: Entries created:', result);

        await new Promise(resolve => setTimeout(resolve, 500));
        window.location.href = redirectUrl;
        return;
      }

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
            orderReference: orderId,
            customerName: `${formData.firstName} ${formData.lastName}`,
            customerEmail: formData.email,
            customerPhone: formData.phone,
            packageName: packageName,
            redirectUrl: redirectUrl,
            webHookUrl: webHookUrl,
            firstName: formData.firstName,
            lastName: formData.lastName,
            packagePrice: packagePrice,
            stickerCount: stickerCount,
            productToCount: productToCount,
            sku: sku
          })
        }
      );

      clearInterval(progressInterval);
      setPaymentProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create invoice');
      }

      const invoiceData = await response.json();

      console.log('Invoice response:', invoiceData);

      if (!invoiceData.pageUrl) {
        clearInterval(progressInterval);
        setPaymentProgress(0);

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
        if (error.message.includes('Monobank')) {
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

  if (!packageName || !packagePrice || !stickerCount) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Помилка</h2>
          <p className="text-gray-600 mb-6">Товар не вибрано. Поверніться на головну сторінку.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            На головну
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white hover:text-orange-400 transition-colors mb-6 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-semibold">Повернутися назад</span>
        </button>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-white mb-2">Оформлення замовлення</h1>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-8 text-white h-fit">
            <div className="flex items-center gap-3 mb-6">
              <ShoppingCart className="w-8 h-8" />
              <h2 className="text-2xl font-bold">Ваше замовлення</h2>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center">
                <span className="text-lg">Пакет:</span>
                <span className="text-2xl font-bold">{packageName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg">Кількість товару:</span>
                <span className="text-2xl font-bold">{stickerCount}</span>
              </div>
              <div className="border-t border-white/30 pt-4 flex justify-between items-center">
                <span className="text-xl font-semibold">До сплати:</span>
                <span className="text-3xl font-black">{packagePrice} грн</span>
              </div>
            </div>

            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Ваші дані</h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ім'я *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none transition-colors"
                    placeholder="Іван"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Прізвище *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none transition-colors"
                    placeholder="Петренко"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Телефон *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none transition-colors"
                    placeholder="+380XXXXXXXXX"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none transition-colors"
                    placeholder="example@email.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSubmitting ? 'Обробка...' : 'Перейти до оплати'}
              </button>

            </form>
          </div>
        </div>
      </div>

      {showPaymentSimulation && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Обробка оплати</h3>
              <p className="text-gray-600">Будь ласка, зачекайте...</p>
            </div>

            <div className="mb-4">
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-red-600 transition-all duration-300 ease-out"
                  style={{ width: `${paymentProgress}%` }}
                />
              </div>
              <p className="text-center text-sm text-gray-600 mt-2">{paymentProgress}%</p>
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${paymentProgress >= 30 ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span>Перевірка даних</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${paymentProgress >= 60 ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span>Створення рахунку Monobank</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${paymentProgress >= 90 ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span>Перенаправлення до оплати</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
