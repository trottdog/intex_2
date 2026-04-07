/** Static assets served from `frontend/public/images` (see repo root `images/`). */
export const siteImages = {
  logo: '/images/logo.png',
  homeHero: '/images/Hands_Circle.jpg',
  featureStory: '/images/HoldingHandsAtBeach.jpg',
  featureOps: '/images/girls.jpeg',
  featureMl: '/images/SunsetArmsUp.jpg',
  programCaring: '/images/sitting.jpg',
  programHealing: '/images/meditation.jpg',
  programTeaching: '/images/parola.jpg',
  donate: '/images/bracelets.jpeg',
  impactBanner: '/images/PinkShirtPinkFlower-768x705.jpg',
  /** Extra home gallery stills */
  gallery: [
    '/images/BlueWhiteSpotsWStar.jpg',
    '/images/GreenGrassFingerStar-e1741389539890.jpg',
    '/images/BackwardsJump-e1741389606772.jpg',
    '/images/medical.jpg',
  ],
} as const

export type DirectorPhoto = { src: string; name: string; title?: string }

export const directorPhotos: DirectorPhoto[] = [
  { src: '/images/directors/julie.jpg', name: 'Julie Hernando', title: 'President / Co-Founder' },
  { src: '/images/directors/Lance-Platt-Headshot-scaled.jpg', name: 'Lance Platt', title: 'Vice President' },
  { src: '/images/directors/candace.jpeg', name: 'Candace Kunze', title: 'Secretary of the Board' },
  { src: '/images/directors/KalliWilson.jpg', name: 'Kalli Kamauoha-Wilson', title: 'Board Member' },
  { src: '/images/directors/Russell-Osguthorpe_lighthouse.jpg', name: 'Russell J. Osguthorpe', title: 'Board Member' },
  { src: '/images/directors/Apple-Lanman_lighthouse.jpeg', name: 'Apple Lanman', title: 'Board Member' },
  { src: '/images/directors/StevenTwoCleanedUp.jpeg', name: 'Steven Shraedel', title: 'Board Member' },
]
