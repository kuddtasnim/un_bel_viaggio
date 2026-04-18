import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { User, Plus, MapPin, Calendar, ArrowRight, Compass } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { TripFormModal } from '../components/TripFormModal'
import type { Trip, TripStatus } from '../types'
import { cn } from '../lib/utils'

const TRAVELER_TYPES = [
  { id: 'reflective', label: 'Рефлективный', desc: 'Важно осмысление и глубина', icon: '📖' },
  { id: 'explorer', label: 'Исследователь', desc: 'Важны открытия и новизна', icon: '🧭' },
  { id: 'contemplative', label: 'Созерцатель', desc: 'Важна атмосфера и замедление', icon: '🌿' },
  { id: 'adventurer', label: 'Авантюрист', desc: 'Важны активности и риск', icon: '⚡' },
]

const STATUS_LABEL: Record<TripStatus, string> = {
  done: 'Была там',
  planning: 'Планирую',
  soon: 'Скоро',
  idea: 'Идея',
}

const STATUS_COLOR: Record<TripStatus, string> = {
  done: 'bg-green-50 text-green-700 border-green-200',
  planning: 'bg-warm-50 text-warm-700 border-warm-200',
  soon: 'bg-blue-50 text-blue-700 border-blue-200',
  idea: 'bg-sand-100 text-sand-600 border-sand-200',
}

function formatDateRange(start?: string, end?: string) {
  if (!start) return null
  const s = new Date(start)
  const opts: Intl.DateTimeFormatOptions = { month: 'short', year: 'numeric' }
  if (!end) return s.toLocaleDateString('ru', opts)
  const e = new Date(end)
  if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()) {
    return `${s.getDate()}–${e.getDate()} ${s.toLocaleDateString('ru', { month: 'long', year: 'numeric' })}`
  }
  return `${s.toLocaleDateString('ru', { month: 'short' })} – ${e.toLocaleDateString('ru', opts)}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToTrip(row: any): Trip {
  return {
    id: row.id,
    title: row.title,
    destination: row.destination,
    country: row.country ?? undefined,
    startDate: row.start_date ?? undefined,
    endDate: row.end_date ?? undefined,
    status: (row.traveler_type as TripStatus) ?? undefined,
    summary: row.summary ?? undefined,
    isPublic: row.is_public,
    createdAt: row.created_at,
  }
}

export function ProfilePage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [trips, setTrips] = useState<Trip[]>([])
  const [loadingTrips, setLoadingTrips] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    setLoadingTrips(true)
    supabase
      .from('trips')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setTrips((data ?? []).map(rowToTrip))
        setLoadingTrips(false)
      })
  }, [user])

  const handleSaveTrip = async (data: Partial<Trip>) => {
    if (!user) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: row } = await (supabase as any)
      .from('trips')
      .insert({
        user_id: user.id,
        title: data.title ?? data.destination ?? '',
        destination: data.destination ?? '',
        country: data.country ?? null,
        start_date: data.startDate ?? null,
        end_date: data.endDate ?? null,
        traveler_type: data.status ?? null,
        summary: data.summary ?? null,
        is_public: false,
      })
      .select()
      .single()
    if (row) setTrips(prev => [rowToTrip(row), ...prev])
  }

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <User className="text-sand-300 mx-auto mb-4" size={48} />
        <h2 className="font-serif text-2xl font-semibold text-sand-900 mb-2">
          Войди, чтобы увидеть профиль
        </h2>
        <p className="text-sand-500 mb-6">
          Твой профиль путешественника формируется с каждой поездкой
        </p>
        <Link
          to="/auth"
          className="inline-block px-6 py-3 bg-warm-600 text-white rounded-xl hover:bg-warm-700 transition-colors"
        >
          {t('auth.login')}
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* User header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-warm-100 flex items-center justify-center text-2xl flex-shrink-0">
          ✦
        </div>
        <div>
          <h1 className="font-serif text-xl font-semibold text-sand-900">
            {user.user_metadata?.full_name || user.email}
          </h1>
          <p className="text-sand-500 text-sm">Профиль путешественника</p>
        </div>
      </div>

      {/* Traveler type */}
      <div className="bg-white rounded-2xl border border-sand-200 p-5 mb-6 shadow-sm">
        <h2 className="font-semibold text-sand-800 mb-3 flex items-center gap-2 text-sm">
          <Compass size={16} className="text-warm-500" />
          {t('profile.travelerType')}
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {TRAVELER_TYPES.map(type => (
            <button
              key={type.id}
              onClick={() => setSelectedType(selectedType === type.id ? null : type.id)}
              className={cn(
                'flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all',
                selectedType === type.id
                  ? 'bg-warm-50 border-warm-300'
                  : 'border-sand-100 hover:border-warm-200 hover:bg-warm-50/50'
              )}
            >
              <span className="text-lg">{type.icon}</span>
              <div>
                <div className="font-medium text-sand-800 text-sm">{type.label}</div>
                <div className="text-sand-400 text-xs leading-snug">{type.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Trips section */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-sand-800 flex items-center gap-2 text-sm">
          <MapPin size={16} className="text-warm-500" />
          {t('profile.trips')}
          {trips.length > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-sand-100 text-sand-500 rounded-full text-xs">
              {trips.length}
            </span>
          )}
        </h2>
        <button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-warm-600 text-white rounded-lg text-xs font-medium hover:bg-warm-700 transition-colors"
        >
          <Plus size={13} />
          Добавить поездку
        </button>
      </div>

      {loadingTrips ? (
        <div className="grid gap-3">
          {[1, 2].map(i => (
            <div key={i} className="h-20 bg-sand-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : trips.length === 0 ? (
        <div className="text-center py-14 bg-white rounded-2xl border border-sand-200 shadow-sm">
          <div className="text-4xl mb-3">🗺</div>
          <p className="text-sand-500 text-sm mb-4">{t('profile.noTrips')}</p>
          <button
            onClick={() => setFormOpen(true)}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-warm-600 text-white rounded-xl text-sm font-medium hover:bg-warm-700 transition-colors"
          >
            <Plus size={15} />
            {t('profile.addFirst')}
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {trips.map(trip => (
            <Link
              key={trip.id}
              to={`/trip/${trip.id}`}
              className="block bg-white rounded-2xl border border-sand-200 p-5 shadow-sm hover:shadow-md hover:border-warm-200 transition-all group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-sand-900 group-hover:text-warm-700 transition-colors">
                      {trip.title}
                    </h3>
                    {trip.status && (
                      <span className={cn(
                        'px-2 py-0.5 text-xs rounded-full border',
                        STATUS_COLOR[trip.status]
                      )}>
                        {STATUS_LABEL[trip.status]}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-sand-400 flex-wrap">
                    <MapPin size={11} />
                    <span>{trip.destination}{trip.country ? `, ${trip.country}` : ''}</span>
                    {trip.startDate && (
                      <>
                        <span>·</span>
                        <Calendar size={11} />
                        <span>{formatDateRange(trip.startDate, trip.endDate)}</span>
                      </>
                    )}
                  </div>
                  {trip.summary && (
                    <p className="text-sand-500 text-sm mt-1.5 line-clamp-1">{trip.summary}</p>
                  )}
                </div>
                <ArrowRight
                  size={16}
                  className="text-sand-300 group-hover:text-warm-400 transition-colors flex-shrink-0 mt-1"
                />
              </div>
            </Link>
          ))}
        </div>
      )}

      <TripFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSaveTrip}
      />
    </div>
  )
}
