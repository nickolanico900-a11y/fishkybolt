import { useState, useEffect } from 'react';
import { Clock, Plus, RotateCcw, Play, Pause, Calendar, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface TimerSettings {
  id: string;
  is_active: boolean;
  end_date: string;
  updated_at: string;
  updated_by: string | null;
}

export default function Admin() {
  const [settings, setSettings] = useState<TimerSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [daysToAdd, setDaysToAdd] = useState<number>(7);
  const [hoursToAdd, setHoursToAdd] = useState<number>(0);
  const [newDuration, setNewDuration] = useState<number>(21);

  const ADMIN_PASSWORD = 'avtodom2025';

  useEffect(() => {
    if (isAuthenticated) {
      loadSettings();
    }
  }, [isAuthenticated]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('timer_settings')
        .select('*')
        .maybeSingle();

      if (error) throw error;
      setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
    } else {
      alert('Невірний пароль!');
    }
  };

  const addTime = async () => {
    if (!settings) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-timer`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            action: 'add_time',
            password: ADMIN_PASSWORD,
            days: daysToAdd,
            hours: hoursToAdd
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add time');
      }

      alert(`Додано ${daysToAdd} днів та ${hoursToAdd} годин до таймера!`);
      await loadSettings();
    } catch (error) {
      console.error('Error adding time:', error);
      alert('Помилка при додаванні часу');
    }
  };

  const startTimer = async (days: number) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-timer`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            action: 'start_timer',
            password: ADMIN_PASSWORD,
            days: days
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start timer');
      }

      alert(`Таймер запущено на ${days} днів!`);
      await loadSettings();
    } catch (error) {
      console.error('Error starting timer:', error);
      alert('Помилка при запуску таймера');
    }
  };

  const pauseTimer = async () => {
    if (!settings) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-timer`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            action: 'pause_timer',
            password: ADMIN_PASSWORD
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to pause timer');
      }

      alert('Таймер зупинено. Оплати не приймаються.');
      await loadSettings();
    } catch (error) {
      console.error('Error pausing timer:', error);
      alert('Помилка при зупинці таймера');
    }
  };

  const resumeTimer = async () => {
    if (!settings) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-timer`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            action: 'resume_timer',
            password: ADMIN_PASSWORD
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to resume timer');
      }

      alert('Таймер відновлено. Оплати приймаються.');
      await loadSettings();
    } catch (error) {
      console.error('Error resuming timer:', error);
      alert('Помилка при відновленні таймера');
    }
  };

  const resetTimer = async () => {
    if (!confirm('Ви впевнені що хочете скинути таймер?')) return;
    if (!settings) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-timer`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            action: 'reset_timer',
            password: ADMIN_PASSWORD
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reset timer');
      }

      alert('Таймер скинуто та встановлено на 21 день!');
      await loadSettings();
    } catch (error) {
      console.error('Error resetting timer:', error);
      alert('Помилка при скиданні таймера');
    }
  };

  const clearDatabase = async () => {
    const step1 = confirm('⚠️ УВАГА! Ви впевнені, що хочете ПОВНІСТЮ ОЧИСТИТИ базу даних?\n\nЦе видалить ВСІ записи учасників!\n\nНатисніть OK для продовження або Скасувати для відміни.');
    if (!step1) return;

    const step2 = confirm('⚠️ ОСТАННЄ ПОПЕРЕДЖЕННЯ!\n\nВи дійсно хочете видалити ВСІ дані?\n\nЦя дія є НЕЗВОРОТНОЮ!\n\nНатисніть OK щоб підтвердити або Скасувати для відміни.');
    if (!step2) return;

    const step3 = confirm('⚠️ ФІНАЛЬНЕ ПІДТВЕРДЖЕННЯ!\n\nВведіть підтвердження видалення всіх даних.\n\nНатисніть OK щоб ОСТАТОЧНО ПІДТВЕРДИТИ видалення.');
    if (!step3) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-entries`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ password: ADMIN_PASSWORD })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to clear database');
      }

      const result = await response.json();
      alert(`✓ База даних успішно очищена!\nВидалено записів: ${result.entriesDeleted}\nSequence скинуто: ${result.sequenceReset ? 'Так' : 'Ні'}`);
      await loadSettings();
    } catch (error) {
      console.error('Error clearing database:', error);
      alert('Помилка при очищенні бази даних: ' + (error as Error).message);
    }
  };

  const getTimeRemaining = () => {
    if (!settings) return null;

    const now = new Date().getTime();
    const endDate = new Date(settings.end_date).getTime();
    const distance = endDate - now;

    if (distance < 0) {
      return { days: 0, hours: 0, minutes: 0, expired: true };
    }

    return {
      days: Math.floor(distance / (1000 * 60 * 60 * 24)),
      hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
      expired: false
    };
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="flex items-center justify-center mb-6">
            <Clock className="w-12 h-12 text-orange-500" />
          </div>
          <h1 className="text-3xl font-black text-gray-800 text-center mb-8">
            Адміністрування Таймера
          </h1>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введіть пароль"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg mb-4 focus:border-orange-500 focus:outline-none"
            />
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white py-3 rounded-lg font-bold transition-all"
            >
              Увійти
            </button>
          </form>
        </div>
      </div>
    );
  }

  const timeRemaining = getTimeRemaining();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8">
          <h1 className="text-4xl font-black text-gray-800 mb-8 flex items-center gap-4">
            <Clock className="w-10 h-10 text-orange-500" />
            Управління Таймером Акції
          </h1>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            </div>
          ) : !settings ? (
            <>
              {/* Таймер не створено - показуємо лише кнопку старту */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-8 mb-8 text-center">
                <div className="mb-6">
                  <Clock className="w-16 h-16 text-green-600 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">Таймер ще не створено</h2>
                  <p className="text-gray-600 text-lg">
                    Створіть таймер щоб розпочати акцію та приймати оплати
                  </p>
                </div>

                <div className="bg-white rounded-xl p-6 max-w-md mx-auto">
                  <label className="block text-gray-700 mb-3 font-semibold text-lg">
                    Тривалість акції (днів):
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newDuration}
                    onChange={(e) => setNewDuration(Number(e.target.value))}
                    className="w-full px-6 py-4 text-2xl font-bold text-center border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none mb-4"
                  />
                  <button
                    onClick={() => startTimer(newDuration)}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-4 px-8 rounded-lg font-bold text-xl transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                  >
                    <Play className="w-7 h-7" />
                    Запустити таймер на {newDuration} {newDuration === 1 ? 'день' : newDuration < 5 ? 'дні' : 'днів'}
                  </button>
                </div>
              </div>
            </>
          ) : settings ? (
            <>
              {/* Поточний стан */}
              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Поточний стан</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600 mb-2">Статус:</p>
                    <p className={`text-2xl font-bold ${settings.is_active ? 'text-green-600' : 'text-red-600'}`}>
                      {settings.is_active ? '✓ Активний' : '✗ Неактивний'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-2">Кінцева дата:</p>
                    <p className="text-xl font-bold text-gray-800">
                      {new Date(settings.end_date).toLocaleString('uk-UA')}
                    </p>
                  </div>
                </div>

                {timeRemaining && (
                  <div className="mt-6 pt-6 border-t border-orange-200">
                    <p className="text-gray-600 mb-3">Залишилось часу:</p>
                    <div className="flex gap-4">
                      <div className="bg-white rounded-lg px-6 py-3 text-center">
                        <p className="text-3xl font-black text-orange-600">{timeRemaining.days}</p>
                        <p className="text-sm text-gray-600">днів</p>
                      </div>
                      <div className="bg-white rounded-lg px-6 py-3 text-center">
                        <p className="text-3xl font-black text-orange-600">{timeRemaining.hours}</p>
                        <p className="text-sm text-gray-600">годин</p>
                      </div>
                      <div className="bg-white rounded-lg px-6 py-3 text-center">
                        <p className="text-3xl font-black text-orange-600">{timeRemaining.minutes}</p>
                        <p className="text-sm text-gray-600">хвилин</p>
                      </div>
                    </div>
                    {timeRemaining.expired && (
                      <p className="text-red-600 font-bold mt-4">⚠️ Таймер закінчився!</p>
                    )}
                  </div>
                )}
              </div>

              {/* Додати час */}
              <div className="bg-blue-50 rounded-xl p-6 mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Plus className="w-6 h-6 text-blue-600" />
                  Додати час до поточного таймера
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-2 font-medium">Днів:</label>
                    <input
                      type="number"
                      min="0"
                      value={daysToAdd}
                      onChange={(e) => setDaysToAdd(Number(e.target.value))}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2 font-medium">Годин:</label>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={hoursToAdd}
                      onChange={(e) => setHoursToAdd(Number(e.target.value))}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={addTime}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-bold transition-all"
                    >
                      Додати час
                    </button>
                  </div>
                </div>
              </div>

              {/* Запустити новий таймер */}
              <div className="bg-green-50 rounded-xl p-6 mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-green-600" />
                  Запустити новий таймер
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-2 font-medium">Тривалість (днів):</label>
                    <input
                      type="number"
                      min="1"
                      value={newDuration}
                      onChange={(e) => setNewDuration(Number(e.target.value))}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => startTimer(newDuration)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <Play className="w-5 h-5" />
                      Запустити таймер
                    </button>
                  </div>
                </div>
              </div>

              {/* Керування */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {settings.is_active ? (
                  <button
                    onClick={pauseTimer}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white py-4 rounded-lg font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <Pause className="w-6 h-6" />
                    Зупинити продажі
                  </button>
                ) : (
                  <button
                    onClick={resumeTimer}
                    className="bg-green-500 hover:bg-green-600 text-white py-4 rounded-lg font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <Play className="w-6 h-6" />
                    Відновити продажі
                  </button>
                )}
                <button
                  onClick={resetTimer}
                  className="bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-lg font-bold transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-6 h-6" />
                  Скинути таймер (21 день)
                </button>
              </div>

              {/* Небезпечна зона */}
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-4">
                <h2 className="text-2xl font-bold text-red-800 mb-4 flex items-center gap-2">
                  <Trash2 className="w-6 h-6" />
                  Небезпечна зона
                </h2>
                <p className="text-gray-700 mb-4">
                  ⚠️ Ця дія видалить ВСІ записи учасників з бази даних. Відміна неможлива!
                </p>
                <button
                  onClick={clearDatabase}
                  className="bg-red-600 hover:bg-red-700 text-white py-4 px-6 rounded-lg font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-5 h-5" />
                  Очистити базу даних
                </button>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={() => window.location.href = '/'}
                  className="bg-gray-500 hover:bg-gray-600 text-white py-4 px-8 rounded-lg font-bold transition-all"
                >
                  На головну
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
