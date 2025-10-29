import { Trophy, Calendar } from 'lucide-react';

const winners = [
  { month: 'December 2024', prize: 'BMW M4 Competition', color: 'from-blue-400 to-blue-600' },
  { month: 'November 2024', prize: 'Mercedes-AMG GT', color: 'from-gray-400 to-gray-600' },
  { month: 'October 2024', prize: 'Porsche 911 Carrera', color: 'from-emerald-400 to-emerald-600' }
];

export default function Winners() {
  return (
    <section id="winners" className="py-24 bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            Recent Winners
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Congratulations to our lucky winners
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {winners.map((winner, index) => (
            <div
              key={index}
              className="group relative bg-white rounded-3xl p-8 border border-gray-200 hover:border-emerald-300 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="relative z-10">
                <div className={`inline-flex p-6 rounded-2xl bg-gradient-to-br ${winner.color} text-white mb-6 transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-lg`}>
                  <Trophy className="w-12 h-12" />
                </div>

                <div className="flex items-center gap-2 text-gray-500 mb-4">
                  <Calendar className="w-5 h-5" />
                  <span className="font-medium">{winner.month}</span>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {winner.prize}
                </h3>

                <p className="text-gray-600">
                  Winner claimed their prize
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
