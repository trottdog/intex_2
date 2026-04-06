import type { PublicImpactSnapshotMock } from '../types/publicImpactSnapshot'

export type Supporter = {
  supporterId: number
  displayName: string
  supporterType: string
  region: string
  status: string
  email: string
  acquisitionChannel: string
}

export type Donation = {
  donationId: number
  supporterId: number
  donationType: string
  donationDate: string
  amount: number
  campaignName: string
  impactUnit: string
  channelSource: string
  isRecurring: boolean
}

export type DonationAllocation = {
  allocationId: number
  donationId: number
  safehouseId: number
  programArea: string
  amountAllocated: number
  allocationDate: string
}

export type InKindItem = {
  itemId: number
  donationId: number
  itemName: string
  itemCategory: string
  quantity: number
  unitOfMeasure: string
}

export type Resident = {
  residentId: number
  caseControlNo: string
  safehouseId: number
  caseStatus: string
  caseCategory: string
  presentAge: string
  assignedSocialWorker: string
  currentRiskLevel: string
  reintegrationStatus: string
}

export type ResidentActivity = {
  id: number
  residentId: number
  title: string
  date: string
  summary: string
  status?: string
}

export type Safehouse = {
  safehouseId: number
  safehouseCode: string
  name: string
  region: string
  city: string
  status: string
  currentOccupancy: number
  capacityGirls: number
}

export type SafehouseMetric = {
  metricId: number
  safehouseId: number
  reportMonth: string
  activeResidents: number
  staffCount: number
  schoolEnrollmentRate: number
}

export type Partner = {
  partnerId: number
  partnerName: string
  partnerType: string
  roleType: string
  region: string
  status: string
}

export type PartnerAssignment = {
  assignmentId: number
  partnerId: number
  safehouseId: number
  assignmentType: string
  status: string
}

export type SocialMediaPost = {
  postId: number
  platform: string
  contentTopic: string
  createdAt: string
  engagementRate: number
  /** API may omit or null this field. */
  donationReferrals?: number | null
}

/** Prepared mock impact rows (aligned with `PublicImpactSnapshotMock`). */
export type PublicImpactSnapshot = PublicImpactSnapshotMock

export const mockSupporters: Supporter[] = [
  {
    supporterId: 101,
    displayName: 'Maya Thompson',
    supporterType: 'Monetary donor',
    region: 'Utah',
    status: 'Active',
    email: 'maya@example.org',
    acquisitionChannel: 'Impact event',
  },
  {
    supporterId: 102,
    displayName: 'Bridgewell Foundation',
    supporterType: 'Foundation',
    region: 'Colorado',
    status: 'Active',
    email: 'grants@bridgewell.org',
    acquisitionChannel: 'Partner referral',
  },
  {
    supporterId: 103,
    displayName: 'Avery Collins',
    supporterType: 'Volunteer donor',
    region: 'Arizona',
    status: 'At risk',
    email: 'avery@example.org',
    acquisitionChannel: 'Instagram',
  },
]

export const mockDonations: Donation[] = [
  {
    donationId: 5001,
    supporterId: 101,
    donationType: 'Monetary',
    donationDate: '2026-03-02',
    amount: 500,
    campaignName: 'Spring Stability Fund',
    impactUnit: 'Emergency care days',
    channelSource: 'Website',
    isRecurring: false,
  },
  {
    donationId: 5002,
    supporterId: 102,
    donationType: 'Monetary',
    donationDate: '2026-03-18',
    amount: 5000,
    campaignName: 'Safehouse Readiness',
    impactUnit: 'Safehouse upgrades',
    channelSource: 'Development outreach',
    isRecurring: true,
  },
  {
    donationId: 5003,
    supporterId: 103,
    donationType: 'In kind',
    donationDate: '2026-03-28',
    amount: 850,
    campaignName: 'Back to School',
    impactUnit: 'Student supply kits',
    channelSource: 'Instagram',
    isRecurring: false,
  },
]

