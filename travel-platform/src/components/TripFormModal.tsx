import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Music, ChevronDown, Save, AlertCircle } from 'lucide-react'
import { cn } from '../lib/utils'
import type { Trip, TripStatus, Song } from '../types'

const DRAFT_KEY = 'trip_form_draft'

const STATUS_OPTIONS: { value: TripStatus; label: string; emoji: string }[] = [
  { value: 'done', label: 'Была там', emoji: '✅' },
  { value: 'planning', label: 'Планирую', emoji: '🗺' },
  { value: 'soon', label: 'Скоро', emoji: '✈️' },
  { value: 'idea', label: 'Идея', emoji: '💡' },
]

interface TripFormData {
  title: string
  destination: string
  country: string
  startDate: string
  endDate: string
  status: TripStatus
  summary: string
  songTitle: string
  songArtist: string
  songYoutubeId: string
}

const EMPTY_FORM: TripFormData = {
  title: '',
  destination: '',
  country: '',
  startDate: '',
  endDate: '',
  status: 'done',
  summary: '',
  songTitle: '',
  songArtist: '',
  songYoutubeId: '',
}

function formFromTrip(trip: Trip): TripFormData {
  return {
    title: trip.title || '',
    destination: trip.destination || '',
    country: trip.country || '',
    startDate: trip.startDate || '',
    endDate: trip.endDate || '',
    status: trip.status || 'done',
    summary: trip.summary || '',
    songTitle: trip.song?.title || '',
    songArtist: trip.song?.artist || '',
    songYoutubeId: trip.song?.youtubeId || '',
  }
}

function extractYoutubeId(input: string): string {
  if (!input) return ''
  const match = input.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/)
  return match ? match[1] : input.trim()
}

interface Props {
  open: boolean
  onClose: () => void
  onSave: (data: Partial<Trip>) => Promise<void>
  trip?: Trip | null   // null = create mode, trip = edit mode
}

