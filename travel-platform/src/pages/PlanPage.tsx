import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Sparkles, MapPin, Loader2 } from 'lucide-react'

const INTERESTS = [
  { id: 'culture', label: 'Культура и история', en: 'Culture & history' },
  { id: 'food', label: 'Гастрономия', en: 'Gastronomy' },
  { id: 'nature', label: 'Природа', en: 'Nature' },
  { id: 'art', label: 'Искусство', en: 'Art' },
  { id: 'architecture', label: 'Архитектура', en: 'Architecture' },
  { id: 'slow', label: 'Замедление', en: 'Slow travel' },
]

interface ItineraryDay {
  day: number
  title: string
  description: string
  activities: string[]
}

export function PlanPage() {
  const { t } = useTranslation()
  const [destination, setDestination] = useState('')
  const [pace, setPace] = useState<'slow' | 'moderate' | 'fast'>('moderate')
  const [interests, setInterests] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [itinerary, setItinerary] = useState<ItineraryDay[] | null>(null)

  const toggleInterest = (id: string) => {
    setInterests(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const handleGenerate = async () => {
    if (!destination.trim()) return
    setLoading(true)
    // Placeholder: in production, call Supabase Edge Function
    await new Promise(r => setTimeout(r, 1500))
    setItinerary([
      { day: 1, title: 'Первый день — знакомство', description: 'Погружение в атмосферу города', activities: ['Утренняя прогулка по старому центру', 'Культурный якорь: главный музей', 'Гастрономический опыт в местном ресторане'] },
      { day: 2, title: 'Второй день — в глубину', description: 'Менее туристические кварталы', activities: ['Рынок или местный рынок', 'Прогулка без маршрута', 'Запись впечатлений в кафе'] },
      { day: 3, title: 'Третий день — осмысление', description: 'Замедление и интеграция', activities: ['Любимое место снова', 'Свободное время', 'Начать рефлексию'] },
    ])
    setLoading(false)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="font-serif text-3xl font-semibold text-sand-900 mb-2">{t('plan.title')}</h1>
      <p className="text-sand-500 mb-8">Опиши поездку — платформа построит маршрут под тебя</p>

      <div className="bg-white rounded-2xl border border-sand-200 p-6 mb-6 shadow-sm">
        <label className="block text-sm font-medium text-sand-700 mb-2">{t('plan.destination')}</label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-sand-400" size={18} />
          <input
            type="text"
            value={destination}
            onChange={e => setDestination(e.target.value)}
            placeholder={t('plan.destinationPlaceholder')}
            className="w-full pl-10 pr-4 py-3 border border-sand-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-warm-300 bg-sand-50"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-sand-200 p-6 mb-6 shadow-sm">
        <label className="block text-sm font-medium text-sand-700 mb-3">{t('plan.pace')}</label>
        <div className="flex gap-3">
          {(['slow', 'moderate', 'fast'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPace(p)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                pace === p ? 'bg-warm-600 text-white' : 'bg-sand-50 text-sand-600 hover:bg-sand-100 border border-sand-200'
              }`}
            >
              {t(`plan.${p}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-sand-200 p-6 mb-6 shadow-sm">
        <label className="block text-sm font-medium text-sand-700 mb-3">{t('plan.interests')}</label>
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => toggleInterest(id)}
              className={`px-4 py-2 rounded-full text-sm transition-colors ${
                interests.includes(id)
                  ? 'bg-warm-100 text-warm-700 border border-warm-300'
                  : 'bg-sand-50 text-sand-600 border border-sand-200 hover:border-sand-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading || !destination.trim()}
        className="w-full py-4 bg-warm-600 text-white rounded-xl font-medium hover:bg-warm-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
        {loading ? 'Строим маршрут...' : t('plan.generate')}
      </button>

      {itinerary && (
        <div className="mt-8">
          <h2 className="font-serif text-2xl font-semibold text-sand-900 mb-4">Твой маршрут: {destination}</h2>
          <div className="space-y-4">
            {itinerary.map(day => (
              <div key={day.day} className="bg-white rounded-2xl border border-sand-200 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-8 h-8 rounded-full bg-warm-100 text-warm-700 flex items-center justify-center text-sm font-semibold">{day.day}</span>
                  <div>
                    <h3 className="font-semibold text-sand-900">{day.title}</h3>
                    <p className="text-sand-500 text-sm">{day.description}</p>
                  </div>
                </div>
                <ul className="space-y-1.5">
                  {day.activities.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-sand-700">
                      <span className="text-warm-400 mt-0.5">✦</span>
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <button className="mt-4 w-full py-3 border border-warm-300 text-warm-700 rounded-xl font-medium hover:bg-warm-50 transition-colors">
            {t('plan.save')}
          </button>
        </div>
      )}
    </div>
  )
}
