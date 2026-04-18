import { useTranslation } from 'react-i18next'
import { User, Globe, Compass } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const TRAVELER_TYPES = [
  { id: 'reflective', label: 'Рефлективный', desc: 'Важно осмысление и глубина', icon: '📖' },
  { id: 'explorer', label: 'Исследователь', desc: 'Важны открытия и новизна', icon: '🧭' },
  { id: 'contemplative', label: 'Созерцатель', desc: 'Важна атмосфера и замедление', icon: '🌿' },
  { id: 'adventurer', label: 'Авантюрист', desc: 'Важны активности и риск', icon: '⚡' },
]

export function ProfilePage() {
  const { t } = useTranslation()
  const { user } = useAuth()

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <User className="text-sand-300 mx-auto mb-4" size={48} />
        <h2 className="font-serif text-2xl font-semibold text-sand-900 mb-2">Войди, чтобы увидеть профиль</h2>
        <p className="text-sand-500 mb-6">Твой профиль путешественника формируется с каждой поездкой</p>
        <a href="/auth" className="inline-block px-6 py-3 bg-warm-600 text-white rounded-xl hover:bg-warm-700 transition-colors">
          {t('auth.login')}
        </a>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-2xl bg-warm-100 flex items-center justify-center text-2xl">✦</div>
        <div>
          <h1 className="font-serif text-2xl font-semibold text-sand-900">{user.email}</h1>
          <p className="text-sand-500 text-sm">Профиль путешественника</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-sand-200 p-6 mb-6 shadow-sm">
        <h2 className="font-semibold text-sand-800 mb-4 flex items-center gap-2">
          <Compass size={18} className="text-warm-500" />
          Тип путешественника
        </h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {TRAVELER_TYPES.map(type => (
            <div key={type.id} className="flex items-start gap-3 p-3 rounded-xl border border-sand-100 bg-sand-50 cursor-pointer hover:border-warm-300 hover:bg-warm-50 transition-all">
              <span className="text-xl">{type.icon}</span>
              <div>
                <div className="font-medium text-sand-800 text-sm">{type.label}</div>
                <div className="text-sand-500 text-xs">{type.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-sand-200 p-6 shadow-sm">
        <h2 className="font-semibold text-sand-800 mb-4 flex items-center gap-2">
          <Globe size={18} className="text-warm-500" />
          Посещённые страны
        </h2>
        <p className="text-sand-400 text-sm">Добавляй поездки, чтобы карта наполнялась</p>
      </div>
    </div>
  )
}
