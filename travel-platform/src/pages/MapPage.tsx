import { useEffect, useState } from 'react'
import { Map, MapPin } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'

interface TripLocation {
  id: string
  title: string
  destination: string
  country: string | null
  startDate: string | null
}

export function MapPage() {
  const { user } = useAuth()
  const [trips, setTrips] = useState<TripLocation[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    supabase
      .from('trips')
      .select('id, title, destination, country, start_date')
      .eq('user_id', user.id)
      .order('start_date', { ascending: false })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then(({ data }: { data: any[] | null }) => {
        setTrips((data ?? []).map((r: any) => ({
          id: r.id,
          title: r.title,
          destination: r.destination,
          country: r.country,
          startDate: r.start_date,
        })))
        setLoading(false)
      })
  }, [user])

  // Group by country
  const byCountry = trips.reduce<Record<string, TripLocation[]>>((acc, t) => {
    const key = t.country || 'Другие'
    if (!acc[key]) acc[key] = []
    acc[key].push(t)
    return acc
  }, {})

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Map className="text-warm-500" size={24} />
        <div>
          <h1 className="font-serif text-2xl font-semibold text-sand-900">Карта путешествий</h1>
          <p className="text-sand-500 text-sm">Твои места на одной странице</p>
        </div>
      </div>

      {/* Map placeholder */}
      <div className="bg-gradient-to-br from-sand-100 to-warm-50 rounded-2xl border border-sand-200 h-64 flex items-center justify-center mb-8 shadow-sm">
        <div className="text-center">
          <div className="text-5xl mb-3">🗺</div>
          <p className="text-sand-500 text-sm">Интерактивная карта появится здесь</p>
          <p className="text-sand-400 text-xs mt-1">Интеграция с Mapbox в разработке</p>
        </div>
      </div>

      {!user ? (
        <div className="text-center py-10 text-sand-400 text-sm">
          <Link to="/auth" className="text-warm-600 hover:underline">Войди</Link>, чтобы увидеть свои поездки на карте
        </div>
      ) : loading ? (
        <div className="grid md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-28 bg-sand-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : trips.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-sand-200 shadow-sm">
          <MapPin size={36} className="mx-auto mb-3 text-sand-300" />
          <p className="text-sand-500 text-sm mb-3">Поездок пока нет</p>
          <Link
            to="/profile"
            className="text-sm text-warm-600 hover:underline"
          >
            Добавить первую поездку →
          </Link>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-4 text-sm text-sand-500">
            <MapPin size={14} className="text-warm-500" />
            <span>{trips.length} {trips.length === 1 ? 'поездка' : 'поездок'} · {Object.keys(byCountry).length} стран</span>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {Object.entries(byCountry).map(([country, places]) => (
              <div key={country} className="bg-white rounded-2xl border border-sand-200 p-5 shadow-sm">
                <h3 className="font-semibold text-sand-800 mb-3 text-sm">{country}</h3>
                <div className="space-y-2">
                  {places.map(p => (
                    <Link
                      key={p.id}
                      to={`/trip/${p.id}`}
                      className="flex items-center gap-2 text-sm text-sand-600 hover:text-warm-600 transition-colors group"
                    >
                      <MapPin size={12} className="text-sand-300 group-hover:text-warm-400" />
                      <span className="truncate">{p.destination}</span>
                      {p.startDate && (
                        <span className="text-xs text-sand-300 ml-auto flex-shrink-0">
                          {new Date(p.startDate).getFullYear()}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
