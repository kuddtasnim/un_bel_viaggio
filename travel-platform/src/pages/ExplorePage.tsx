import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Compass } from 'lucide-react'

type Category = 'all' | 'reflective' | 'adventure' | 'cultural' | 'gastronomic'

const SAMPLE_POSTS = [
  { id: '1', author: 'Анна', avatar: '🌸', title: 'Три дня в Киото: медленно и внимательно', category: 'reflective', excerpt: 'Я не пыталась охватить всё. Просто позволила городу раскрыться в своём темпе...', country: 'Япония', readTime: 4 },
  { id: '2', author: 'Марк', avatar: '🧭', title: 'Патагония: за пределами маршрута', category: 'adventure', excerpt: 'На третий день трекинга я понял, что иду не к горе — я иду к себе...', country: 'Аргентина', readTime: 6 },
  { id: '3', author: 'Лена', avatar: '🍜', title: 'Уличная еда Хошимина: карта вкусов', category: 'gastronomic', excerpt: 'Баньми за углом у рынка Бен Тхань изменил моё представление о том, что такое вкусно...', country: 'Вьетнам', readTime: 3 },
  { id: '4', author: 'Дима', avatar: '🏛', title: 'Архитектурный дрейф по Лиссабону', category: 'cultural', excerpt: 'Азулежу — это не просто декор. Это способ хранить память о море, потерях и возвращениях...', country: 'Португалия', readTime: 5 },
]

const INSPIRATION_CARDS = [
  'Попробуй построить маршрут вокруг утренних прогулок + одного культурного якоря в день',
  'Выбери один квартал и проведи в нём весь день — без спешки',
  'Зайди в кафе, закажи что-то местное, напиши в блокнот 10 минут',
  'Найди местный рынок в первый день — это лучший способ почувствовать ритм города',
]

export function ExplorePage() {
  const { t } = useTranslation()
  const [activeCategory, setActiveCategory] = useState<Category>('all')

  const filtered = activeCategory === 'all' ? SAMPLE_POSTS : SAMPLE_POSTS.filter(p => p.category === activeCategory)

  const inspirationCard = INSPIRATION_CARDS[0]

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Compass className="text-warm-500" size={24} />
        <h1 className="font-serif text-2xl font-semibold text-sand-900">{t('explore.title')}</h1>
      </div>

      {/* Inspiration card */}
      <div className="bg-gradient-to-r from-warm-50 to-sand-100 rounded-2xl border border-warm-200 p-6 mb-8">
        <p className="text-sm text-warm-600 font-medium mb-2">Идея для поездки ✦</p>
        <p className="text-sand-800 font-serif text-lg leading-relaxed">
          "{inspirationCard}"
        </p>
      </div>

      <div className="flex gap-2 flex-wrap mb-6">
        {(['all', 'reflective', 'adventure', 'cultural', 'gastronomic'] as Category[]).map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeCategory === cat
                ? 'bg-warm-600 text-white'
                : 'bg-sand-100 text-sand-600 hover:bg-sand-200'
            }`}
          >
            {t(`explore.${cat}`)}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map(post => (
          <article key={post.id} className="bg-white rounded-2xl border border-sand-200 p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{post.avatar}</span>
              <div>
                <span className="text-sm font-medium text-sand-700">{post.author}</span>
                <span className="text-xs text-sand-400 ml-2">· {post.country} · {post.readTime} мин</span>
              </div>
            </div>
            <h3 className="font-serif text-lg font-semibold text-sand-900 mb-2 group-hover:text-warm-700 transition-colors">{post.title}</h3>
            <p className="text-sand-500 text-sm leading-relaxed">{post.excerpt}</p>
          </article>
        ))}
      </div>
    </div>
  )
}
