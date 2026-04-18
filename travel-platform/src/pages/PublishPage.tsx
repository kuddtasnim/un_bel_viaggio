import { useState } from 'react'
import { Send, Globe } from 'lucide-react'

export function PublishPage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [lang, setLang] = useState<'ru' | 'en' | 'fr'>('ru')

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Send className="text-warm-500" size={24} />
        <div>
          <h1 className="font-serif text-2xl font-semibold text-sand-900">Публикация</h1>
          <p className="text-sand-500 text-sm">Поделись своей историей с сообществом</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-sand-200 p-6 shadow-sm">
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Название истории..."
          className="w-full text-xl font-serif font-semibold text-sand-900 bg-transparent border-none focus:outline-none mb-4 placeholder:text-sand-300"
        />
        <div className="flex gap-2 mb-4">
          {(['ru', 'en', 'fr'] as const).map(l => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${lang === l ? 'bg-warm-100 text-warm-700' : 'text-sand-400 hover:text-sand-600'}`}
            >
              {l === 'ru' ? 'Русский' : l === 'en' ? 'English' : 'Français'}
            </button>
          ))}
        </div>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Расскажи свою историю..."
          rows={12}
          className="w-full resize-none text-sand-800 bg-transparent focus:outline-none text-sm leading-relaxed"
        />
      </div>

      <div className="flex gap-3 mt-4">
        <button className="flex-1 py-3 border border-sand-200 text-sand-600 rounded-xl text-sm font-medium hover:bg-sand-50 transition-colors flex items-center justify-center gap-2">
          <Globe size={16} />
          Перевести с AI
        </button>
        <button
          disabled={!title.trim() || !content.trim()}
          className="flex-1 py-3 bg-warm-600 text-white rounded-xl text-sm font-medium hover:bg-warm-700 transition-colors disabled:opacity-50"
        >
          Опубликовать
        </button>
      </div>
    </div>
  )
}
