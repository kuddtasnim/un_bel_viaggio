import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export function TripPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Link to="/profile" className="flex items-center gap-2 text-sand-500 hover:text-sand-700 mb-6 text-sm transition-colors">
        <ArrowLeft size={16} />
        Назад к профилю
      </Link>
      <div className="bg-white rounded-2xl border border-sand-200 p-8 shadow-sm">
        <h1 className="font-serif text-3xl font-semibold text-sand-900 mb-2">Поездка</h1>
        <p className="text-sand-400 text-sm">ID: {id}</p>
      </div>
    </div>
  )
}
