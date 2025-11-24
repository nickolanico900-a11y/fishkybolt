import { writeFileSync } from 'fs';

const SUPABASE_URL = 'https://lskzkbxftmagqboinpfn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxza3prYnhmdG1hZ3Fib2lucGZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NTc5MTcsImV4cCI6MjA3NzMzMzkxN30.fwfCLqVikfE-x02OT1FKOeKtkPvPvhosp8iGkxsldGA';

console.log('🔍 Прямий експорт даних з бази Supabase\n');
console.log(`📊 Підключення до: ${SUPABASE_URL}\n`);

async function directExport() {
  try {
    console.log('📥 Завантаження даних через REST API...');

    const url = `${SUPABASE_URL}/rest/v1/sticker_entries?order=position_number.asc&select=*`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Помилка HTTP ${response.status}:`, errorText);
      console.log('\n⚠️  Можливі причини:');
      console.log('  1. RLS політики блокують анонімний доступ');
      console.log('  2. Потрібен Service Role Key замість Anon Key');
      console.log('  3. Таблиця має обмеження доступу\n');
      console.log('💡 РІШЕННЯ: Використайте один з альтернативних методів:');
      console.log('  • npm run export-instructions - всі доступні способи');
      console.log('  • /owner на сайті → Експорт CSV (найпростіше)');
      console.log('  • Supabase Dashboard → Table Editor → Export\n');
      return;
    }

    const entries = await response.json();

    console.log(`✅ Успішно завантажено ${entries.length} записів\n`);

    const timestamp = new Date().toISOString().split('T')[0];

    const jsonFilename = `direct_export_${timestamp}.json`;
    writeFileSync(jsonFilename, JSON.stringify(entries, null, 2), 'utf-8');
    console.log(`💾 JSON: ${jsonFilename}`);

    const headers = [
      'Position',
      'First Name',
      'Last Name',
      'Phone',
      'Email',
      'Package Name',
      'Package Price',
      'Order ID',
      'Transaction Number',
      'Payment Status',
      'Created At'
    ];

    const csvRows = entries.map(entry => [
      entry.position_number || '',
      entry.first_name || '',
      entry.last_name || '',
      entry.phone || '',
      entry.email || '',
      entry.package_name || '',
      entry.package_price || '',
      entry.order_id || '',
      entry.transaction_number || '',
      entry.payment_status || '',
      entry.created_at || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...csvRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const csvFilename = `direct_export_${timestamp}.csv`;
    writeFileSync(csvFilename, '\ufeff' + csvContent, 'utf-8');
    console.log(`💾 CSV: ${csvFilename}\n`);

    console.log('📈 СТАТИСТИКА:');
    const totalOrders = new Set(entries.map(e => e.order_id)).size;
    const completedEntries = entries.filter(e => e.payment_status === 'completed');

    let totalRevenue = 0;
    const processedOrders = new Set();
    completedEntries.forEach(entry => {
      if (!processedOrders.has(entry.order_id)) {
        totalRevenue += Number(entry.package_price) || 0;
        processedOrders.add(entry.order_id);
      }
    });

    console.log(`  • Всього записів: ${entries.length}`);
    console.log(`  • Завершених: ${completedEntries.length}`);
    console.log(`  • Унікальних замовлень: ${totalOrders}`);
    console.log(`  • Загальна виручка: ${totalRevenue.toLocaleString('uk-UA')} грн`);

    if (entries.length > 0) {
      const maxPosition = Math.max(...entries.map(e => e.position_number || 0));
      console.log(`  • Найбільша позиція: #${maxPosition}`);
      console.log(`  • Перший запис: ${entries[0]?.created_at}`);
      console.log(`  • Останній запис: ${entries[entries.length - 1]?.created_at}`);
    }

    const packageStats = {};
    completedEntries.forEach(entry => {
      if (!packageStats[entry.package_name]) {
        packageStats[entry.package_name] = { entries: 0, orders: new Set() };
      }
      packageStats[entry.package_name].entries++;
      packageStats[entry.package_name].orders.add(entry.order_id);
    });

    if (Object.keys(packageStats).length > 0) {
      console.log('\n📦 ПО ПАКЕТАМ:');
      Object.entries(packageStats)
        .sort((a, b) => b[1].orders.size - a[1].orders.size)
        .forEach(([name, stats]) => {
          console.log(`  • ${name}: ${stats.orders.size} замовлень (${stats.entries} записів)`);
        });
    }

    console.log('\n✅ Експорт завершено успішно!');

  } catch (error) {
    console.error('\n❌ Критична помилка:', error.message);
    console.log('\n💡 Спробуйте альтернативні методи експорту:');
    console.log('   npm run export-instructions');
  }
}

directExport();
