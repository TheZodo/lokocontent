export interface VideoContent {
  id: string;
  title: string;
  creator: string;
  creatorId?: string;
  creatorProfilePicture?: string | null;
  thumbnail: string;
  duration: string;
  rating: number;
  ratingCount?: number;
  isPremium: boolean;
  region: string;
  category: string;
  synopsis: string;
  views: string;
  viewsCount?: number;
  releaseYear: number;
  muxPlaybackId?: string | null;
  muxAssetId?: string | null;
  trailerMuxPlaybackId?: string | null;
  isOwned?: boolean;
  userRating?: number | null;
  price?: number | null;
}

export interface Region {
  id: string;
  name: string;
  flag: string;
}

export interface Category {
  id: string;
  name: string;
}

export const regions: Region[] = [
  { id: "all", name: "All Regions", flag: "🌍" },
  { id: "nollywood", name: "Nollywood", flag: "🇳🇬" },
  { id: "riverwood", name: "Riverwood", flag: "🇰🇪" },
  { id: "south-africa", name: "South Africa", flag: "🇿🇦" },
  { id: "ghana", name: "Ghana", flag: "🇬🇭" },
  { id: "tanzania", name: "Tanzania", flag: "🇹🇿" },
  { id: "uganda", name: "Uganda", flag: "🇺🇬" },
];

export const categories: Category[] = [
  { id: "all", name: "All" },
  { id: "short-films", name: "Short Films" },
  { id: "documentaries", name: "Documentaries" },
  { id: "drama", name: "Drama" },
  { id: "comedy", name: "Comedy" },
  { id: "music-videos", name: "Music Videos" },
  { id: "animation", name: "Animation" },
];
