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
  caseSubCategory?: string
  presentAge: string
  assignedSocialWorker: string
  currentRiskLevel: string
  reintegrationStatus: string
  /** Demographics */
  gender?: string
  nationality?: string
  religion?: string
  /** Disability */
  hasDisability?: boolean
  disabilityDetails?: string
  /** Family socio-demographic profile */
  is4PsBeneficiary?: boolean
  isSoloParent?: boolean
  isIndigenousGroup?: boolean
  isInformalSettler?: boolean
  /** Admission details */
  admissionDate?: string
  admissionType?: string
  referralSource?: string
  referralAgency?: string
}

export type ResidentActivity = {
  id: number
  residentId: number
  title: string
  date: string
  summary: string
  status?: string
  /** Process recording fields */
  socialWorker?: string
  sessionType?: 'Individual' | 'Group'
  emotionalState?: string
  interventions?: string
  followUpActions?: string
  /** Home visitation fields */
  visitType?: string
  homeEnvironment?: string
  familyCooperation?: string
  safetyConcerns?: string
  /** Case conference fields */
  conferenceType?: string
  attendees?: string
  decisions?: string
  nextConferenceDate?: string
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
    caseSubCategory: 'Sexual exploitation',
    presentAge: '15',
    assignedSocialWorker: 'Janelle Rivera',
    currentRiskLevel: 'High',
    reintegrationStatus: 'Stabilizing',
    gender: 'Female',
    nationality: 'Filipino',
    religion: 'Roman Catholic',
    hasDisability: false,
    is4PsBeneficiary: true,
    isSoloParent: false,
    isIndigenousGroup: false,
    isInformalSettler: true,
    admissionDate: '2026-01-14',
    admissionType: 'Referral from DSWD',
    referralSource: 'Local police rescue operation',
    referralAgency: 'DSWD Region VII',
  },
  {
    residentId: 202,
    caseControlNo: 'LC-2026-002',
    safehouseId: 1,
    caseStatus: 'Active',
    caseCategory: 'Physical abuse',
    caseSubCategory: 'Domestic violence — child victim',
    presentAge: '14',
    assignedSocialWorker: 'Janelle Rivera',
    currentRiskLevel: 'Moderate',
    reintegrationStatus: 'In progress',
    gender: 'Female',
    nationality: 'Filipino',
    religion: 'Evangelical Christian',
    hasDisability: true,
    disabilityDetails: 'Mild hearing impairment — sign language support provided',
    is4PsBeneficiary: false,
    isSoloParent: true,
    isIndigenousGroup: false,
    isInformalSettler: false,
    admissionDate: '2026-02-03',
    admissionType: 'Walk-in with guardian',
    referralSource: 'Barangay council report',
    referralAgency: 'DSWD Region VII',
  },
  {
    residentId: 203,
    caseControlNo: 'LC-2026-003',
    safehouseId: 2,
    caseStatus: 'Reintegration',
    caseCategory: 'Neglected',
    caseSubCategory: 'Child abandonment',
    presentAge: '16',
    assignedSocialWorker: 'Sofia Delgado',
    currentRiskLevel: 'Low',
    reintegrationStatus: 'Near readiness',
    gender: 'Female',
    nationality: 'Filipino',
    religion: 'Roman Catholic',
    hasDisability: false,
    is4PsBeneficiary: true,
    isSoloParent: false,
    isIndigenousGroup: true,
    isInformalSettler: false,
    admissionDate: '2025-11-20',
    admissionType: 'Referral from DSWD',
    referralSource: 'Inter-agency rescue team',
    referralAgency: 'DSWD Region XI',
  },
]

