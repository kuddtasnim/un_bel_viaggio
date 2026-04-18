import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft, Edit2, MapPin, Calendar, Music, ChevronDown, ChevronUp,
  Plus, Check, Trash2, Image, X, Package
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { TripFormModal } from '../components/TripFormModal'
import { cn } from '../lib/utils'
import type { Trip, TripStatus, PackItem, Photo } from '../types'

const STATUS_LABEL: Record<TripStatus, string> = {
  done: 'Была там',
  planning: 'Планирую',
  soon: 'Скоро',
  idea: 'Идея',
}

const STATUS_COLOR: Record<TripStatus, string> = {
  done: 'bg-green-50 text-green-700 border-green-200',
  planning: 'bg-warm-50 text-warm-700 border-warm-200',
  soon: 'bg-blue-50 text-blue-700 border-blue-200',
  idea: 'bg-sand-100 text-sand-600 border-sand-200',
}

function formatDate(d?: string) {
  if (!d) return null
  return new Date(d).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })
}

const REFLECT_QUESTIONS = [
  'Что тебя больше всего наполнило в этой поездке?',
  'Был ли момент, когда ты почувствовал(а) себя по-настоящему живым(ой)?',
  'Что удивило? Что разочаровало?',
  'Каким путешественником ты был(а) в этот раз?',
  'Что хочешь взять с собой в следующую поездку?',
]

const PACK_CATEGORIES = ['Документы', 'Одежда', 'Гигиена', 'Техника', 'Разное']

type TabId = 'overview' | 'packing' | 'reflect' | 'photos'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToTrip(row: any): Trip {
  return {
    id: row.id,
    title: row.title,
    destination: row.destination,
    country: row.country ?? undefined,
    startDate: row.start_date ?? undefined,
    endDate: row.end_date ?? undefined,
    status: (row.traveler_type as TripStatus) ?? undefined,
    summary: row.summary ?? undefined,
    isPublic: row.is_public,
    createdAt: row.created_at,
  }
}

