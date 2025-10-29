import { ArrowRight, PlayCircle, Mail } from 'lucide-react';
import Countdown from './Countdown';

interface HeroProps {
  onScrollToStickers: () => void;
}

export default function Hero({ onScrollToStickers }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-[#0a0e1a] min-h-screen hidden lg:block">
      {/* Градиент фона как на референсе - от темного синего сверху к яркому оранжевому снизу */}
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

      {/* Эффект пола - горизонтальная граница */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32"
        style={{
          background: 'linear-gradient(to top, rgba(139, 0, 0, 0.4) 0%, transparent 100%)'
        }}
      />

      {/* Свечение под машиной */}
      <div
        className="absolute"
        style={{
          bottom: '15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '60%',
          height: '120px',
          background: 'radial-gradient(ellipse at center, rgba(255, 140, 26, 0.7) 0%, rgba(255, 165, 0, 0.4) 40%, transparent 70%)',
          filter: 'blur(40px)'
        }}
      />

      {/* Анімовані іскри */}
      <div className="absolute left-0 bottom-0 w-1/3 h-1/2 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={`spark-left-${i}`}
            className="absolute animate-spark"
            style={{
              left: `${Math.random() * 100}%`,
              bottom: `${Math.random() * 50}%`,
              width: `${2 + Math.random() * 4}px`,
              height: `${8 + Math.random() * 16}px`,
              background:
                'linear-gradient(to top, rgba(255, 165, 0, 0.8), rgba(255, 215, 0, 0.4))',
              borderRadius: '50%',
              filter: 'blur(1px)',
              animation: `sparkFloat ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
              opacity: 0.6 + Math.random() * 0.4,
            }}
          />
        ))}
      </div>
      <div className="absolute right-0 bottom-0 w-1/3 h-1/2 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={`spark-right-${i}`}
            className="absolute animate-spark"
            style={{
              right: `${Math.random() * 100}%`,
              bottom: `${Math.random() * 50}%`,
              width: `${2 + Math.random() * 4}px`,
              height: `${8 + Math.random() * 16}px`,
              background:
                'linear-gradient(to top, rgba(255, 140, 0, 0.8), rgba(255, 200, 0, 0.4))',
              borderRadius: '50%',
              filter: 'blur(1px)',
              animation: `sparkFloat ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
              opacity: 0.6 + Math.random() * 0.4,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes sparkFloat {
          0%, 100% {
            transform: translateY(0px) translateX(0px) scale(1);
            opacity: 0;
          }
          50% {
            transform: translateY(-100px) translateX(${Math.random() * 40 - 20}px) scale(1.2);
            opacity: 1;
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes stickerHover {
          0%, 100% {
            transform: rotate(-3deg) translateY(0);
          }
          50% {
            transform: rotate(-3deg) translateY(-10px);
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
      `}</style>

      {/* Контент Hero */}
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 lg:pt-16 pb-16 sm:pb-20 flex flex-col items-center">

        {/* === ПОЗИЦИОНИРОВАНИЕ ВСЕХ ЭЛЕМЕНТОВ === */}
        <div className="relative w-full max-w-5xl mx-auto flex flex-col items-center">

          {/* ========== ЗАГОЛОВОК AVTO DOM - НАСТРОЙКИ ========== */}
          <div
            className="relative text-center"
            style={{
              // === ПОЗИЦИЯ ЗАГОЛОВКА ===
              top: '20px',           // Вертикальное смещение
              left: '0px',          // Горизонтальное смещение
              zIndex: 30,           // Слой (30 = поверх всего)
              marginBottom: '0px',  // Отступ снизу
              animation: 'fadeInDown 1s ease-out forwards'
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
                  fontSize: '192px',
                  whiteSpace: 'nowrap',
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
                    WebkitTextStroke: '2px white'
                  }}
                >
                  DOM
                </span>
              </span>

              {/* KIEV UA - подзаголовок */}
              <span
                className="block leading-none text-white font-bold tracking-[0.3em]"
                style={{
                  // === РАЗМЕР ШРИФТА "KIEV UA" ===
                  fontSize: '64px',
                  marginTop: '16px',
                  whiteSpace: 'nowrap',
                  textShadow: '0 2px 20px rgba(255, 255, 255, 0.5), 0 4px 40px rgba(255, 255, 255, 0.3), 0 0 80px rgba(255, 200, 100, 0.4)'
                }}
              >
                KIEV UA
              </span>
            </h1>
          </div>

          {/* CTA кнопка - зменшена в 2 рази */}
          <div className="flex justify-center w-full">
            <button
              onClick={onScrollToStickers}
              className="group relative bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-10 sm:px-16 py-3.5 sm:py-5 rounded-full text-lg sm:text-2xl font-black transition-all duration-300 transform hover:scale-110 active:scale-95 flex items-center gap-3 uppercase tracking-wide"
              style={{
                boxShadow: '0 15px 50px rgba(255, 107, 26, 0.7), 0 8px 30px rgba(220, 38, 38, 0.9), 0 0 80px rgba(255, 69, 0, 0.5)',
                textShadow: '0 3px 10px rgba(0, 0, 0, 0.5)',
                animation: 'fadeInUp 1s ease-out 1s forwards, pulse 2s ease-in-out 2s infinite',
                opacity: 0,
                animationFillMode: 'forwards',
                marginTop: '6rem'
              }}
            >
              Купити Наліпку
              <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-2 transition-transform duration-300" />
            </button>
          </div>

        </div>

      </div>
    </section>
  );
}