import { Link, Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '../lib/utils'
import { useAuth } from '../hooks/useAuth'
import { Map, BookOpen, Compass, User, Feather, Sparkles } from 'lucide-react'

const navItems = [
  { to: '/plan', icon: Sparkles, labelKey: 'nav.plan' },
  { to: '/explore', icon: Compass, labelKey: 'nav.explore' },
  { to: '/map', icon: Map, labelKey: 'nav.map' },
  { to: '/notes', icon: Feather, labelKey: 'nav.notes' },
  { to: '/reflect', icon: BookOpen, labelKey: 'nav.reflect' },
  { to: '/profile', icon: User, labelKey: 'nav.profile' },
]

export function Layout() {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-sand-50">
      <header className="sticky top-0 z-50 bg-warm-50/95 backdrop-blur border-b border-sand-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="font-serif text-xl font-semibold text-warm-700 hover:text-warm-800 transition-colors">
            ✦ Странствия
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ to, icon: Icon, labelKey }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  location.pathname === to
                    ? 'bg-warm-100 text-warm-700'
                    : 'text-sand-600 hover:text-warm-700 hover:bg-sand-100'
                )}
              >
                <Icon size={16} />
                {t(labelKey)}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {(['ru', 'en', 'fr'] as const).map(lang => (
                <button
                  key={lang}
                  onClick={() => i18n.changeLanguage(lang)}
                  className={cn(
                    'px-2 py-1 text-xs rounded transition-colors',
                    i18n.language === lang
                      ? 'bg-warm-200 text-warm-800 font-medium'
                      : 'text-sand-500 hover:text-sand-700'
                  )}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
            {user ? (
              <button
                onClick={() => signOut()}
                className="text-sm text-sand-500 hover:text-sand-700 transition-colors"
              >
                {t('auth.logout')}
              </button>
            ) : (
              <Link
                to="/auth"
                className="px-4 py-2 bg-warm-600 text-white text-sm rounded-lg hover:bg-warm-700 transition-colors"
              >
                {t('auth.login')}
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-sand-200 flex">
        {navItems.map(({ to, icon: Icon, labelKey }) => (
          <Link
            key={to}
            to={to}
            className={cn(
              'flex-1 flex flex-col items-center gap-0.5 py-2 text-xs transition-colors',
              location.pathname === to
                ? 'text-warm-600'
                : 'text-sand-400 hover:text-sand-600'
            )}
          >
            <Icon size={18} />
            <span>{t(labelKey)}</span>
          </Link>
        ))}
      </nav>

      <main className="pb-20 md:pb-8">
        <Outlet />
      </main>
    </div>
  )
}
