import { ArrowRight, PlayCircle, Mail } from 'lucide-react';
import Countdown from './Countdown';

interface HeroMobileProps {
  onScrollToStickers: () => void;
}

export default function HeroMobile({ onScrollToStickers }: HeroMobileProps) {
  return (
    <section className="relative overflow-hidden bg-[#0a0e1a] lg:hidden">
      {/* Градиент фона */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a1929] via-[#1a2f4a] to-[#2b4c6f]" />
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center bottom, #ff8c1a 0%, #ff6b00 20%, #ff4500 40%, #8b0000 60%, transparent 100%)'
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 120% 60% at 50% 80%, rgba(255, 140, 26, 0.9) 0%, rgba(255, 107, 0, 0.6) 30%, rgba(255, 69, 0, 0.5) 50%, transparent 70%)'
        }}
      />

      {/* Плавный переход к следующей секции */}
      <div
        className="absolute bottom-0 left-0 right-0 h-48"
        style={{
          background: 'linear-gradient(to bottom, transparent 0%, rgba(139, 0, 0, 0.6) 15%, rgba(255, 69, 0, 0.4) 30%, rgba(60, 65, 80, 0.6) 50%, #3a3f4e 100%)'
        }}
      />

      {/* Контент Hero Mobile */}
      <div className="relative container mx-auto px-4 flex flex-col items-center" style={{
        // === ВЫСОТА СЕКЦИИ ===
        minHeight: '50vh',           // Уменьшенная высота для показа пакетов
        paddingTop: '10px',          // Отступ сверху
        paddingBottom: '5px'         // Отступ снизу
      }}>

        {/* === ПОЗИЦИОНИРОВАНИЕ ВСЕХ ЭЛЕМЕНТОВ === */}
        <div className="relative w-full max-w-2xl mx-auto flex flex-col items-center space-y-2">

          {/* ========== ЗАГОЛОВОК AVTO DOM - НАСТРОЙКИ ========== */}
          <div
            className="text-center"
            style={{
              // === ПОЗИЦИЯ ЗАГОЛОВКА ===
              marginBottom: '5px',   // Отступ снизу
              zIndex: 30
            }}
          >
            <h1
              className="font-black tracking-wider"
              style={{
                fontFamily: 'Arial, sans-serif',
                fontStyle: 'italic'
              }}
            >
              {/* AVTO DOM - главная строка */}
              <span
                className="block leading-none"
                style={{
                  // === РАЗМЕР ШРИФТА "AVTO DOM" ===
                  fontSize: '3.5rem',  // Уменьшенный размер шрифта
                  whiteSpace: 'nowrap'
                }}
              >
                <span
                  className="text-[#1e3a5f]"
                  style={{
                    textShadow: '0 4px 30px rgba(30, 58, 95, 0.6), 0 0 60px rgba(30, 58, 95, 0.4), inset 0 -2px 10px rgba(0,0,0,0.3)'
                  }}
                >
                  AVTO{' '}
                </span>
                <span
                  className="text-red-600"
                  style={{
                    textShadow: '0 4px 30px rgba(220, 38, 38, 0.8), 0 0 60px rgba(255, 69, 0, 0.6), 0 8px 20px rgba(0,0,0,0.4)',
                    WebkitTextStroke: '1.5px white'
                  }}
                >
                  DOM
                </span>
              </span>

              {/* KIEV UA - подзаголовок */}
              <span
                className="block leading-none text-white font-bold tracking-[0.2em]"
                style={{
                  // === РАЗМЕР ШРИФТА "KIEV UA" ===
                  fontSize: '1.5rem',        // Уменьшенный размер подзаголовка
                  marginTop: '0.25rem',      // Отступ сверху
                  whiteSpace: 'nowrap',
                  textShadow: '0 2px 20px rgba(255, 255, 255, 0.5), 0 4px 40px rgba(255, 255, 255, 0.3), 0 0 80px rgba(255, 200, 100, 0.4)'
                }}
              >
                KIEV UA
              </span>
            </h1>
          </div>

          {/* Кнопка Купити Наклейку - зменшена в 2 рази */}
          <div className="flex justify-center w-full">
            <button
              onClick={onScrollToStickers}
              className="group relative bg-gradient-to-r from-orange-500 to-red-600 active:from-orange-600 active:to-red-700 text-white px-4 py-1.5 rounded-full text-sm font-black transition-all duration-300 active:scale-95 flex items-center gap-2 uppercase tracking-wide"
              style={{
                boxShadow: '0 10px 30px rgba(255, 107, 26, 0.7), 0 5px 20px rgba(220, 38, 38, 0.9)',
                textShadow: '0 2px 6px rgba(0, 0, 0, 0.5)',
                marginTop: '3rem'
              }}
            >
              Купити Наліпку
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>


        </div>
      </div>
    </section>
  );
}
