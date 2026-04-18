export type TravelerType = 'reflective' | 'explorer' | 'contemplative' | 'adventurer'
export type TravelPace = 'slow' | 'moderate' | 'fast'
export type TravelCategory = 'reflective' | 'adventure' | 'cultural' | 'gastronomic' | 'urban'
export type Language = 'ru' | 'en' | 'fr'

export interface Trip {
  id: string
  title: string
  destination: string
  country?: string
  startDate?: string
  endDate?: string
  travelerType?: TravelerType
  summary?: string
  isPublic: boolean
  createdAt: string
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