export function TripFormModal({ open, onClose, onSave, trip }: Props) {
  const { t } = useTranslation()
  const isEdit = !!trip
  const [form, setForm] = useState<TripFormData>(EMPTY_FORM)
  const [showSong, setShowSong] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draftBanner, setDraftBanner] = useState(false)
  const draftSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Initialise form when modal opens
  useEffect(() => {
    if (!open) return
    if (isEdit && trip) {
      setForm(formFromTrip(trip))
      setShowSong(!!(trip.song?.title))
      setDraftBanner(false)
    } else {
      // Check for draft
      try {
        const raw = localStorage.getItem(DRAFT_KEY)
        if (raw) {
          const saved: TripFormData = JSON.parse(raw)
          if (saved.destination || saved.title) {
            setForm(saved)
            setDraftBanner(true)
            return
          }
        }
      } catch { /* ignore */ }
      setForm(EMPTY_FORM)
      setDraftBanner(false)
    }
  }, [open, isEdit, trip])

  // Auto-save draft while typing (create mode only)
  useEffect(() => {
    if (isEdit || !open) return
    if (draftSaveTimer.current) clearTimeout(draftSaveTimer.current)
    draftSaveTimer.current = setTimeout(() => {
      if (form.destination || form.title) {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(form))
      }
    }, 800)
    return () => {
      if (draftSaveTimer.current) clearTimeout(draftSaveTimer.current)
    }
  }, [form, isEdit, open])

  const discardDraft = () => {
    localStorage.removeItem(DRAFT_KEY)
    setForm(EMPTY_FORM)
    setDraftBanner(false)
  }

  const set = (field: keyof TripFormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!form.destination.trim()) return
    setSaving(true)
    const song: Song | undefined = form.songTitle
      ? {
          title: form.songTitle,
          artist: form.songArtist,
          youtubeId: extractYoutubeId(form.songYoutubeId),
        }
      : undefined

    await onSave({
      title: form.title || form.destination,
      destination: form.destination,
      country: form.country || undefined,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      status: form.status,
      summary: form.summary || undefined,
      song,
      isPublic: false,
    })

    if (!isEdit) localStorage.removeItem(DRAFT_KEY)
    setSaving(false)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-sand-100 flex-shrink-0">
          <h2 className="font-serif text-xl font-semibold text-sand-900">
            {isEdit ? t('tripForm.editTitle') : t('tripForm.createTitle')}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-sand-400 hover:bg-sand-100 hover:text-sand-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Draft banner */}
        {draftBanner && (
          <div className="mx-6 mt-4 flex items-center gap-3 px-4 py-2.5 bg-warm-50 border border-warm-200 rounded-xl text-sm">
            <AlertCircle size={15} className="text-warm-500 flex-shrink-0" />
            <span className="text-warm-700 flex-1">{t('tripForm.draftRestored')}</span>
            <button
              onClick={discardDraft}
              className="text-warm-500 hover:text-warm-700 text-xs underline flex-shrink-0"
            >
              {t('tripForm.draftDiscard')}
            </button>
          </div>
        )}

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">

          {/* Destination + Country */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-sand-600 mb-1">
                {t('tripForm.destination')} *
              </label>
              <input
                type="text"
                value={form.destination}
                onChange={e => set('destination', e.target.value)}
                placeholder="Тбилиси"
                className="w-full px-3 py-2.5 border border-sand-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-warm-200 bg-sand-50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-sand-600 mb-1">
                {t('tripForm.country')}
              </label>
              <input
                type="text"
                value={form.country}
                onChange={e => set('country', e.target.value)}
                placeholder="Грузия"
                className="w-full px-3 py-2.5 border border-sand-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-warm-200 bg-sand-50"
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-sand-600 mb-1">
              {t('tripForm.name')}
            </label>
            <input
              type="text"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder={t('tripForm.namePlaceholder')}
              className="w-full px-3 py-2.5 border border-sand-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-warm-200 bg-sand-50"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-sand-600 mb-1">
                {t('tripForm.startDate')}
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={e => set('startDate', e.target.value)}
                className="w-full px-3 py-2.5 border border-sand-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-warm-200 bg-sand-50 cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-sand-600 mb-1">
                {t('tripForm.endDate')}
              </label>
              <input
                type="date"
                value={form.endDate}
                min={form.startDate || undefined}
                onChange={e => set('endDate', e.target.value)}
                className="w-full px-3 py-2.5 border border-sand-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-warm-200 bg-sand-50 cursor-pointer"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-sand-600 mb-1">
              {t('tripForm.status')}
            </label>
            <div className="flex gap-2 flex-wrap">
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => set('status', opt.value)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border transition-all',
                    form.status === opt.value
                      ? 'bg-warm-100 border-warm-300 text-warm-700 font-medium'
                      : 'bg-sand-50 border-sand-200 text-sand-600 hover:border-sand-300'
                  )}
                >
                  <span>{opt.emoji}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div>
            <label className="block text-xs font-medium text-sand-600 mb-1">
              {t('tripForm.summary')}
            </label>
            <textarea
              value={form.summary}
              onChange={e => set('summary', e.target.value)}
              placeholder={t('tripForm.summaryPlaceholder')}
              rows={3}
              className="w-full px-3 py-2.5 border border-sand-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-warm-200 bg-sand-50"
            />
          </div>

          {/* Song section toggle */}
          <div>
            <button
              onClick={() => setShowSong(s => !s)}
              className="flex items-center gap-2 text-sm text-sand-500 hover:text-warm-600 transition-colors"
            >
              <Music size={14} />
              {t('tripForm.songSection')}
              <ChevronDown
                size={14}
                className={cn('transition-transform', showSong && 'rotate-180')}
              />
            </button>

            {showSong && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-sand-600 mb-1">
                    {t('tripForm.songTitle')}
                  </label>
                  <input
                    type="text"
                    value={form.songTitle}
                    onChange={e => set('songTitle', e.target.value)}
                    placeholder="La Vie en Rose"
                    className="w-full px-3 py-2 border border-sand-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-warm-200 bg-sand-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-sand-600 mb-1">
                    {t('tripForm.songArtist')}
                  </label>
                  <input
                    type="text"
                    value={form.songArtist}
                    onChange={e => set('songArtist', e.target.value)}
                    placeholder="Édith Piaf"
                    className="w-full px-3 py-2 border border-sand-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-warm-200 bg-sand-50"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-sand-600 mb-1">
                    {t('tripForm.songYoutube')}
                  </label>
                  <input
                    type="text"
                    value={form.songYoutubeId}
                    onChange={e => set('songYoutubeId', e.target.value)}
                    placeholder={t('tripForm.songYoutubePlaceholder')}
                    className="w-full px-3 py-2 border border-sand-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-warm-200 bg-sand-50"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-sand-100 flex gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-sand-200 text-sand-600 rounded-xl text-sm font-medium hover:bg-sand-50 transition-colors"
          >
            {t('tripForm.cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.destination.trim()}
            className="flex-1 py-3 bg-warm-600 text-white rounded-xl text-sm font-medium hover:bg-warm-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Save size={15} />
            {t('tripForm.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
