import { Link } from 'react-router-dom';
import { Wrench, Disc, Zap, Lightbulb, Filter, Sticker, Settings } from 'lucide-react';

const categories = [
  {
    name: 'Двигун і деталі',
    path: '/engine-parts',
    icon: Wrench,
    description: 'Поршні, прокладки, ремені ГРМ та інші комплектуючі',
  },
  {
    name: 'Кузовні деталі, підвіска і рульове',
    path: '/suspension',
    icon: Settings,
    description: 'Бампери, амортизатори, пружини, сайлентблоки, рульові наконечники',
  },
  {
    name: 'Електрика',
    path: '/electrical',
    icon: Zap,
    description: 'Акумулятори, стартери, генератори, реле',
  },
  {
    name: 'Освітлення',
    path: '/lighting',
    icon: Lightbulb,
    description: 'Фари, лампи, протитуманки, LED-освітлення',
  },
  {
    name: 'Фільтри',
    path: '/filters',
    icon: Filter,
    description: 'Повітряні, масляні, паливні, салонні фільтри',
  },
  {
    name: 'Наліпки',
    path: '/stickers',
    icon: Sticker,
    description: 'Наліпки для авто',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="relative h-[600px] mb-20">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(/butov.png)' }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/80 to-slate-900/50" />
        </div>
        <div className="relative h-full container mx-auto px-4 flex items-center">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              AVTO DOM KIEV UA
            </h1>
            <p className="text-3xl md:text-4xl text-orange-400 font-bold mb-8">
              Перевірені запчастини — чесна ціна.
            </p>
            <p className="text-xl text-slate-200">
              Автомагазин запчастин і аксесуарів. Якісні товари для вашого автомобіля за доступними цінами.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-20">
        <div className="mb-20 text-center">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-12 max-w-4xl mx-auto border border-slate-700">
            <h2 className="text-3xl font-bold text-white mb-4">
              Чому обирають нас?
            </h2>
            <div className="grid md:grid-cols-3 gap-8 mt-8">
              <div>
                <div className="text-4xl font-bold text-orange-500 mb-2">100%</div>
                <div className="text-slate-300">Оригінальні запчастини</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-orange-500 mb-2">24/7</div>
                <div className="text-slate-300">Підтримка клієнтів</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-orange-500 mb-2">⚡</div>
                <div className="text-slate-300">Швидка доставка</div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            Наші категорії
          </h2>
          <p className="text-xl text-slate-300">
            Оберіть категорію товарів
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 max-w-7xl mx-auto">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Link
                key={category.path}
                to={category.path}
                className="group bg-slate-800/50 backdrop-blur-sm rounded-xl md:rounded-2xl p-4 md:p-8 border border-slate-700 hover:border-orange-500 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/20 hover:-translate-y-2"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 md:w-20 md:h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl md:rounded-2xl flex items-center justify-center mb-3 md:mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-6 h-6 md:w-10 md:h-10 text-white" />
                  </div>
                  <h2 className="text-sm md:text-2xl font-bold text-white mb-1 md:mb-3 group-hover:text-orange-400 transition-colors">
                    {category.name}
                  </h2>
                  <p className="text-xs md:text-base text-slate-400 group-hover:text-slate-300 transition-colors line-clamp-2">
                    {category.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
