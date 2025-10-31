import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Mail, Loader, Clock, XCircle } from 'lucide-react';

type OrderStatus = 'awaiting_payment' | 'completed' | 'failed' | 'cancelled';

interface OrderData {
  orderId: string;
  status: OrderStatus;
  firstName: string;
  lastName: string;
  email: string;
  packageName: string;
  packagePrice: number;
  stickerCount: number;
  transactionNumber: string | null;
  createdAt: string;
  paidAt: string | null;
}

export default function Success() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('orderId');

  const [isLoading, setIsLoading] = useState(true);
  const [positions, setPositions] = useState<number[]>([]);
  const [error, setError] = useState('');
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [pollingCount, setPollingCount] = useState(0);
  const maxPollingAttempts = 60;

  useEffect(() => {
    if (!orderId) {
      setError('Невірний ID замовлення');
      setIsLoading(false);
      return;
    }

    let pollInterval: number;

    const checkOrderStatus = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-order-status?orderId=${orderId}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
            }
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to check order status');
        }

        const data = await response.json();
        const order = data.order as OrderData;

        setOrderData(order);

        console.log('Order status check:', {
          orderId: order.orderId,
          status: order.status,
          pollingCount,
          hasPositions: data.positions?.length > 0
        });

        if (order.status === 'completed') {
          if (!data.positions || data.positions.length === 0) {
            console.error('Order marked as completed but no positions found');
            setError('Помилка: замовлення підтверджено, але позиції не знайдено. Зв\'яжіться з підтримкою.');
            setIsLoading(false);
            if (pollInterval) {
              clearInterval(pollInterval);
            }
            return;
          }

          setPositions(data.positions);
          setIsLoading(false);
          if (pollInterval) {
            clearInterval(pollInterval);
          }
          sessionStorage.removeItem('pendingOrder');
        } else if (order.status === 'failed' || order.status === 'cancelled') {
          setError('Оплата не вдалась або була скасована');
          setIsLoading(false);
          if (pollInterval) {
            clearInterval(pollInterval);
          }
        } else if (order.status === 'awaiting_payment') {
          setPollingCount(prev => prev + 1);

          if (pollingCount >= maxPollingAttempts) {
            setError('Час очікування підтвердження оплати минув. Якщо ви здійснили оплату, зв\'яжіться з нами.');
            setIsLoading(false);
            if (pollInterval) {
              clearInterval(pollInterval);
            }
          }
        } else {
          console.warn('Unknown order status:', order.status);
          setError('Невідомий статус замовлення. Зв\'яжіться з підтримкою.');
          setIsLoading(false);
          if (pollInterval) {
            clearInterval(pollInterval);
          }
        }
      } catch (err) {
        console.error('Error checking order status:', err);
        setError('Помилка при перевірці статусу замовлення');
        setIsLoading(false);
        if (pollInterval) {
          clearInterval(pollInterval);
        }
      }
    };

    checkOrderStatus();
    pollInterval = window.setInterval(checkOrderStatus, 3000);

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [orderId, pollingCount]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="relative mb-6">
            <Loader className="w-16 h-16 text-orange-500 animate-spin mx-auto" />
            <Clock className="w-8 h-8 text-orange-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Очікуємо підтвердження оплати</h2>
          <p className="text-gray-300 mb-2">Це може зайняти декілька секунд...</p>
          <p className="text-gray-400 text-sm mb-4">
            Після успішної оплати в Monobank ми автоматично зарахуємо вашу участь в розіграші
          </p>
          {pollingCount > 10 && (
            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3 mb-4">
              <p className="text-yellow-200 text-sm">
                Перевірка займає більше часу, ніж очікувалося. Якщо ви ще не здійснили оплату в Monobank, будь ласка, завершіть її.
              </p>
            </div>
          )}
          <div className="mt-6 bg-white/10 rounded-lg p-4 backdrop-blur-sm">
            <p className="text-white text-sm">
              Спроба {pollingCount} з {maxPollingAttempts}
            </p>
            <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
              <div
                className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(pollingCount / maxPollingAttempts) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Помилка оплати</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          {orderData && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Інформація про замовлення:</strong>
              </p>
              <p className="text-sm text-gray-600">Статус: <span className="font-semibold">{orderData.status === 'awaiting_payment' ? 'Очікує оплати' : orderData.status === 'failed' ? 'Помилка' : 'Скасовано'}</span></p>
              <p className="text-sm text-gray-600">Пакет: {orderData.packageName}</p>
              <p className="text-sm text-gray-600">Сума: {orderData.packagePrice} грн</p>
            </div>
          )}
          <div className="space-y-3">
            <button
              onClick={() => navigate('/')}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Повернутися на головну
            </button>
            {orderData?.status === 'awaiting_payment' && (
              <button
                onClick={() => navigate(`/checkout?package=${orderData.packageName}&price=${orderData.packagePrice}&stickers=${orderData.stickerCount}`)}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Спробувати ще раз
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl p-8 md:p-12 max-w-2xl w-full shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-800 mb-2">
            Оплата успішна!
          </h1>
          <p className="text-gray-600 text-lg">
            Вітаємо!
          </p>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mt-4">
            {orderData?.transactionNumber && (
              <p className="text-sm text-gray-600 break-all">
                Транзакція: <span className="font-bold text-orange-600">{orderData.transactionNumber}</span>
              </p>
            )}
          </div>
        </div>

        <div className="bg-blue-50 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <Mail className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-gray-800 mb-2">Перевірте вашу пошту</h3>
              <p className="text-gray-600 text-sm">
                Ми відправили вам підтвердження з деталями замовлення та номерами ваших позицій на {orderData?.email}.
                Якщо лист не прийшов, перевірте папку "Спам".
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => navigate('/')}
            className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105"
          >
            Повернутися на головну
          </button>

          <p className="text-center text-gray-500 text-sm">
            Дякуємо за участь в акції!
          </p>
        </div>
      </div>
    </div>
  );
}
