import type { ReactElement } from 'react'

type SocialIconProps = { className?: string }

function InstagramIcon({ className }: SocialIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  )
}

function FacebookIcon({ className }: SocialIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z" />
    </svg>
  )
}

function EmailIcon({ className }: SocialIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  )
}

export type SocialStory = {
  title: string
  summary: string
  label: string
  image: string
  alt: string
  objectPosition?: string
}

export type SocialUpdate = {
  title: string
  label: string
  image: string
  alt: string
  objectPosition?: string
}

export type SocialFollowOption = {
  name: string
  handle: string
  href: string
  description: string
  colorClass: string
  icon: ReactElement
}

export const featuredStory: SocialStory = {
  title: 'Protection, partnership, and the people behind every safe step forward',
  summary:
    'This moment reflects what real support looks like on the ground. Local authorities, caregivers, and community partners working together to ensure safety, stability, and the next step forward. Progress does not happen alone. It happens through coordination, trust, and people willing to show up.',
  label: 'FIELD MOMENT · APRIL 2026',
  image: '/images/friends.jpg',
  alt: 'Young women smiling together outdoors',
  objectPosition: 'center 40%',
}

export const recentUpdates: SocialUpdate[] = [
  {
    title: 'Spring donations turned into school supplies and medical support.',
    label: 'Facebook · 3 days ago',
    image: '/images/beachtime.jpg',
    alt: 'Children on the beach together',
    objectPosition: 'center 46%',
  },
  {
    title: 'A quiet art session showed what healing can look like in ordinary moments.',
    label: 'Instagram · 5 days ago',
    image: '/images/paintings.jpg',
    alt: 'Art materials and colorful paintings',
    objectPosition: 'center 50%',
  },
  {
    title: 'Volunteers spent the afternoon preparing bracelets for the next outreach event.',
    label: 'Facebook · 1 week ago',
    image: '/images/bracelets.jpeg',
    alt: 'Bracelets laid out for a community event',
    objectPosition: 'center 45%',
  },
  {
    title: 'Our team shared a behind-the-scenes glimpse of morning routines at the safehouse.',
    label: 'Instagram · 1 week ago',
    image: '/images/group.jpg',
    alt: 'A group gathered together indoors',
    objectPosition: 'center 42%',
  },
  {
    title: 'A new reflection video invited supporters to hear what home means after trauma.',
    label: 'Facebook · 2 weeks ago',
    image: '/images/duo.jpg',
    alt: 'Two people standing together outside',
    objectPosition: 'center 58%',
  },
  {
    title: 'Community partners helped restock essentials for the month ahead.',
    label: 'Instagram · 2 weeks ago',
    image: '/images/service.jpg',
    alt: 'People serving together in a community setting',
    objectPosition: 'center 48%',
  },
]

export const socialFollowOptions: SocialFollowOption[] = [
  {
    name: 'Instagram',
    handle: '@beacon.sanctuary',
    href: 'https://www.instagram.com/beacon.sanctuary',
    description: 'Photo stories and day-to-day moments from Beacon.',
    colorClass: 'social-card-ig',
    icon: <InstagramIcon />,
  },
  {
    name: 'Facebook',
    handle: 'Beacon Sanctuary',
    href: 'https://www.facebook.com/BeaconSanctuary',
    description: 'Updates, community news, and campaign milestones.',
    colorClass: 'social-card-fb',
    icon: <FacebookIcon />,
  },
  {
    name: 'Email updates',
    handle: 'info@beaconsanctuary.org',
    href: 'mailto:info@beaconsanctuary.org',
    description: 'Receive major stories and ways to support Beacon.',
    colorClass: 'social-card-email',
    icon: <EmailIcon />,
  },
]
