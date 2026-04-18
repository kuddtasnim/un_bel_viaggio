import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BookOpen, Compass, User } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export function HomePage() {
  const { t } = useTranslation()
  const { user } = useAuth()

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <div className="text-6xl mb-6">✦</div>
        <h1 className="font-serif text-5xl font-semibold text-sand-900 mb-4">
          {t('home.tagline')}
        </h1>
        <p className="text-xl text-sand-600 mb-8 max-w-xl mx-auto leading-relaxed">
          {t('home.subtitle')}
        </p>
        <Link
          to={user ? '/profile' : '/auth'}
          className="inline-block px-8 py-4 bg-warm-600 text-white rounded-xl text-lg font-medium hover:bg-warm-700 transition-colors shadow-md hover:shadow-lg"
        >
          {user ? t('home.cta') : 'Начать'}
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {[
          { icon: User, key: 'plan', to: user ? '/profile' : '/auth', color: 'bg-warm-50 border-warm-200',
            title: 'Мои поездки', desc: 'Сохраняй прошлые и будущие путешествия — с датами, впечатлениями и песнями' },
          { icon: BookOpen, key: 'reflect', to: '/reflect', color: 'bg-sand-50 border-sand-200',
            title: 'Рефлексия', desc: 'Несколько вопросов, которые помогают не потерять самое важное из поездки' },
          { icon: Compass, key: 'inspire', to: '/explore', color: 'bg-warm-50 border-warm-200',
            title: 'Вдохновение', desc: 'Идеи для маршрутов и напоминания о том, как путешествовать иначе' },
        ].map(({ icon: Icon, to, color, title, desc }) => (
          <Link
            key={title}
            to={to}
            className={`p-6 rounded-2xl border ${color} hover:shadow-md transition-all group`}
          >
            <Icon className="text-warm-500 mb-3 group-hover:text-warm-600" size={26} />
            <h3 className="font-serif text-lg font-semibold text-sand-900 mb-2">{title}</h3>
            <p className="text-sand-600 text-sm leading-relaxed">{desc}</p>
          </Link>
        ))}
      </div>

      {/* What this is NOT */}
      <div className="mt-12 text-center">
        <p className="text-sand-400 text-sm max-w-md mx-auto leading-relaxed">
          Не рейтинги и не рекомендации алгоритма — только твои слова, твои ощущения и твои маршруты.
        </p>
      </div>

      {!user && (
        <div className="mt-10 flex items-center justify-center gap-3">
          <Link to="/auth" className="text-sm text-warm-600 hover:underline font-medium">
            Войти или зарегистрироваться
          </Link>
          <span className="text-sand-300">·</span>
          <Link to="/explore" className="text-sm text-sand-500 hover:text-sand-700 transition-colors">
            Посмотреть без регистрации
          </Link>
        </div>
      )}

      {/* Quick feature reminder */}
      <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
        {[
          { emoji: '🎵', label: 'Песня поездки' },
          { emoji: '🧳', label: 'Список вещей' },
          { emoji: '📝', label: 'Заметки' },
          { emoji: '🗺', label: 'Карта мест' },
        ].map(item => (
          <div key={item.label} className="py-4 rounded-2xl bg-white border border-sand-200 shadow-sm">
            <div className="text-2xl mb-1">{item.emoji}</div>
            <div className="text-xs text-sand-500">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
