import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Sparkles, BookOpen, Compass } from 'lucide-react'

export function HomePage() {
  const { t } = useTranslation()
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <div className="text-6xl mb-6">✦</div>
        <h1 className="font-serif text-5xl font-semibold text-sand-900 mb-4">
          {t('home.tagline')}
        </h1>
        <p className="text-xl text-sand-600 mb-8 max-w-2xl mx-auto leading-relaxed">
          {t('home.subtitle')}
        </p>
        <Link
          to="/plan"
          className="inline-block px-8 py-4 bg-warm-600 text-white rounded-xl text-lg font-medium hover:bg-warm-700 transition-colors shadow-md hover:shadow-lg"
        >
          {t('home.cta')}
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {[
          { icon: Sparkles, key: 'plan', to: '/plan', color: 'bg-warm-50 border-warm-200' },
          { icon: BookOpen, key: 'reflect', to: '/reflect', color: 'bg-sand-50 border-sand-200' },
          { icon: Compass, key: 'inspire', to: '/explore', color: 'bg-warm-50 border-warm-200' },
        ].map(({ icon: Icon, key, to, color }) => (
          <Link key={key} to={to} className={`p-6 rounded-2xl border ${color} hover:shadow-md transition-all group`}>
            <Icon className="text-warm-500 mb-3 group-hover:text-warm-600" size={28} />
            <h3 className="font-serif text-lg font-semibold text-sand-900 mb-2">
              {t(`home.features.${key}.title`)}
            </h3>
            <p className="text-sand-600 text-sm leading-relaxed">
              {t(`home.features.${key}.desc`)}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
