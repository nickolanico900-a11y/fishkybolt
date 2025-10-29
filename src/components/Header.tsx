import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const categories = [
    { name: 'Головна', path: '/' },
    { name: 'Двигун', path: '/engine-parts' },
    { name: 'Кузовні деталі', path: '/suspension' },
    { name: 'Електрика', path: '/electrical' },
    { name: 'Освітлення', path: '/lighting' },
    { name: 'Фільтри', path: '/filters' },
    { name: 'Наліпки', path: '/stickers' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          <Link to="/" className="text-2xl font-bold text-white hover:text-orange-400 transition-colors">
            AVTO DOM
          </Link>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden text-white p-2"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <nav className="hidden lg:flex items-center gap-6">
            {categories.map((category) => (
              <Link
                key={category.path}
                to={category.path}
                className={`text-sm font-medium transition-colors hover:text-orange-400 ${
                  location.pathname === category.path
                    ? 'text-orange-400'
                    : 'text-white'
                }`}
              >
                {category.name}
              </Link>
            ))}
          </nav>
        </div>

        {isMenuOpen && (
          <nav className="lg:hidden py-4 border-t border-slate-700">
            {categories.map((category) => (
              <Link
                key={category.path}
                to={category.path}
                onClick={() => setIsMenuOpen(false)}
                className={`block py-3 text-sm font-medium transition-colors hover:text-orange-400 ${
                  location.pathname === category.path
                    ? 'text-orange-400'
                    : 'text-white'
                }`}
              >
                {category.name}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
