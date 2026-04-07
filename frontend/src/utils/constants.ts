import type { ImpactMetricsPublic, PublicDonationSummary } from '../data/mockData'

export const impactCurrency = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0,
})

export const emptyImpactMetrics: ImpactMetricsPublic = { donationCount: 0, totalDonationAmount: 0, residentCount: 0, safehouseCount: 0 }
export const emptyDonationSummary: PublicDonationSummary = { summaries: [] }

export const IMPACT_SUPPORT_COLORS: Record<string, string> = {
  monetary: '#7a2e2e',
  'in kind': '#2f6b67',
  time: '#d97706',
  'social media': '#3b82f6',
  skills: '#8b5cf6',
}

export const IMPACT_SUPPORT_TOOLTIPS: Record<string, string> = {
  monetary: 'Direct financial contributions used for safehouse operations, staff, and resident care.',
  'in kind': 'Physical goods such as food, clothing, school supplies, and hygiene kits.',
  time: 'Volunteer hours spent on mentorship, tutoring, and hands-on safehouse support.',
  'social media': 'Awareness campaigns and shares that expand reach and attract new supporters.',
  skills: 'Pro-bono professional services like counseling, legal aid, and medical care.',
}
