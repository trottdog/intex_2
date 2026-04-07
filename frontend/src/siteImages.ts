/** Static assets served from `frontend/public/images` (see repo root `images/`). */
export const siteImages = {
  logo: '/images/minimalist-logo.png',
  homeHero: '/images/Hands_Circle.jpg',
  featureStory: '/images/together.webp',
  featureOps: '/images/group.jpg',
  featureMl: '/images/conference.jpg',
  programCaring: '/images/baby.jpg',
  programHealing: '/images/journal.webp',
  programTeaching: '/images/paintings.jpg',
  donate: '/images/PinkPantsArmsUpByOcean.jpg',
  impactBanner: '/images/medical.jpg',
  impactHero: '/images/HoldingHandsAtBeach.jpg',
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
    src: '/images/directors/julie.jpg',
    name: 'Julie Hernando',
    title: 'President / Co-Founder',
    objectPosition: 'center 24%',
  },
  {
    src: '/images/directors/Lance-Platt-Headshot-scaled.jpg',
    name: 'Lance Platt',
    title: 'Vice President',
    objectPosition: 'center 20%',
  },
  {
    src: '/images/directors/candace.jpeg',
    name: 'Candace Kunze',
    title: 'Secretary of the Board',
    objectPosition: 'center 22%',
  },
  {
    src: '/images/directors/KalliWilson.jpg',
    name: 'Kalli Kamauoha-Wilson',
    title: 'Board Member',
    objectPosition: 'center 16%',
  },
  {
    src: '/images/directors/Russell-Osguthorpe_lighthouse.jpg',
    name: 'Russell J. Osguthorpe',
    title: 'Board Member',
    objectPosition: 'center 10%',
  },
  {
    src: '/images/directors/Apple-Lanman_lighthouse.jpeg',
    name: 'Apple Lanman',
    title: 'Board Member',
    objectPosition: 'center 24%',
  },
  {
    src: '/images/directors/StevenTwoCleanedUp.jpeg',
    name: 'Steven Shraedel',
    title: 'Board Member',
    objectPosition: 'center 18%',
  },
]
