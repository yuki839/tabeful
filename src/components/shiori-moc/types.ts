export enum DesignPattern {
  Modern = 'modern',
  Timeline = 'timeline',
  MapSplit = 'mapsplit',
  Magazine = 'magazine',
  Cards = 'cards',
  Kanban = 'kanban'
}

export interface ItineraryItem {
  id: string;
  time: string;
  title: string;
  description: string;
  category: 'food' | 'sightseeing' | 'shop' | 'transport';
  categoryLabel?: string;
  imageUrl?: string;
  address?: string;
  rating?: number;
  priceRange?: string;
  placeId?: string;
  bookmarkItemId?: string;
  lat?: number | null;
  lng?: number | null;
}

export interface ShioriData {
  title: string;
  date: string;
  coverImage: string;
  items: ItineraryItem[];
}

export interface ThemeConfig {
  id: string;
  bgTexture: string;
  bookClass: string;
  pageLeftClass: string;
  pageRightClass: string;
  spineClass: string;
  fontHeading: string;
  fontBody: string;
  accentColor: string;
  mapStyle: 'default' | 'sepia' | 'pop' | 'grayscale' | string;
}
