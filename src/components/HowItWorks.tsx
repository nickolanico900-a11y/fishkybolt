import { ShoppingBag, Ticket, Trophy } from 'lucide-react';

const steps = [
  {
    icon: <ShoppingBag className="w-12 h-12" />,
    title: 'Choose a Pack',
    description: 'Select your preferred sticker pack from our collection',
    gradient: 'from-blue-400 to-blue-600'
  },
  {
    icon: <Ticket className="w-12 h-12" />,
    title: 'Get Your Stickers',
    description: 'Receive your digital stickers and bonus entries',
    gradient: 'from-emerald-400 to-emerald-600'
  },
  {
    icon: <Trophy className="w-12 h-12" />,
    title: 'Win the Car',
    description: 'Wait for the draw and you could be the lucky winner',
    gradient: 'from-yellow-400 to-yellow-600'
  }
];

export default function HowItWorks() {
  return (
    <section id="howItWorks" className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Three simple steps to your dream car
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <div
              key={index}
              className="group relative bg-gradient-to-br from-gray-50 to-white rounded-3xl p-8 border border-gray-200/50 hover:border-emerald-300 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
            >
              <div className="absolute -top-6 left-8 w-12 h-12 bg-emerald-800 rounded-full flex items-center justify-center text-white font-black text-xl shadow-lg">
                {index + 1}
              </div>

              <div className={`inline-flex p-6 rounded-2xl bg-gradient-to-br ${step.gradient} text-white mb-6 mt-4 transform group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                {step.icon}
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {step.title}
              </h3>

              <p className="text-gray-600 text-lg leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
