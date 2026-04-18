import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Compass, Feather } from 'lucide-react'
import { Link } from 'react-router-dom'

const INSPIRATION_CARDS = [
  'Попробуй построить маршрут вокруг утренних прогулок + одного культурного якоря в день',
  'Выбери один квартал и проведи в нём весь день — без спешки',
  'Зайди в кафе, закажи что-то местное, напиши в блокнот 10 минут',
  'Найди местный рынок в первый день — это лучший способ почувствовать ритм города',
  'Возьми один день без плана. Просто иди куда ведёт улица',
  'Спроси у кого-то местного: «Куда ты ходишь, когда хочешь побыть один?»',
]

// Personal goals — what this project is for
const PERSONAL_GOALS = [
  {
    emoji: '🗺',
    title: 'Помнить не только факты, но и ощущения',
    desc: 'Каждая поездка — это слой, который остаётся. Здесь он сохраняется.',
  },
  {
    emoji: '🌿',
    title: 'Замедлиться и осмыслить',
    desc: 'Не коллекционировать страны, а понимать, что они делают с тобой.',
  },
  {
    emoji: '✦',
    title: 'Свой голос в путешествии',
    desc: 'Не фильтры и рейтинги — а то, что замечаешь именно ты.',
  },
  {
    emoji: '📖',
    title: 'Дневник, который растёт',
    desc: 'Рефлексия, заметки, песни — всё это складывается в личный архив.',
  },
]

export function ExplorePage() {
  const { t } = useTranslation()
  const [cardIndex, setCardIndex] = useState(0)

  const nextCard = () => setCardIndex(i => (i + 1) % INSPIRATION_CARDS.length)

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Compass className="text-warm-500" size={22} />
        <h1 className="font-serif text-2xl font-semibold text-sand-900">{t('explore.title')}</h1>
      </div>

      {/* Rotating inspiration card */}
      <div
        className="bg-gradient-to-r from-warm-50 to-sand-100 rounded-2xl border border-warm-200 p-6 mb-8 cursor-pointer hover:shadow-md transition-shadow"
        onClick={nextCard}
      >
        <p className="text-xs text-warm-500 font-medium mb-2 uppercase tracking-wide">Идея для поездки ✦</p>
        <p className="text-sand-800 font-serif text-lg leading-relaxed">
          "{INSPIRATION_CARDS[cardIndex]}"
        </p>
        <p className="text-xs text-sand-400 mt-3">Нажми, чтобы увидеть следующую идею</p>
      </div>

      {/* Personal goals section */}
      <div className="mb-10">
        <h2 className="font-serif text-xl font-semibold text-sand-900 mb-1">Зачем это всё</h2>
        <p className="text-sand-500 text-sm mb-5">
          Странствия — это личный инструмент для осознанных путешествий. Не соцсеть, не агрегатор — дневник с памятью.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          {PERSONAL_GOALS.map(goal => (
            <div key={goal.title} className="bg-white rounded-2xl border border-sand-200 p-5 shadow-sm">
              <div className="text-2xl mb-3">{goal.emoji}</div>
              <h3 className="font-semibold text-sand-900 text-sm mb-1.5">{goal.title}</h3>
              <p className="text-sand-500 text-xs leading-relaxed">{goal.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Community section — future */}
      <div className="bg-white rounded-2xl border border-sand-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Feather size={16} className="text-warm-500" />
          <h2 className="font-semibold text-sand-800 text-sm">Истории путешественников</h2>
          <span className="px-2 py-0.5 bg-sand-100 text-sand-400 rounded-full text-xs">скоро</span>
        </div>
        <p className="text-sand-400 text-sm mb-4">
          Здесь будут появляться истории из путешествий — рефлексии, открытия, маршруты.
        </p>
        <Link
          to="/publish"
          className="inline-flex items-center gap-1.5 text-sm text-warm-600 hover:text-warm-700 transition-colors font-medium"
        >
          <Feather size={14} />
          Написать свою историю
        </Link>
      </div>
    </div>
  )
}