export function TripPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabId>('overview')
  const [editOpen, setEditOpen] = useState(false)

  // Packing — persisted in localStorage keyed by trip id
  const PACK_KEY = `pack_${id}`
  const [packItems, setPackItems] = useState<PackItem[]>(() => {
    try { return JSON.parse(localStorage.getItem(PACK_KEY) ?? '[]') } catch { return [] }
  })
  const [newItem, setNewItem] = useState('')
  const [newCategory, setNewCategory] = useState('Разное')

  // Reflection
  const REFLECT_KEY = `reflect_${id}`
  const [answers, setAnswers] = useState<Record<number, string>>(() => {
    try { return JSON.parse(localStorage.getItem(REFLECT_KEY) ?? '{}') } catch { return {} }
  })
  const [reflectSaved, setReflectSaved] = useState(false)
  const [expandedQ, setExpandedQ] = useState<number | null>(0)

  // Photos (local FileReader previews for now)
  const PHOTOS_KEY = `photos_${id}`
  const [photos, setPhotos] = useState<Photo[]>(() => {
    try { return JSON.parse(localStorage.getItem(PHOTOS_KEY) ?? '[]') } catch { return [] }
  })

  // Song player
  const [songOpen, setSongOpen] = useState(false)

  useEffect(() => {
    if (!id) return
    supabase
      .from('trips')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (data) setTrip(rowToTrip(data))
        setLoading(false)
      })
  }, [id])

  useEffect(() => { localStorage.setItem(PACK_KEY, JSON.stringify(packItems)) }, [packItems, PACK_KEY])
  useEffect(() => { localStorage.setItem(REFLECT_KEY, JSON.stringify(answers)) }, [answers, REFLECT_KEY])
  useEffect(() => { localStorage.setItem(PHOTOS_KEY, JSON.stringify(photos)) }, [photos, PHOTOS_KEY])

  // ── Packing ──────────────────────────────────────────────────────────────

  const addPackItem = () => {
    if (!newItem.trim()) return
    setPackItems(prev => [...prev, {
      id: Date.now().toString(),
      label: newItem.trim(),
      checked: false,
      category: newCategory,
    }])
    setNewItem('')
  }

  const togglePack = (itemId: string) =>
    setPackItems(prev => prev.map(i => i.id === itemId ? { ...i, checked: !i.checked } : i))

  const removePack = (itemId: string) =>
    setPackItems(prev => prev.filter(i => i.id !== itemId))

  // ── Reflection ────────────────────────────────────────────────────────────

  const saveReflection = async () => {
    if (user && id) {
      const rows = Object.entries(answers).map(([idx, answer]) => ({
        trip_id: id,
        user_id: user.id,
        question: REFLECT_QUESTIONS[Number(idx)],
        answer,
      }))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (rows.length) await (supabase as any).from('reflections').insert(rows)
    }
    setReflectSaved(true)
    setTimeout(() => setReflectSaved(false), 3000)
  }

  // ── Photos ────────────────────────────────────────────────────────────────

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files ?? []).forEach(file => {
      const reader = new FileReader()
      reader.onload = ev => {
        const url = ev.target?.result as string
        setPhotos(prev => [...prev, { id: Date.now().toString() + Math.random(), url }])
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  // ── Edit ──────────────────────────────────────────────────────────────────

  const handleEditSave = async (data: Partial<Trip>) => {
    if (!id) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('trips').update({
      title: data.title,
      destination: data.destination,
      country: data.country ?? null,
      start_date: data.startDate ?? null,
      end_date: data.endDate ?? null,
      traveler_type: data.status ?? null,
      summary: data.summary ?? null,
    }).eq('id', id)
    setTrip(prev => prev ? { ...prev, ...data } : prev)
  }

  // ── Loading / 404 ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <>
        <div className="sticky top-16 z-40 bg-white/95 backdrop-blur border-b border-sand-200 px-4 py-3">
          <div className="max-w-3xl mx-auto h-5 w-24 bg-sand-200 rounded animate-pulse" />
        </div>
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-3">
          <div className="h-8 w-48 bg-sand-200 rounded animate-pulse" />
          <div className="h-4 w-64 bg-sand-100 rounded animate-pulse" />
        </div>
      </>
    )
  }

  if (!trip) {
    return (
      <>
        <div className="sticky top-16 z-40 bg-white/95 backdrop-blur border-b border-sand-200 px-4 py-3">
          <div className="max-w-3xl mx-auto">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sand-500 hover:text-sand-700 text-sm transition-colors">
              <ArrowLeft size={16} /> {t('trip.back')}
            </button>
          </div>
        </div>
        <div className="max-w-3xl mx-auto px-4 py-16 text-center text-sand-400">
          Поездка не найдена
        </div>
      </>
    )
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: 'overview', label: t('trip.overview') },
    { id: 'packing', label: t('trip.packing') },
    { id: 'reflect', label: t('trip.reflect') },
    { id: 'photos', label: t('trip.photos') },
  ]

  const packedCount = packItems.filter(i => i.checked).length

  return (
    <>
      {/* ── Sticky back + edit bar ───────────────────────────────────────── */}
      <div className="sticky top-16 z-40 bg-white/95 backdrop-blur border-b border-sand-200">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sand-500 hover:text-sand-700 text-sm transition-colors"
          >
            <ArrowLeft size={16} />
            {t('trip.back')}
          </button>
          <button
            onClick={() => setEditOpen(true)}
            className="flex items-center gap-1.5 text-sm text-warm-600 hover:text-warm-700 transition-colors font-medium"
          >
            <Edit2 size={14} />
            {t('trip.edit')}
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">

        {/* ── Trip header ──────────────────────────────────────────────────── */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h1 className="font-serif text-3xl font-semibold text-sand-900 leading-tight">
              {trip.title}
            </h1>
            {trip.status && (
              <span className={cn('flex-shrink-0 mt-1 px-3 py-1 text-xs rounded-full border font-medium', STATUS_COLOR[trip.status])}>
                {STATUS_LABEL[trip.status]}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-sand-500">
            <span className="flex items-center gap-1">
              <MapPin size={13} />
              {trip.destination}{trip.country ? `, ${trip.country}` : ''}
            </span>
            {trip.startDate && (
              <span className="flex items-center gap-1">
                <Calendar size={13} />
                {formatDate(trip.startDate)}{trip.endDate && ` — ${formatDate(trip.endDate)}`}
              </span>
            )}
          </div>
          {trip.summary && (
            <p className="mt-3 text-sand-600 leading-relaxed">{trip.summary}</p>
          )}
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────────── */}
        <div className="flex gap-0 mb-6 border-b border-sand-200 overflow-x-auto">
          {tabs.map(({ id: tabId, label }) => (
            <button
              key={tabId}
              onClick={() => setTab(tabId)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors',
                tab === tabId
                  ? 'border-warm-500 text-warm-700'
                  : 'border-transparent text-sand-500 hover:text-sand-700'
              )}
            >
              {label}
              {tabId === 'packing' && packItems.length > 0 && (
                <span className="ml-1.5 text-xs text-sand-400">{packedCount}/{packItems.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Overview ─────────────────────────────────────────────────────── */}
        {tab === 'overview' && (
          <div className="space-y-4">
            {trip.song?.title ? (
              <div className="bg-white rounded-2xl border border-sand-200 shadow-sm overflow-hidden">
                <button
                  onClick={() => setSongOpen(o => !o)}
                  className="w-full flex items-center gap-3 px-5 py-4 hover:bg-sand-50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-warm-100 flex items-center justify-center flex-shrink-0">
                    <Music size={16} className="text-warm-600" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="font-medium text-sand-900 text-sm truncate">{trip.song.title}</div>
                    <div className="text-sand-400 text-xs">{trip.song.artist}</div>
                  </div>
                  {songOpen
                    ? <ChevronUp size={16} className="text-sand-400" />
                    : <ChevronDown size={16} className="text-sand-400" />}
                </button>
                {songOpen && trip.song.youtubeId && (
                  <div className="px-5 pb-5">
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
                      <iframe
                        src={`https://www.youtube.com/embed/${trip.song.youtubeId}`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="absolute inset-0 w-full h-full border-0"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setEditOpen(true)}
                className="w-full flex items-center gap-3 px-5 py-4 bg-white rounded-2xl border border-dashed border-sand-300 text-sand-400 hover:border-warm-300 hover:text-warm-500 transition-all text-sm"
              >
                <Music size={16} />
                {t('trip.noSong')}
              </button>
            )}
            {!trip.summary && !trip.song?.title && (
              <p className="text-center text-sand-400 text-sm py-6">
                Нажми «Редактировать», чтобы добавить описание и песню поездки
              </p>
            )}
          </div>
        )}

        {/* ── Packing ──────────────────────────────────────────────────────── */}
        {tab === 'packing' && (
          <div>
            <div className="flex gap-2 mb-4">
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                className="px-3 py-2 border border-sand-200 rounded-xl text-sm bg-sand-50 focus:outline-none focus:ring-2 focus:ring-warm-200"
              >
                {PACK_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <input
                type="text"
                value={newItem}
                onChange={e => setNewItem(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addPackItem()}
                placeholder={t('trip.addItem')}
                className="flex-1 px-3 py-2 border border-sand-200 rounded-xl text-sm bg-sand-50 focus:outline-none focus:ring-2 focus:ring-warm-200"
              />
              <button
                onClick={addPackItem}
                className="px-4 py-2 bg-warm-600 text-white rounded-xl hover:bg-warm-700 transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>

            {packItems.length === 0 ? (
              <div className="text-center py-14 text-sand-400 text-sm">
                <Package size={36} className="mx-auto mb-3 text-sand-300" />
                Список вещей пустой — добавь первое
              </div>
            ) : (
              <div className="space-y-4">
                {PACK_CATEGORIES.filter(cat => packItems.some(i => i.category === cat)).map(cat => (
                  <div key={cat}>
                    <div className="text-xs font-medium text-sand-400 uppercase tracking-wide mb-2 px-1">{cat}</div>
                    <div className="bg-white rounded-2xl border border-sand-200 divide-y divide-sand-100 shadow-sm overflow-hidden">
                      {packItems.filter(i => i.category === cat).map(item => (
                        <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                          <button
                            onClick={() => togglePack(item.id)}
                            className={cn(
                              'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
                              item.checked ? 'bg-warm-500 border-warm-500' : 'border-sand-300 hover:border-warm-400'
                            )}
                          >
                            {item.checked && <Check size={11} className="text-white" />}
                          </button>
                          <span className={cn('flex-1 text-sm', item.checked ? 'line-through text-sand-300' : 'text-sand-800')}>
                            {item.label}
                          </span>
                          <button onClick={() => removePack(item.id)} className="text-sand-200 hover:text-red-400 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Reflect ──────────────────────────────────────────────────────── */}
        {tab === 'reflect' && (
          <div>
            <div className="space-y-3 mb-6">
              {REFLECT_QUESTIONS.map((q, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'bg-white rounded-2xl border shadow-sm overflow-hidden',
                    expandedQ === idx ? 'border-warm-300' : 'border-sand-200'
                  )}
                >
                  <button
                    onClick={() => setExpandedQ(expandedQ === idx ? null : idx)}
                    className="w-full flex items-center gap-3 px-5 py-4 text-left"
                  >
                    <span className="w-6 h-6 rounded-full bg-warm-100 text-warm-600 text-xs font-semibold flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    <span className={cn('flex-1 text-sm', answers[idx] ? 'text-sand-800 font-medium' : 'text-sand-500')}>
                      {q}
                    </span>
                    {answers[idx] && <div className="w-2 h-2 rounded-full bg-warm-400 flex-shrink-0" />}
                    {expandedQ === idx
                      ? <ChevronUp size={15} className="text-sand-400 flex-shrink-0" />
                      : <ChevronDown size={15} className="text-sand-400 flex-shrink-0" />}
                  </button>
                  {expandedQ === idx && (
                    <div className="px-5 pb-4">
                      <textarea
                        value={answers[idx] || ''}
                        onChange={e => setAnswers(prev => ({ ...prev, [idx]: e.target.value }))}
                        placeholder="Запиши своё впечатление..."
                        rows={4}
                        autoFocus
                        className="w-full resize-none text-sm text-sand-700 bg-sand-50 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-warm-200 border border-sand-100"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={saveReflection}
              disabled={Object.keys(answers).length === 0}
              className={cn(
                'w-full py-3.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 text-sm',
                reflectSaved
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : 'bg-warm-600 text-white hover:bg-warm-700 disabled:opacity-50'
              )}
            >
              {reflectSaved ? <><Check size={16} /> Сохранено</> : t('reflect.save')}
            </button>
          </div>
        )}

        {/* ── Photos ───────────────────────────────────────────────────────── */}
        {tab === 'photos' && (
          <div>
            <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-warm-600 text-white rounded-xl text-sm font-medium hover:bg-warm-700 transition-colors cursor-pointer mb-4">
              <Image size={16} />
              {t('trip.addPhoto')}
              <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
            </label>

            {photos.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-sand-200 rounded-2xl">
                <Image size={36} className="mx-auto mb-3 text-sand-300" />
                <p className="text-sand-400 text-sm">{t('trip.noPhotos')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {photos.map(photo => (
                  <div key={photo.id} className="group relative aspect-square rounded-2xl overflow-hidden bg-sand-100">
                    <img src={photo.url} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setPhotos(prev => prev.filter(p => p.id !== photo.id))}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit modal — same form as create */}
      <TripFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={handleEditSave}
        trip={trip}
      />
    </>
  )
}
