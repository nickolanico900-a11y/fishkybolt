import { useState, useEffect } from 'react';
import { supabase, StickerEntry } from '../lib/supabase';
import { Download, Search, Filter, LogOut, Eye, EyeOff, BarChart3, ChevronDown, ChevronUp } from 'lucide-react';

export default function Owner() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [entries, setEntries] = useState<StickerEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<StickerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPackage, setFilterPackage] = useState('all');
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);

  const ADMIN_PASSWORD = 'avtodom2025';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: 'admin@avtodom.ua',
          password: ADMIN_PASSWORD
        });

        if (error) {
          console.error('Auth error:', error);
        }

        setIsAuthenticated(true);
        loadEntries();
      } catch (err) {
        console.error('Login error:', err);
        alert('Помилка входу');
      }
    } else {
      alert('Невірний пароль');
    }
  };

  const loadEntries = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-entries`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load entries');
      }

      const data = await response.json();
      setEntries(data.entries || []);
      setFilteredEntries(data.entries || []);
    } catch (error) {
      console.error('Error loading entries:', error);
      alert('Помилка завантаження даних');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let filtered = entries;

    if (searchTerm) {
      const normalizedSearch = searchTerm.replace(/\D/g, '');
      const lowerSearchTerm = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (entry) => {
          const firstName = (entry.first_name || '').toLowerCase().trim();
          const lastName = (entry.last_name || '').toLowerCase().trim();
          const email = (entry.email || '').toLowerCase().trim();
          const phone = (entry.phone || '').replace(/\D/g, '');
          const transactionNumber = (entry.transaction_number || '').toLowerCase().trim();

          return firstName.includes(lowerSearchTerm) ||
            lastName.includes(lowerSearchTerm) ||
            email.includes(lowerSearchTerm) ||
            phone.includes(normalizedSearch) ||
            entry.position_number.toString().includes(searchTerm) ||
            transactionNumber.includes(lowerSearchTerm);
        }
      );
    }

    if (filterPackage !== 'all') {
      filtered = filtered.filter((entry) => entry.package_name === filterPackage);
    }

    setFilteredEntries(filtered);
  }, [searchTerm, filterPackage, entries]);

  const exportToCSV = () => {
    const headers = ['Позиція', 'Ім\'я', 'Прізвище', 'Телефон', 'Email', 'Пакет', 'Ціна', 'ID замовлення', 'Номер транзакції', 'Дата'];
    const rows = filteredEntries.map((entry) => [
      entry.position_number,
      entry.first_name,
      entry.last_name,
      entry.phone,
      entry.email,
      entry.package_name,
      entry.package_price,
      entry.order_id,
      entry.transaction_number || '-',
      new Date(entry.created_at).toLocaleString('uk-UA')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `raffle_entries_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const uniquePackages = Array.from(new Set(entries.map((e) => e.package_name)));

  const stats = {
    totalEntries: entries.length,
    totalOrders: new Set(entries.map((e) => e.order_id)).size,
    totalRevenue: entries.reduce((sum, entry) => {
      const isFirstInOrder = !entries.find(
        (e) => e.order_id === entry.order_id && e.position_number < entry.position_number
      );
      return sum + (isFirstInOrder ? entry.package_price : 0);
    }, 0)
  };

  const packageStats = uniquePackages.map((packageName) => {
    const packageOrders = new Set(
      entries
        .filter((e) => e.package_name === packageName)
        .map((e) => e.order_id)
    ).size;
    return {
      name: packageName,
      orders: packageOrders,
      percentage: stats.totalOrders > 0 ? (packageOrders / stats.totalOrders) * 100 : 0
    };
  }).sort((a, b) => b.orders - a.orders);

  const maxOrders = Math.max(...packageStats.map(p => p.orders), 1);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
          <h1 className="text-3xl font-black text-gray-800 mb-6 text-center">
            Адмін-панель
          </h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Пароль
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none pr-12"
                  placeholder="Введіть пароль"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
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

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-black text-gray-800">Адмін-панель</h1>
            <button
              onClick={() => setIsAuthenticated(false)}
              className="flex items-center gap-2 text-red-600 hover:text-red-700 font-semibold"
            >
              <LogOut className="w-5 h-5" />
              Вийти
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
              <div className="text-sm opacity-90 mb-1">Загальна кількість записів</div>
              <div className="text-4xl font-black">{stats.totalEntries}</div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
              <div className="text-sm opacity-90 mb-1">Кількість замовлень</div>
              <div className="text-4xl font-black">{stats.totalOrders}</div>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-6 text-white">
              <div className="text-sm opacity-90 mb-1">Загальна виручка</div>
              <div className="text-4xl font-black">{stats.totalRevenue.toLocaleString()} грн</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl mb-6">
            <button
              onClick={() => setIsStatsExpanded(!isStatsExpanded)}
              className="w-full flex items-center justify-between p-6 hover:bg-purple-100/50 transition-colors rounded-xl"
            >
              <div className="flex items-center gap-3">
                <BarChart3 className="w-6 h-6 text-purple-600" />
                <h2 className="text-xl font-bold text-gray-800">Статистика по пакетам</h2>
              </div>
              {isStatsExpanded ? (
                <ChevronUp className="w-6 h-6 text-purple-600" />
              ) : (
                <ChevronDown className="w-6 h-6 text-purple-600" />
              )}
            </button>
            {isStatsExpanded && (
            <div className="space-y-4 px-6 pb-6">
              {packageStats.map((pkg) => (
                <div key={pkg.name} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-gray-700">{pkg.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-600">{pkg.orders} замовлень</span>
                      <span className="font-bold text-purple-600">{pkg.percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="relative w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                      style={{ width: `${(pkg.orders / maxOrders) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              {packageStats.length === 0 && (
                <p className="text-gray-500 text-center py-4">Немає даних для відображення</p>
              )}
            </div>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Пошук за ім'ям, email, телефоном, транзакцією або позицією..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterPackage}
                onChange={(e) => setFilterPackage(e.target.value)}
                className="pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none appearance-none bg-white min-w-[200px]"
              >
                <option value="all">Всі пакети</option>
                {uniquePackages.map((pkg) => (
                  <option key={pkg} value={pkg}>
                    {pkg}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={exportToCSV}
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              <Download className="w-5 h-5" />
              Експорт CSV
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-gray-600 mt-4">Завантаження...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Позиція</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Ім'я</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Прізвище</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Телефон</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Пакет</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Транзакція</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Дата</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-bold text-orange-600">
                        #{entry.position_number}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800">{entry.first_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-800">{entry.last_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{entry.phone}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{entry.email}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full font-semibold">
                          {entry.package_name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {entry.transaction_number || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(entry.created_at).toLocaleString('uk-UA', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredEntries.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  Записів не знайдено
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
