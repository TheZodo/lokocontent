export interface VideoContent {
  id: string;
  title: string;
  creator: string;
  thumbnail: string;
  duration: string;
  rating: number;
  isPremium: boolean;
  region: string;
  category: string;
  synopsis: string;
  views: string;
  releaseYear: number;
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

export const featuredContent: VideoContent[] = [
  {
    id: "featured-1",
    title: "The Lion's Journey",
    creator: "Amara Studios",
    thumbnail: "/placeholder.svg?height=600&width=1200",
    duration: "1h 45m",
    rating: 4.8,
    isPremium: true,
    region: "nollywood",
    category: "drama",
    synopsis:
      "A powerful story of resilience and redemption set in the vibrant streets of Lagos, following a young man's quest to reclaim his family's honor.",
    views: "2.4M",
    releaseYear: 2024,
  },
  {
    id: "featured-2",
    title: "Savanna Dreams",
    creator: "Maasai Films",
    thumbnail: "/placeholder.svg?height=600&width=1200",
    duration: "2h 10m",
    rating: 4.9,
    isPremium: true,
    region: "riverwood",
    category: "drama",
    synopsis:
      "An epic tale of love and tradition in the Kenyan highlands, where ancient customs clash with modern aspirations.",
    views: "1.8M",
    releaseYear: 2024,
  },
  {
    id: "featured-3",
    title: "Ubuntu Rising",
    creator: "Cape Town Creatives",
    thumbnail: "/placeholder.svg?height=600&width=1200",
    duration: "1h 55m",
    rating: 4.7,
    isPremium: false,
    region: "south-africa",
    category: "documentaries",
    synopsis:
      "A groundbreaking documentary exploring the philosophy of Ubuntu and its relevance in contemporary African society.",
    views: "3.1M",
    releaseYear: 2024,
  },
];

export const trendingContent: VideoContent[] = [
  {
    id: "trend-1",
    title: "Accra After Dark",
    creator: "GoldCoast Pictures",
    thumbnail: "/placeholder.svg?height=400&width=300",
    duration: "52m",
    rating: 4.6,
    isPremium: true,
    region: "ghana",
    category: "short-films",
    synopsis:
      "A thrilling short film set in the nightlife of Accra, exploring themes of identity and ambition.",
    views: "890K",
    releaseYear: 2024,
  },
  {
    id: "trend-2",
    title: "The Griot's Tale",
    creator: "Sahel Productions",
    thumbnail: "/placeholder.svg?height=400&width=300",
    duration: "1h 20m",
    rating: 4.9,
    isPremium: true,
    region: "nollywood",
    category: "drama",
    synopsis:
      "A master storyteller passes down ancient wisdom through captivating narratives that span generations.",
    views: "1.2M",
    releaseYear: 2024,
  },
  {
    id: "trend-3",
    title: "Nairobi Hustle",
    creator: "Swahili Studios",
    thumbnail: "/placeholder.svg?height=400&width=300",
    duration: "1h 35m",
    rating: 4.5,
    isPremium: false,
    region: "riverwood",
    category: "comedy",
    synopsis:
      "A hilarious comedy following three friends navigating the chaos of Nairobi's startup scene.",
    views: "2.1M",
    releaseYear: 2024,
  },
  {
    id: "trend-4",
    title: "Ancestral Echoes",
    creator: "Zulu Heritage Films",
    thumbnail: "/placeholder.svg?height=400&width=300",
    duration: "1h 48m",
    rating: 4.8,
    isPremium: true,
    region: "south-africa",
    category: "drama",
    synopsis:
      "A mystical journey connecting a young woman to her ancestors through dreams and visions.",
    views: "1.5M",
    releaseYear: 2024,
  },
  {
    id: "trend-5",
    title: "Kilimanjaro Rising",
    creator: "Bongo Films",
    thumbnail: "/placeholder.svg?height=400&width=300",
    duration: "2h 05m",
    rating: 4.7,
    isPremium: true,
    region: "tanzania",
    category: "documentaries",
    synopsis:
      "An inspiring documentary following climbers from across Africa conquering the continent's highest peak.",
    views: "980K",
    releaseYear: 2024,
  },
  {
    id: "trend-6",
    title: "Kampala Kings",
    creator: "Pearl Productions",
    thumbnail: "/placeholder.svg?height=400&width=300",
    duration: "1h 42m",
    rating: 4.4,
    isPremium: false,
    region: "uganda",
    category: "drama",
    synopsis:
      "A gritty drama about rival music producers battling for supremacy in Uganda's vibrant music industry.",
    views: "750K",
    releaseYear: 2024,
  },
];

export const newReleases: VideoContent[] = [
  {
    id: "new-1",
    title: "Drums of Freedom",
    creator: "Afrobeat Studios",
    thumbnail: "/placeholder.svg?height=400&width=300",
    duration: "28m",
    rating: 4.9,
    isPremium: true,
    region: "nollywood",
    category: "music-videos",
    synopsis:
      "A visually stunning music film celebrating African musical heritage and its global influence.",
    views: "450K",
    releaseYear: 2025,
  },
  {
    id: "new-2",
    title: "The Water Bearers",
    creator: "Rift Valley Films",
    thumbnail: "/placeholder.svg?height=400&width=300",
    duration: "1h 15m",
    rating: 4.6,
    isPremium: true,
    region: "riverwood",
    category: "documentaries",
    synopsis:
      "A moving documentary about women's daily journey to fetch water in rural Kenya.",
    views: "320K",
    releaseYear: 2025,
  },
  {
    id: "new-3",
    title: "Johannesburg Junction",
    creator: "Jozi Films",
    thumbnail: "/placeholder.svg?height=400&width=300",
    duration: "1h 52m",
    rating: 4.7,
    isPremium: false,
    region: "south-africa",
    category: "drama",
    synopsis:
      "Lives intertwine at a busy Johannesburg intersection, revealing stories of hope and struggle.",
    views: "680K",
    releaseYear: 2025,
  },
  {
    id: "new-4",
    title: "Kente Dreams",
    creator: "Ashanti Pictures",
    thumbnail: "/placeholder.svg?height=400&width=300",
    duration: "45m",
    rating: 4.5,
    isPremium: true,
    region: "ghana",
    category: "short-films",
    synopsis:
      "A young weaver discovers magical powers hidden within ancient Kente cloth patterns.",
    views: "290K",
    releaseYear: 2025,
  },
  {
    id: "new-5",
    title: "Serengeti Spirits",
    creator: "Wildlands Media",
    thumbnail: "/placeholder.svg?height=400&width=300",
    duration: "1h 30m",
    rating: 4.8,
    isPremium: true,
    region: "tanzania",
    category: "animation",
    synopsis:
      "An animated adventure following animal spirits protecting the Serengeti from modern threats.",
    views: "510K",
    releaseYear: 2025,
  },
  {
    id: "new-6",
    title: "Laughter in Lagos",
    creator: "Naija Comedy",
    thumbnail: "/placeholder.svg?height=400&width=300",
    duration: "1h 05m",
    rating: 4.3,
    isPremium: false,
    region: "nollywood",
    category: "comedy",
    synopsis:
      "A stand-up special featuring Nigeria's top comedians performing at a sold-out Lagos venue.",
    views: "1.1M",
    releaseYear: 2025,
  },
];

export const shortFilms: VideoContent[] = [
  {
    id: "short-1",
    title: "The Last Baobab",
    creator: "Sahara Shorts",
    thumbnail: "/placeholder.svg?height=400&width=300",
    duration: "18m",
    rating: 4.9,
    isPremium: true,
    region: "nollywood",
    category: "short-films",
    synopsis:
      "A poetic meditation on environmental change through the eyes of an ancient baobab tree.",
    views: "180K",
    releaseYear: 2024,
  },
  {
    id: "short-2",
    title: "Matatu Moments",
    creator: "Nairobi Shorts",
    thumbnail: "/placeholder.svg?height=400&width=300",
    duration: "22m",
    rating: 4.6,
    isPremium: false,
    region: "riverwood",
    category: "short-films",
    synopsis:
      "Slice-of-life vignettes captured during a day aboard Nairobi's colorful matatu buses.",
    views: "240K",
    releaseYear: 2024,
  },
  {
    id: "short-3",
    title: "Township Tales",
    creator: "Soweto Stories",
    thumbnail: "/placeholder.svg?height=400&width=300",
    duration: "25m",
    rating: 4.7,
    isPremium: true,
    region: "south-africa",
    category: "short-films",
    synopsis:
      "Three interconnected stories of love, loss, and hope in a Johannesburg township.",
    views: "310K",
    releaseYear: 2024,
  },
  {
    id: "short-4",
    title: "The Fisherman's Daughter",
    creator: "Volta Films",
    thumbnail: "/placeholder.svg?height=400&width=300",
    duration: "30m",
    rating: 4.8,
    isPremium: true,
    region: "ghana",
    category: "short-films",
    synopsis:
      "A young girl challenges traditions to follow her dreams of becoming a sea captain.",
    views: "195K",
    releaseYear: 2024,
  },
  {
    id: "short-5",
    title: "Spice Islands",
    creator: "Zanzibar Cinema",
    thumbnail: "/placeholder.svg?height=400&width=300",
    duration: "35m",
    rating: 4.5,
    isPremium: false,
    region: "tanzania",
    category: "short-films",
    synopsis:
      "A sensory journey through Zanzibar's spice markets and the people who keep traditions alive.",
    views: "165K",
    releaseYear: 2024,
  },
  {
    id: "short-6",
    title: "Boda Boda Blues",
    creator: "Kampala Shorts",
    thumbnail: "/placeholder.svg?height=400&width=300",
    duration: "20m",
    rating: 4.4,
    isPremium: true,
    region: "uganda",
    category: "short-films",
    synopsis:
      "A motorcycle taxi driver's philosophical conversations with passengers across Kampala.",
    views: "140K",
    releaseYear: 2024,
  },
];
