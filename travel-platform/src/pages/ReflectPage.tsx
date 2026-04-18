import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { BookOpen, Check, ChevronDown } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { cn } from '../lib/utils'

const QUESTIONS = [
  { id: 'filled', key: 'reflect.questions.filled' },
  { id: 'alive', key: 'reflect.questions.alive' },
  { id: 'surprised', key: 'reflect.questions.surprised' },
  { id: 'style', key: 'reflect.questions.style' },
  { id: 'next', key: 'reflect.questions.next' },
]

interface TripOption {
  id: string
  title: string
  destination: string
}

export function ReflectPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [currentQ, setCurrentQ] = useState(0)
  const [tripId, setTripId] = useState<string>('')
  const [trips, setTrips] = useState<TripOption[]>([])
  const [showTripPicker, setShowTripPicker] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase
      .from('trips')
      .select('id, title, destination')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setTrips((data ?? []) as TripOption[]))
  }, [user])

  const selectedTrip = trips.find(tr => tr.id === tripId)

  const handleSave = async () => {
    setSaving(true)
    const filledAnswers = Object.entries(answers).filter(([, v]) => v.trim())
    if (user && filledAnswers.length > 0) {
      const rows = filledAnswers.map(([questionId, answer]) => {
        const q = QUESTIONS.find(q => q.id === questionId)
        return {
          trip_id: tripId || null,
          user_id: user.id,
          question: q ? t(q.key) : questionId,
          answer,
        }
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('reflections').insert(rows)
    }
    setSaving(false)
    setSaved(true)
  }

  const progress = Object.values(answers).filter(a => a.trim()).length

  if (saved) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-warm-100 flex items-center justify-center mx-auto mb-4">
          <Check className="text-warm-600" size={28} />
        </div>
        <h2 className="font-serif text-2xl font-semibold text-sand-900 mb-2">
          {t('reflect.saved')}
        </h2>
        <p className="text-sand-500 mb-6">
          {selectedTrip
            ? `Привязана к поездке: ${selectedTrip.title}`
            : 'Рефлексия сохранена в профиле'}
        </p>
        <button
          onClick={() => { setSaved(false); setAnswers({}); setTripId('') }}
          className="px-6 py-3 bg-warm-600 text-white rounded-xl hover:bg-warm-700 transition-colors text-sm font-medium"
        >
          Новая рефлексия
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <BookOpen className="text-warm-500" size={22} />
        <div>
          <h1 className="font-serif text-2xl font-semibold text-sand-900">{t('reflect.title')}</h1>
          <p className="text-sand-500 text-sm">{t('reflect.subtitle')}</p>
        </div>
      </div>

      {/* Trip selector */}
      <div className="bg-white rounded-2xl border border-sand-200 p-4 mb-5 shadow-sm">
        <div className="text-xs font-medium text-sand-500 mb-2">{t('reflect.selectTrip')}</div>
        <div className="relative">
          <button
            onClick={() => setShowTripPicker(o => !o)}
            className="w-full flex items-center justify-between px-3 py-2.5 border border-sand-200 rounded-xl text-sm bg-sand-50 text-sand-700 hover:border-warm-300 transition-colors"
          >
            <span className={selectedTrip ? 'text-sand-800' : 'text-sand-400'}>
              {selectedTrip ? selectedTrip.title : t('reflect.noTrip')}
            </span>
            <ChevronDown
              size={14}
              className={cn('text-sand-400 transition-transform', showTripPicker && 'rotate-180')}
            />
          </button>
          {showTripPicker && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-sand-200 rounded-xl shadow-lg z-10 overflow-hidden">
              <button
                onClick={() => { setTripId(''); setShowTripPicker(false) }}
                className={cn(
                  'w-full text-left px-4 py-2.5 text-sm hover:bg-sand-50 transition-colors',
                  !tripId ? 'text-warm-700 font-medium' : 'text-sand-600'
                )}
              >
                {t('reflect.noTrip')}
              </button>
              {trips.map(trip => (
                <button
                  key={trip.id}
                  onClick={() => { setTripId(trip.id); setShowTripPicker(false) }}
                  className={cn(
                    'w-full text-left px-4 py-2.5 text-sm hover:bg-sand-50 transition-colors border-t border-sand-100',
                    tripId === trip.id ? 'text-warm-700 font-medium bg-warm-50' : 'text-sand-700'
                  )}
                >
                  {trip.title}
                  <span className="text-sand-400 ml-1 text-xs">· {trip.destination}</span>
                </button>
              ))}
              {trips.length === 0 && (
                <div className="px-4 py-3 text-sm text-sand-400">Поездок пока нет</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-sand-100 rounded-full h-1 mb-6">
        <div
          className="bg-warm-500 h-1 rounded-full transition-all duration-500"
          style={{ width: `${(progress / QUESTIONS.length) * 100}%` }}
        />
      </div>

      {/* Questions */}
      <div className="space-y-4 mb-6">
        {QUESTIONS.map((q, i) => (
          <div
            key={q.id}
            className={cn(
              'bg-white rounded-2xl border p-5 shadow-sm transition-all cursor-pointer',
              i === currentQ ? 'border-warm-300 shadow-md' : 'border-sand-200 opacity-70'
            )}
            onClick={() => setCurrentQ(i)}
          >
            <p className="font-medium text-sand-800 mb-3 text-sm">
              <span className="text-warm-400 mr-2">{i + 1}.</span>
              {t(q.key)}
            </p>
            <textarea
              value={answers[q.id] || ''}
              onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
              onFocus={() => setCurrentQ(i)}
              placeholder="Запиши своё впечатление..."
              rows={3}
              className="w-full resize-none text-sm text-sand-700 bg-sand-50 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-warm-200 border border-sand-100"
            />
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving || progress === 0}
        className="w-full py-4 bg-warm-600 text-white rounded-xl font-medium hover:bg-warm-700 transition-colors disabled:opacity-50"
      >
        {saving ? 'Сохраняем...' : t('reflect.save')}
      </button>
    </div>
  )
}