export const mockDonationAllocations: DonationAllocation[] = [
  {
    allocationId: 9001,
    donationId: 5001,
    safehouseId: 1,
    programArea: 'Caring',
    amountAllocated: 300,
    allocationDate: '2026-03-03',
  },
  {
    allocationId: 9002,
    donationId: 5001,
    safehouseId: 2,
    programArea: 'Healing',
    amountAllocated: 200,
    allocationDate: '2026-03-03',
  },
  {
    allocationId: 9003,
    donationId: 5002,
    safehouseId: 1,
    programArea: 'Teaching',
    amountAllocated: 5000,
    allocationDate: '2026-03-18',
  },
]

export const mockInKindItems: InKindItem[] = [
  {
    itemId: 8101,
    donationId: 5003,
    itemName: 'School supply kits',
    itemCategory: 'Education',
    quantity: 25,
    unitOfMeasure: 'kits',
  },
]

export const mockResidents: Resident[] = [
  {
    residentId: 201,
    caseControlNo: 'LC-2026-001',
    safehouseId: 1,
    caseStatus: 'Active',
    caseCategory: 'Trafficked',
    presentAge: '15',
    assignedSocialWorker: 'Janelle Rivera',
    currentRiskLevel: 'High',
    reintegrationStatus: 'Stabilizing',
  },
  {
    residentId: 202,
    caseControlNo: 'LC-2026-002',
    safehouseId: 1,
    caseStatus: 'Active',
    caseCategory: 'Physical abuse',
    presentAge: '14',
    assignedSocialWorker: 'Janelle Rivera',
    currentRiskLevel: 'Moderate',
    reintegrationStatus: 'In progress',
  },
  {
    residentId: 203,
    caseControlNo: 'LC-2026-003',
    safehouseId: 2,
    caseStatus: 'Reintegration',
    caseCategory: 'At risk',
    presentAge: '16',
    assignedSocialWorker: 'Sofia Delgado',
    currentRiskLevel: 'Low',
    reintegrationStatus: 'Near readiness',
  },
]

export const mockProcessRecordings: ResidentActivity[] = [
  {
    id: 1,
    residentId: 201,
    title: 'Individual processing session',
    date: '2026-04-02',
    summary: 'Resident identified new safety triggers and practiced grounding exercises.',
    status: 'Follow up needed',
  },
  {
    id: 2,
    residentId: 201,
    title: 'Group resilience session',
    date: '2026-03-25',
    summary: 'Resident participated consistently and reported better sleep this week.',
  },
]

export const mockHomeVisitations: ResidentActivity[] = [
  {
    id: 11,
    residentId: 201,
    title: 'Routine follow-up visit',
    date: '2026-03-30',
    summary: 'Family cooperation improved. Safety concerns remain around neighborhood access.',
    status: 'Schedule next visit',
  },
]

export const mockCaseConferences: ResidentActivity[] = [
  {
    id: 21,
    residentId: 201,
    title: 'Upcoming case conference',
    date: '2026-04-12',
    summary: 'Review school readiness, placement supports, and family preparedness.',
    status: 'Upcoming',
  },
  {
    id: 22,
    residentId: 201,
    title: 'Case conference summary',
    date: '2026-03-10',
    summary: 'Team aligned on a two-week stabilization plan and mentorship support.',
  },
]

export const mockEducationRecords: ResidentActivity[] = [
  {
    id: 31,
    residentId: 201,
    title: 'School readiness checkpoint',
    date: '2026-03-22',
    summary: 'Attendance up, reading support still needed, confidence improving.',
  },
]

export const mockHealthRecords: ResidentActivity[] = [
  {
    id: 41,
    residentId: 201,
    title: 'Wellbeing review',
    date: '2026-03-20',
    summary: 'Energy and sleep scores improved after routine change.',
  },
]