export const mockProcessRecordings: ResidentActivity[] = [
  {
    id: 1,
    residentId: 201,
    title: 'Individual processing session',
    date: '2026-04-02',
    summary: 'Resident identified new safety triggers and practiced grounding exercises with the social worker.',
    socialWorker: 'Maria Santos',
    sessionType: 'Individual',
    emotionalState: 'Anxious but engaged',
    interventions: 'Grounding techniques (5-4-3-2-1), safety trigger mapping, breathing exercises',
    followUpActions: 'Revisit safety plan next session; coordinate with house parent on bedtime routine',
    status: 'Follow up needed',
  },
  {
    id: 2,
    residentId: 201,
    title: 'Group resilience session',
    date: '2026-03-25',
    summary: 'Resident participated consistently and reported better sleep this week. Group dynamics positive.',
    socialWorker: 'Maria Santos',
    sessionType: 'Group',
    emotionalState: 'Calm and participatory',
    interventions: 'Peer storytelling, trust-building activities, group affirmations',
    followUpActions: 'Continue group attendance; note sleep improvement in next individual session',
  },
  {
    id: 3,
    residentId: 202,
    title: 'Individual trauma-focused session',
    date: '2026-04-01',
    summary: 'Initial disclosure processing. Resident expressed significant distress but remained grounded.',
    socialWorker: 'Ana Reyes',
    sessionType: 'Individual',
    emotionalState: 'Distressed but cooperative',
    interventions: 'Active listening, safety affirmation, crisis stabilization protocol',
    followUpActions: 'Daily check-ins for one week; refer to medical for sleep evaluation',
    status: 'Follow up needed',
  },
]

export const mockHomeVisitations: ResidentActivity[] = [
  {
    id: 11,
    residentId: 201,
    title: 'Routine follow-up visit',
    date: '2026-03-30',
    summary: 'Family cooperation improved since last visit. Neighborhood access remains a safety concern.',
    visitType: 'Routine follow-up',
    homeEnvironment: 'Clean and adequately provisioned. Living space suitable for reintegration.',
    familyCooperation: 'High — parents attended meeting and engaged with the reintegration plan.',
    safetyConcerns: 'Unmonitored access to neighborhood near known trafficking area; recommend curfew plan.',
    followUpActions: 'Coordinate with DSWD on neighborhood safety assessment; schedule next visit in 3 weeks.',
    status: 'Schedule next visit',
  },
  {
    id: 12,
    residentId: 201,
    title: 'Initial assessment visit',
    date: '2026-02-14',
    summary: 'First visit to family home. Basic safety standards met. Family expressed willingness to cooperate.',
    visitType: 'Initial assessment',
    homeEnvironment: 'Adequate but crowded. Some repairs needed to bedroom area.',
    familyCooperation: 'Moderate — one parent guarded, other cooperative.',
    safetyConcerns: 'No immediate threats identified. Note one family member with unknown relationship to case.',
    followUpActions: 'Request background check on household members; schedule follow-up in 6 weeks.',
  },
  {
    id: 13,
    residentId: 202,
    title: 'Reintegration assessment visit',
    date: '2026-03-28',
    summary: 'Pre-reintegration check. Family ready; home environment meets safety standards.',
    visitType: 'Reintegration assessment',
    homeEnvironment: 'Well maintained. Dedicated room for the resident. Stable income noted.',
    familyCooperation: 'High — family attended all training sessions and signed safety agreement.',
    safetyConcerns: 'None identified at this time.',
    followUpActions: 'Finalize DSWD placement paperwork; schedule post-placement monitoring at 30 days.',
    status: 'Awaiting DSWD clearance',
  },
]

export const mockCaseConferences: ResidentActivity[] = [
  {
    id: 21,
    residentId: 201,
    title: 'Quarterly case conference',
    date: '2026-04-12',
    summary: 'Review school readiness, placement supports, and family preparedness ahead of potential reintegration.',
    conferenceType: 'Quarterly review',
    attendees: 'Maria Santos (SW), House parent, DSWD representative, School liaison',
    decisions: 'Pending — conference not yet held.',
    nextConferenceDate: '2026-07-12',
    status: 'Upcoming',
  },
  {
    id: 22,
    residentId: 201,
    title: 'Stabilization case conference',
    date: '2026-03-10',
    summary: 'Team aligned on a two-week stabilization plan and mentorship support.',
    conferenceType: 'Stabilization review',
    attendees: 'Maria Santos (SW), Counselor, House parent, Medical officer',
    decisions: 'Approved two-week stabilization plan; added peer mentorship pairing; daily social worker check-ins.',
    nextConferenceDate: '2026-04-12',
  },
  {
    id: 23,
    residentId: 202,
    title: 'Reintegration planning conference',
    date: '2026-04-03',
    summary: 'Confirmed family readiness. Reintegration timeline set for late April.',
    conferenceType: 'Reintegration planning',
    attendees: 'Ana Reyes (SW), DSWD officer, Family representative, Counselor',
    decisions: 'Approved reintegration plan. Post-placement monitoring at 30 and 90 days. Family training completed.',
    nextConferenceDate: '2026-05-03',
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
