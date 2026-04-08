/** Static assets served from `frontend/public/images` (see repo root `images/`). */
export const siteImages = {
  logo: '/images/minimalist-logo.png',
  homeHero: '/images/pexels-photo-296282.jpeg',
  featureStory: '/images/together.webp',
  featureOps: '/images/group.jpg',
  featureMl: '/images/conference.jpg',
  programCaring: '/images/baby.jpg',
  programHealing: '/images/journal.webp',
  programTeaching: '/images/paintings.jpg',
  donate: '/images/PinkPantsArmsUpByOcean.jpg',
  heroDetail: '/images/sitting.jpg',
  impactBanner: '/images/medical.jpg',
  impactHero: '/images/HoldingHandsAtBeach.jpg',
  handsCircle: '/images/Hands_Circle.jpg',
  gallery: [
    '/images/HoldingHandsAtBeach.jpg',
    '/images/girls.jpeg',
    '/images/SunsetArmsUp.jpg',
    '/images/sitting.jpg',
  ],
} as const

export type DirectorPhoto = {
  src: string
  name: string
  title?: string
  objectPosition?: string
}

export const directorPhotos: DirectorPhoto[] = [
  {
    src: '/images/directors/elena.png',
    name: 'Elena Vance',
    title: 'President / Co-Founder',
    objectPosition: '50% 44%',
  },
  {
    src: '/images/directors/marcus.png',
    name: 'Marcus Thorne',
    title: 'Vice President',
    objectPosition: '50% 22%',
  },
  {
    src: '/images/directors/sienna.png',
    name: 'Sienna Brooks',
    title: 'Secretary of the Board',
    objectPosition: '56% 24%',
  },
  {
    src: '/images/directors/amara.png',
    name: 'Amara Okafor',
    title: 'Board Member',
    objectPosition: '54% 22%',
  },
  {
    src: '/images/directors/david.png',
    name: 'David Sterling',
    title: 'Board Member',
    objectPosition: '55% 24%',
  },
  {
    src: '/images/directors/maya.png',
    name: 'Maya Chen',
    title: 'Board Member',
    objectPosition: '46% 22%',
  },
  {
    src: '/images/directors/julian.png',
    name: 'Julian Voss',
    title: 'Board Member',
    objectPosition: '50% 22%',
  },
]
