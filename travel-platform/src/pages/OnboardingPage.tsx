import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, ArrowRight, SkipForward, MapPin, Trash2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

interface PastTrip {
  id: string
  destination: string
  year: string
  impression: string
}

const EMPTY_TRIP = (): PastTrip => ({
  id: Math.random().toString(36).slice(2),
  destination: '',
  year: String(new Date().getFullYear()),
  impression: '',
})

export function OnboardingPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [trips, setTrips] = useState<PastTrip[]>([EMPTY_TRIP()])
  const [saving, setSaving] = useState(false)

  const updateTrip = (id: string, field: keyof PastTrip, value: string) => {
    setTrips(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t))
  }

  const addTrip = () => {
    setTrips(prev => [...prev, EMPTY_TRIP()])
  }

  const removeTrip = (id: string) => {
    if (trips.length === 1) return
    setTrips(prev => prev.filter(t => t.id !== id))
  }

  const handleDone = async () => {
    if (!user) return
    setSaving(true)
    const validTrips = trips.filter(t => t.destination.trim())
    if (validTrips.length > 0) {
      const rows = validTrips.map(t => ({
        user_id: user.id,
        title: t.destination,
        destination: t.destination,
        start_date: `${t.year}-01-01`,
        end_date: `${t.year}-12-31`,
        summary: t.impression || null,
        is_public: false,
        traveler_type: null,
      }))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await supabase.from('trips').insert(rows as any)
    }
    setSaving(false)
    navigate('/profile', { replace: true })
  }

  const handleSkip = () => {
    navigate('/profile', { replace: true })
  }

  return (
    <div className="min-h-screen bg-sand-50 flex flex-col">
      <header className="sticky top-0 z-50 bg-warm-50/95 backdrop-blur border-b border-sand-200">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-serif text-lg font-semibold text-warm-700">✦ Странствия</span>
          <button
            onClick={handleSkip}
            className="flex items-center gap-1.5 text-sm text-sand-400 hover:text-sand-600 transition-colors"
          >
            <SkipForward size={14} />
            {t('onboarding.skip')}
          </button>
        </div>
      </header>

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-10">
        <div className="mb-8">
          <h1 className="font-serif text-2xl font-semibold text-sand-900 mb-2">
            {t('onboarding.title')}
          </h1>
          <p className="text-sand-500 text-sm">{t('onboarding.subtitle')}</p>
        </div>

        <div className="space-y-4 mb-6">
          {trips.map((trip, idx) => (
            <div
              key={trip.id}
              className="bg-white rounded-2xl border border-sand-200 p-5 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-medium text-warm-500 uppercase tracking-wide">
                  {t('onboarding.step')} {idx + 1}
                </span>
                {trips.length > 1 && (
                  <button
                    onClick={() => removeTrip(trip.id)}
                    className="text-sand-300 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-sand-600 mb-1">
                    {t('onboarding.city')}
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sand-300" size={14} />
                    <input
                      type="text"
                      value={trip.destination}
                      onChange={e => updateTrip(trip.id, 'destination', e.target.value)}
                      placeholder="Рим, Стамбул..."
                      className="w-full pl-8 pr-3 py-2 border border-sand-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-warm-200 bg-sand-50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-sand-600 mb-1">
                    {t('onboarding.year')}
                  </label>
                  <input
                    type="number"
                    value={trip.year}
                    onChange={e => updateTrip(trip.id, 'year', e.target.value)}
                    min="1950"
                    max={new Date().getFullYear()}
                    className="w-full px-3 py-2 border border-sand-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-warm-200 bg-sand-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-sand-600 mb-1">
                  {t('onboarding.impression')}
                </label>
                <textarea
                  value={trip.impression}
                  onChange={e => updateTrip(trip.id, 'impression', e.target.value)}
                  placeholder={t('onboarding.impressionPlaceholder')}
                  rows={2}
                  className="w-full px-3 py-2 border border-sand-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-warm-200 bg-sand-50"
                />
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={addTrip}
          className="w-full py-3 border border-dashed border-sand-300 rounded-2xl text-sm text-sand-500 hover:border-warm-300 hover:text-warm-600 hover:bg-warm-50 transition-all flex items-center justify-center gap-2 mb-8"
        >
          <Plus size={16} />
          {t('onboarding.addMore')}
        </button>

        <button
          onClick={handleDone}
          disabled={saving || trips.every(t => !t.destination.trim())}
          className="w-full py-4 bg-warm-600 text-white rounded-2xl font-medium hover:bg-warm-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {t('onboarding.done')}
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  )
}
