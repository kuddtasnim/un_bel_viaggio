import { useTranslation } from 'react-i18next'
import { Map } from 'lucide-react'

const VISITED = [
  { country: 'Япония', cities: ['Токио', 'Киото', 'Осака'], emoji: '🇯🇵', connections: ['Корея', 'Тайвань'] },
  { country: 'Франция', cities: ['Париж', 'Лион'], emoji: '🇫🇷', connections: ['Испания', 'Италия'] },
  { country: 'Португалия', cities: ['Лиссабон', 'Порту'], emoji: '🇵🇹', connections: ['Испания'] },
]

export function MapPage() {
  const { t: _t } = useTranslation()

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Map className="text-warm-500" size={24} />
        <div>
          <h1 className="font-serif text-2xl font-semibold text-sand-900">Карта путешествий</h1>
          <p className="text-sand-500 text-sm">Твои места и связи между ними</p>
        </div>
      </div>

      {/* Placeholder map */}
      <div className="bg-gradient-to-br from-sand-100 to-warm-50 rounded-2xl border border-sand-200 h-72 flex items-center justify-center mb-8 shadow-sm">
        <div className="text-center">
          <div className="text-5xl mb-3">🗺</div>
          <p className="text-sand-500 text-sm">Интерактивная карта появится здесь</p>
          <p className="text-sand-400 text-xs mt-1">Подключите Mapbox для отображения маршрутов</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {VISITED.map(place => (
          <div key={place.country} className="bg-white rounded-2xl border border-sand-200 p-5 shadow-sm">
            <div className="text-3xl mb-2">{place.emoji}</div>
            <h3 className="font-semibold text-sand-900 mb-1">{place.country}</h3>
            <div className="flex flex-wrap gap-1 mb-3">
              {place.cities.map(c => (
                <span key={c} className="px-2 py-0.5 bg-sand-100 text-sand-600 rounded-full text-xs">{c}</span>
              ))}
            </div>
            {place.connections.length > 0 && (
              <div>
                <p className="text-xs text-sand-400 mb-1">Может понравиться →</p>
                <div className="flex flex-wrap gap-1">
                  {place.connections.map(c => (
                    <span key={c} className="px-2 py-0.5 bg-warm-50 text-warm-600 rounded-full text-xs border border-warm-200">{c}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
