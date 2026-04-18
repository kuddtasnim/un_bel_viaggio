import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Feather, Plus, Tag, X } from 'lucide-react'

interface NoteItem {
  id: string
  content: string
  tags: string[]
  createdAt: Date
  mood?: string
}

const MOODS = ['✨ вдохновлён(а)', '🌿 спокоен(а)', '🔥 воодушевлён(а)', '🌧 задумчив(а)', '💛 благодарен(а)']

export function NotesPage() {
  const { t } = useTranslation()
  const [notes, setNotes] = useState<NoteItem[]>([])
  const [newNote, setNewNote] = useState('')
  const [newTag, setNewTag] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [mood, setMood] = useState('')
  const [showForm, setShowForm] = useState(false)

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags(prev => [...prev, newTag.trim()])
      setNewTag('')
    }
  }

  const saveNote = () => {
    if (!newNote.trim()) return
    setNotes(prev => [{
      id: Date.now().toString(),
      content: newNote,
      tags,
      mood,
      createdAt: new Date(),
    }, ...prev])
    setNewNote('')
    setTags([])
    setMood('')
    setShowForm(false)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Feather className="text-warm-500" size={24} />
          <h1 className="font-serif text-2xl font-semibold text-sand-900">{t('notes.title')}</h1>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-warm-600 text-white rounded-xl text-sm font-medium hover:bg-warm-700 transition-colors"
        >
          <Plus size={16} />
          {t('notes.add')}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-warm-200 p-6 mb-6 shadow-md">
          <textarea
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
            placeholder={t('notes.placeholder')}
            rows={5}
            autoFocus
            className="w-full resize-none text-sand-800 bg-transparent focus:outline-none text-base leading-relaxed"
          />
          <div className="border-t border-sand-100 mt-4 pt-4">
            <div className="flex flex-wrap gap-2 mb-3">
              {MOODS.map(m => (
                <button
                  key={m}
                  onClick={() => setMood(mood === m ? '' : m)}
                  className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                    mood === m ? 'bg-warm-100 text-warm-700 border border-warm-300' : 'bg-sand-50 text-sand-600 border border-sand-200'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mb-3">
              <input
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTag()}
                placeholder="Добавить тег..."
                className="flex-1 text-sm px-3 py-2 border border-sand-200 rounded-lg bg-sand-50 focus:outline-none focus:ring-2 focus:ring-warm-200"
              />
              <button onClick={addTag} className="px-3 py-2 bg-sand-100 rounded-lg text-sand-600 hover:bg-sand-200 transition-colors">
                <Tag size={14} />
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 px-2.5 py-1 bg-warm-50 text-warm-700 rounded-full text-xs border border-warm-200">
                    #{tag}
                    <button onClick={() => setTags(prev => prev.filter(t => t !== tag))}>
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sand-500 hover:text-sand-700 text-sm">Отмена</button>
              <button onClick={saveNote} className="px-5 py-2 bg-warm-600 text-white rounded-lg text-sm font-medium hover:bg-warm-700 transition-colors">
                {t('notes.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {notes.length === 0 && !showForm ? (
        <div className="text-center py-20">
          <Feather className="text-sand-300 mx-auto mb-4" size={48} />
          <p className="text-sand-400">Здесь будут твои заметки и впечатления</p>
          <button onClick={() => setShowForm(true)} className="mt-4 text-warm-600 hover:underline text-sm">
            Написать первую заметку
          </button>
        </div>
      ) : (
        <div className="columns-1 md:columns-2 gap-4 space-y-4">
          {notes.map(note => (
            <div key={note.id} className="break-inside-avoid bg-white rounded-2xl border border-sand-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              {note.mood && <div className="text-xs text-sand-500 mb-2">{note.mood}</div>}
              <p className="text-sand-800 text-sm leading-relaxed whitespace-pre-wrap">{note.content}</p>
              {note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {note.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-sand-100 text-sand-500 rounded-full text-xs">#{tag}</span>
                  ))}
                </div>
              )}
              <div className="text-xs text-sand-300 mt-3">{note.createdAt.toLocaleDateString('ru')}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