export const mockIncidentReports: ResidentActivity[] = [
  {
    id: 51,
    residentId: 201,
    title: 'Escalation incident',
    date: '2026-03-09',
    summary: 'Resolved within same day. Added coping plan and counselor follow-up.',
    status: 'Resolved',
  },
]

export const mockInterventionPlans: ResidentActivity[] = [
  {
    id: 61,
    residentId: 201,
    title: 'Stabilization plan',
    date: '2026-03-11',
    summary: 'Focus on sleep, trust-building, and academic re-entry readiness.',
    status: 'Active',
  },
]

export const mockSafehouses: Safehouse[] = [
  {
    safehouseId: 1,
    safehouseCode: 'SH-001',
    name: 'Hope House Manila',
    region: 'Metro Manila',
    city: 'Quezon City',
    status: 'Open',
    currentOccupancy: 18,
    capacityGirls: 22,
  },
  {
    safehouseId: 2,
    safehouseCode: 'SH-002',
    name: 'Horizon House Cebu',
    region: 'Central Visayas',
    city: 'Cebu City',
    status: 'Open',
    currentOccupancy: 12,
    capacityGirls: 18,
  },
]

export const mockSafehouseMetrics: SafehouseMetric[] = [
  {
    metricId: 1,
    safehouseId: 1,
    reportMonth: '2026-03',
    activeResidents: 18,
    staffCount: 10,
    schoolEnrollmentRate: 0.78,
  },
  {
    metricId: 2,
    safehouseId: 2,
    reportMonth: '2026-03',
    activeResidents: 12,
    staffCount: 7,
    schoolEnrollmentRate: 0.83,
  },
]

export const mockPartners: Partner[] = [
  {
    partnerId: 1,
    partnerName: 'Cebu Family Services',
    partnerType: 'Agency',
    roleType: 'Referral and case coordination',
    region: 'Central Visayas',
    status: 'Active',
  },
  {
    partnerId: 2,
    partnerName: 'Bright Horizons School Network',
    partnerType: 'Education',
    roleType: 'School placement',
    region: 'Metro Manila',
    status: 'Active',
  },
]

export const mockPartnerAssignments: PartnerAssignment[] = [
  {
    assignmentId: 1,
    partnerId: 1,
    safehouseId: 2,
    assignmentType: 'Referral pathway',
    status: 'Active',
  },
  {
    assignmentId: 2,
    partnerId: 2,
    safehouseId: 1,
    assignmentType: 'Academic placement',
    status: 'Active',
  },
]

/** Matches GET /public/impact and related DTOs from the .NET API. */
export type ImpactMetricsPublic = {
  donationCount: number
  totalDonationAmount: number
  residentCount: number
  safehouseCount: number
}

export type PublicDonationSummary = {
  summaries: Array<{
    donationType: string
    count: number
    amount: number
  }>
}

/** Stable fallbacks when the API is unreachable (offline preview only). */
export const impactMetricsFallback: ImpactMetricsPublic = {
  donationCount: 146,
  totalDonationAmount: 28750,
  residentCount: 47,
  safehouseCount: 2,
}

export const impactDonationSummaryFallback: PublicDonationSummary = {
  summaries: [
    { donationType: 'Monetary', count: 28, amount: 24250 },
    { donationType: 'In kind', count: 9, amount: 4500 },
  ],
}

export const mockSocialPosts: SocialMediaPost[] = [
  {
    postId: 1,
    platform: 'Instagram',
    contentTopic: 'Resident education support',
    createdAt: '2026-03-21',
    engagementRate: 0.12,
    donationReferrals: 18,
  },
  {
    postId: 2,
    platform: 'Facebook',
    contentTopic: 'Safehouse renovation update',
    createdAt: '2026-03-27',
    engagementRate: 0.08,
    donationReferrals: 9,
  },
]

export const mockImpactSnapshots: PublicImpactSnapshot[] = [
  {
    snapshotId: 1,
    snapshotDate: '2026-03-31',
    headline: 'Quarterly impact overview',
    residentsServed: 47,
    reintegrationRate: 0.64,
  },
]
