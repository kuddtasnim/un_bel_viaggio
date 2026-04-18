export type TravelerType = 'reflective' | 'explorer' | 'contemplative' | 'adventurer'
export type TravelPace = 'slow' | 'moderate' | 'fast'
export type TravelCategory = 'reflective' | 'adventure' | 'cultural' | 'gastronomic' | 'urban'
export type Language = 'ru' | 'en' | 'fr'
export type TripStatus = 'soon' | 'planning' | 'done' | 'idea'

export interface Song {
  title: string
  artist: string
  youtubeId: string
}

export interface PackItem {
  id: string
  label: string
  checked: boolean
  category: string
}

export interface Photo {
  id: string
  url: string
  caption?: string
  takenAt?: string
}

export interface Trip {
  id: string
  title: string
  destination: string
  country?: string
  startDate?: string
  endDate?: string
  status?: TripStatus
  travelerType?: TravelerType
  summary?: string
  song?: Song
  isPublic: boolean
  createdAt: string
  isDraft?: boolean
}

export interface Note {
  id: string
  tripId?: string
  title?: string
  content?: string
  imageUrl?: string
  tags: string[]
  mood?: string
  country?: string
  createdAt: string
}

export interface ReflectionQuestion {
  id: string
  question: string
  placeholder: string
}

export interface Reflection {
  id: string
  tripId: string
  userId: string
  answers: Record<string, string>
  createdAt: string
}

export interface Post {
  id: string
  userId: string
  tripId?: string
  title: string
  contentRu?: string
  contentEn?: string
  contentFr?: string
  originalLanguage: Language
  travelType?: TravelCategory
  isPublished: boolean
  coverImageUrl?: string
  createdAt: string
}
