import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CountdownProps {
  compact?: boolean;
}

export default function Countdown({ compact = false }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [targetDate, setTargetDate] = useState<number | null>(null);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    const loadTimerSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('timer_settings')
          .select('end_date, is_active')
          .maybeSingle();

        if (error) throw error;

        if (data && data.is_active) {
          setTargetDate(new Date(data.end_date).getTime());
          setIsActive(true);
        } else {
          setIsActive(false);
        }
      } catch (error) {
        console.error('Error loading timer settings:', error);
      }
    };

    loadTimerSettings();

    const channel = supabase
      .channel('timer_settings_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'timer_settings'
      }, () => {
        loadTimerSettings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!targetDate || !isActive) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setIsActive(false);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [targetDate, isActive]);

  if (compact) {
    return (
      <div className="w-full bg-gradient-to-r from-orange-600/90 to-red-600/90 backdrop-blur-md rounded-lg md:rounded-2xl px-3 py-3 md:px-8 md:py-5 border-2 border-orange-400/60 shadow-2xl" style={{
        boxShadow: '0 8px 32px rgba(255, 140, 26, 0.4), 0 0 60px rgba(255, 107, 0, 0.3)'
      }}>
        <div className="flex flex-col md:flex-row items-center gap-3 md:gap-4">
          <div className="flex items-center gap-2 md:gap-3">
            <Clock className="w-5 h-5 md:w-7 md:h-7 text-white drop-shadow-lg" />
            <span className="text-sm md:text-xl text-white font-bold uppercase tracking-wide drop-shadow-md">
              До кінця продажу:
            </span>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            {[
              { label: 'Д', value: timeLeft.days },
              { label: 'Г', value: timeLeft.hours },
              { label: 'ХВ', value: timeLeft.minutes },
              { label: 'С', value: timeLeft.seconds }
            ].map((item, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="bg-white/95 backdrop-blur-sm rounded-lg md:rounded-xl px-2 py-1 md:px-4 md:py-3 border-2 border-orange-300 min-w-[45px] md:min-w-[70px] shadow-lg">
                  <span className="text-2xl md:text-6xl font-black font-mono block text-center" style={{
                    background: 'linear-gradient(135deg, #ff8c1a 0%, #ff4500 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: 'none',
                    filter: 'drop-shadow(0 2px 4px rgba(255, 69, 0, 0.3))'
                  }}>
                    {String(item.value).padStart(2, '0')}
                  </span>
                </div>
                <span className="text-xs md:text-sm text-white font-bold uppercase mt-1 md:mt-2 tracking-wider drop-shadow-md">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="py-12 md:py-24 bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-50" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="text-center mb-6 md:mb-12">
          <p className="text-base md:text-xl text-white font-semibold uppercase tracking-wide">
            До кінця акції залишилось:
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 max-w-5xl mx-auto">
          {[
            { label: 'Днів', labelShort: 'Д', value: timeLeft.days },
            { label: 'Годин', labelShort: 'Г', value: timeLeft.hours },
            { label: 'Хвилин', labelShort: 'ХВ', value: timeLeft.minutes },
            { label: 'Секунд', labelShort: 'С', value: timeLeft.seconds }
          ].map((item, index) => (
            <div
              key={index}
              className="relative bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-md rounded-xl md:rounded-3xl p-3 md:p-8 border-2 border-white/30 shadow-2xl hover:shadow-emerald-500/20 hover:border-white/50 transition-all duration-300 group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-transparent rounded-xl md:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-white mb-1 md:mb-3 font-mono tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
                  {String(item.value).padStart(2, '0')}
                </div>
                <div className="text-xs md:text-lg lg:text-xl text-emerald-50 font-bold uppercase tracking-widest drop-shadow-md">
                  <span className="hidden sm:inline">{item.label}</span>
                  <span className="sm:hidden">{item.labelShort}</span>
                </div>
              </div>
              <div className="absolute top-1 right-1 md:top-2 md:right-2 w-1.5 h-1.5 md:w-2 md:h-2 bg-emerald-400 rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
