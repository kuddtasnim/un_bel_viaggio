import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BookOpen, CheckCircle } from 'lucide-react'

const QUESTIONS = [
  { id: 'filled', key: 'reflect.questions.filled' },
  { id: 'alive', key: 'reflect.questions.alive' },
  { id: 'surprised', key: 'reflect.questions.surprised' },
  { id: 'style', key: 'reflect.questions.style' },
  { id: 'next', key: 'reflect.questions.next' },
]

export function ReflectPage() {
  const { t } = useTranslation()
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)
  const [currentQ, setCurrentQ] = useState(0)

  const handleSave = async () => {
    // TODO: save to Supabase
    setSaved(true)
  }

  if (saved) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <CheckCircle className="text-warm-500 mx-auto mb-4" size={48} />
        <h2 className="font-serif text-2xl font-semibold text-sand-900 mb-2">Рефлексия сохранена</h2>
        <p className="text-sand-500">Эти мысли добавлены в твой профиль путешественника</p>
      </div>
    )
  }

  const progress = (currentQ / QUESTIONS.length) * 100

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <BookOpen className="text-warm-500" size={24} />
        <div>
          <h1 className="font-serif text-2xl font-semibold text-sand-900">{t('reflect.title')}</h1>
          <p className="text-sand-500 text-sm">{t('reflect.subtitle')}</p>
        </div>
      </div>

      <div className="w-full bg-sand-100 rounded-full h-1.5 mb-8">
        <div className="bg-warm-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      <div className="space-y-6">
        {QUESTIONS.map((q, i) => (
          <div
            key={q.id}
            className={`bg-white rounded-2xl border p-6 shadow-sm transition-all ${
              i === currentQ ? 'border-warm-300 shadow-md' : 'border-sand-200 opacity-60'
            }`}
            onClick={() => setCurrentQ(i)}
          >
            <p className="font-medium text-sand-800 mb-3">
              <span className="text-warm-400 mr-2">{i + 1}.</span>
              {t(q.key)}
            </p>
            <textarea
              value={answers[q.id] || ''}
              onChange={e => {
                setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))
              }}
              onFocus={() => setCurrentQ(i)}
              placeholder="Запиши своё впечатление..."
              rows={3}
              className="w-full resize-none text-sm text-sand-700 bg-sand-50 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-warm-200 border border-sand-100"
            />
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={Object.keys(answers).length === 0}
        className="mt-8 w-full py-4 bg-warm-600 text-white rounded-xl font-medium hover:bg-warm-700 transition-colors disabled:opacity-50"
      >
        {t('reflect.save')}
      </button>
    </div>
  )
}
