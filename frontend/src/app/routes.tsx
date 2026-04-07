import type { ReactElement } from 'react'
import type { UserRole } from './session'
import { matchPath } from './router'

import { HomePage } from '../pages/public/HomePage'
import { ImpactPage } from '../pages/public/ImpactPage'
import { OrganizationPage } from '../pages/public/OrganizationPage'
import { MeetUsPage } from '../pages/public/MeetUsPage'
import { SocialPage } from '../pages/public/SocialPage'
import { DonatePage } from '../pages/public/DonatePage'
import { LoginPage } from '../pages/public/LoginPage'
import { PrivacyPage } from '../pages/public/PrivacyPage'
import { CookiePage } from '../pages/public/CookiePage'
import { NotFoundPage } from '../pages/public/NotFoundPage'

import { RoleRedirectPage } from '../pages/auth/RoleRedirectPage'
import { AccountPage } from '../pages/auth/AccountPage'
import { SecurityPage } from '../pages/auth/SecurityPage'
import { ForbiddenPage } from '../pages/auth/ForbiddenPage'

import { DonorDashboardPage } from '../pages/donor/DonorDashboardPage'
import { DonorHistoryPage } from '../pages/donor/DonorHistoryPage'
import { DonorDonationDetailPage } from '../pages/donor/DonorDonationDetailPage'
import { DonorImpactPage } from '../pages/donor/DonorImpactPage'
import { DonorProfilePage } from '../pages/donor/DonorProfilePage'

import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage'
import { CaseloadPage } from '../pages/admin/CaseloadPage'
import { ResidentDetailPage } from '../pages/admin/ResidentDetailPage'
import { ResidentSubpageLive } from '../pages/admin/ResidentSubpageLive'
import { ProcessRecordingsPage } from '../pages/admin/ProcessRecordingsPage'
import { HomeVisitationsPage } from '../pages/admin/HomeVisitationsPage'
import { CaseConferencesPage } from '../pages/admin/CaseConferencesPage'
import { DonorsPage } from '../pages/admin/DonorsPage'
import { ContributionsPage } from '../pages/admin/ContributionsPage'
import { ContributionDetailPage } from '../pages/admin/ContributionDetailPage'
import { SafehousesPage } from '../pages/admin/SafehousesPage'
import { SafehouseDetailPage } from '../pages/admin/SafehouseDetailPage'
import { PartnersPage } from '../pages/admin/PartnersPage'
import { ReportsPage } from '../pages/admin/ReportsPage'
import { OutreachPage } from '../pages/admin/OutreachPage'

import { SuperAdminDashboardPage } from '../pages/super-admin/SuperAdminDashboardPage'
import { FacilitiesPage } from '../pages/super-admin/FacilitiesPage'
import { UsersPage } from '../pages/super-admin/UsersPage'
import { RolesPage } from '../pages/super-admin/RolesPage'
import { AccessPoliciesPage } from '../pages/super-admin/AccessPoliciesPage'
import { SuperAdminReportsPage } from '../pages/super-admin/SuperAdminReportsPage'
import { AuditPage } from '../pages/super-admin/AuditPage'

export function resolveRoute(pathname: string, role: UserRole) {
  const residentSections = [
    {
      pattern: '/app/admin/residents/:residentId/process-recordings',
      render: (residentId: number) => <ProcessRecordingsPage residentId={residentId} />,
    },
    {
      pattern: '/app/admin/residents/:residentId/home-visitations',
      render: (residentId: number) => <HomeVisitationsPage residentId={residentId} />,
    },
    {
      pattern: '/app/admin/residents/:residentId/case-conferences',
      render: (residentId: number) => <CaseConferencesPage residentId={residentId} />,
    },
    {
      pattern: '/app/admin/residents/:residentId/education-records',
      render: (residentId: number) =>
        <ResidentSubpageLive residentId={residentId} apiPath="education-records" title="Education records" description="School readiness and academic progress touchpoints." />,
    },
    {
      pattern: '/app/admin/residents/:residentId/health-wellbeing-records',
      render: (residentId: number) =>
        <ResidentSubpageLive residentId={residentId} apiPath="health-wellbeing-records" title="Health and wellbeing" description="Physical and wellbeing records for longitudinal care." />,
    },
    {
      pattern: '/app/admin/residents/:residentId/incident-reports',
      render: (residentId: number) =>
        <ResidentSubpageLive residentId={residentId} apiPath="incident-reports" title="Incident reports" description="Severity, response, and follow-up visibility." />,
    },
    {
      pattern: '/app/admin/residents/:residentId/intervention-plans',
      render: (residentId: number) =>
        <ResidentSubpageLive residentId={residentId} apiPath="intervention-plans" title="Intervention plans" description="Active plans, due dates, and status review." />,
    },
  ]

  for (const section of residentSections) {
    const match = matchPath(section.pattern, pathname)
    if (match) {
      return {
        kind: 'admin',
        requiresRole: ['admin', 'super-admin'] as UserRole[],
        render: () => section.render(Number(match.params.residentId)),
      }
    }
  }

  const donationDetailMatch = matchPath('/app/admin/contributions/:donationId', pathname)
  if (donationDetailMatch) {
    return {
      kind: 'admin',
      requiresRole: ['admin', 'super-admin'] as UserRole[],
      render: () => <ContributionDetailPage donationId={Number(donationDetailMatch.params.donationId)} />,
    }
  }

  const donorDetailMatch = matchPath('/app/donor/history/:donationId', pathname)
  if (donorDetailMatch) {
    return {
      kind: 'donor',
      requiresRole: ['donor'] as UserRole[],
      render: () => <DonorDonationDetailPage donationId={Number(donorDetailMatch.params.donationId)} />,
    }
  }

  const safehouseDetailMatch = matchPath('/app/admin/safehouses/:safehouseId', pathname)
  if (safehouseDetailMatch) {
    return {
      kind: 'admin',
      requiresRole: ['admin', 'super-admin'] as UserRole[],
      render: () => <SafehouseDetailPage safehouseId={Number(safehouseDetailMatch.params.safehouseId)} />,
    }
  }

  const residentDetailMatch = matchPath('/app/admin/residents/:residentId', pathname)
  if (residentDetailMatch) {
    return {
      kind: 'admin',
      requiresRole: ['admin', 'super-admin'] as UserRole[],
      render: () => <ResidentDetailPage residentId={Number(residentDetailMatch.params.residentId)} />,
    }
  }

  const staticRoutes: Array<{
    path: string
    kind: 'public' | 'donor' | 'admin' | 'super-admin' | 'app'
    requiresRole?: UserRole[]
    render: () => ReactElement
  }> = [
    { path: '/', kind: 'public', render: () => <HomePage /> },
    { path: '/impact', kind: 'public', render: () => <ImpactPage /> },
    { path: '/programs', kind: 'public', render: () => <OrganizationPage /> },
    { path: '/about', kind: 'public', render: () => <OrganizationPage /> },
    { path: '/about/organization', kind: 'public', render: () => <OrganizationPage /> },
    { path: '/about/meet-us', kind: 'public', render: () => <MeetUsPage /> },
    { path: '/social', kind: 'public', render: () => <SocialPage /> },
    { path: '/donate', kind: 'public', render: () => <DonatePage /> },
    { path: '/login', kind: 'public', render: () => <LoginPage /> },
    { path: '/404', kind: 'public', render: () => <NotFoundPage /> },
    { path: '/privacy', kind: 'public', render: () => <PrivacyPage /> },
    { path: '/cookies', kind: 'public', render: () => <CookiePage /> },
    {
      path: '/app',
      kind: 'app',
      requiresRole: ['donor', 'admin', 'super-admin', 'public'],
      render: () => <RoleRedirectPage role={role} />,
    },
    {
      path: '/app/account',
      kind: 'app',
      requiresRole: ['donor', 'admin', 'super-admin', 'public'],
      render: () => <AccountPage />,
    },
    {
      path: '/app/account/security',
      kind: 'app',
      requiresRole: ['donor', 'admin', 'super-admin', 'public'],
      render: () => <SecurityPage />,
    },
    {
      path: '/app/forbidden',
      kind: 'app',
      requiresRole: ['donor', 'admin', 'super-admin', 'public'],
      render: () => <ForbiddenPage />,
    },
    { path: '/app/donor', kind: 'donor', requiresRole: ['donor'], render: () => <DonorDashboardPage /> },
    { path: '/app/donor/history', kind: 'donor', requiresRole: ['donor'], render: () => <DonorHistoryPage /> },
    { path: '/app/donor/impact', kind: 'donor', requiresRole: ['donor'], render: () => <DonorImpactPage /> },
    { path: '/app/donor/profile', kind: 'donor', requiresRole: ['donor'], render: () => <DonorProfilePage /> },
    { path: '/app/donor/donate', kind: 'donor', requiresRole: ['donor'], render: () => <DonatePage donorMode /> },
    { path: '/app/admin', kind: 'admin', requiresRole: ['admin', 'super-admin'], render: () => <AdminDashboardPage /> },
    { path: '/app/admin/caseload', kind: 'admin', requiresRole: ['admin', 'super-admin'], render: () => <CaseloadPage /> },
    { path: '/app/admin/donors', kind: 'admin', requiresRole: ['admin', 'super-admin'], render: () => <DonorsPage /> },
    { path: '/app/admin/contributions', kind: 'admin', requiresRole: ['admin', 'super-admin'], render: () => <ContributionsPage /> },
    { path: '/app/admin/safehouses', kind: 'admin', requiresRole: ['admin', 'super-admin'], render: () => <SafehousesPage /> },
    { path: '/app/admin/partners', kind: 'admin', requiresRole: ['admin', 'super-admin'], render: () => <PartnersPage /> },
    { path: '/app/admin/reports', kind: 'admin', requiresRole: ['admin', 'super-admin'], render: () => <ReportsPage /> },
    { path: '/app/admin/outreach', kind: 'admin', requiresRole: ['admin', 'super-admin'], render: () => <OutreachPage /> },
    { path: '/app/super-admin', kind: 'super-admin', requiresRole: ['super-admin'], render: () => <SuperAdminDashboardPage /> },
    { path: '/app/super-admin/facilities', kind: 'super-admin', requiresRole: ['super-admin'], render: () => <FacilitiesPage /> },
    { path: '/app/super-admin/users', kind: 'super-admin', requiresRole: ['super-admin'], render: () => <UsersPage /> },
    { path: '/app/super-admin/roles', kind: 'super-admin', requiresRole: ['super-admin'], render: () => <RolesPage /> },
    { path: '/app/super-admin/access-policies', kind: 'super-admin', requiresRole: ['super-admin'], render: () => <AccessPoliciesPage /> },
    { path: '/app/super-admin/reports', kind: 'super-admin', requiresRole: ['super-admin'], render: () => <SuperAdminReportsPage /> },
    { path: '/app/super-admin/audit', kind: 'super-admin', requiresRole: ['super-admin'], render: () => <AuditPage /> },
  ]

  const route = staticRoutes.find((item) => item.path === pathname)
  if (route) {
    return route
  }

  return {
    kind: 'public' as const,
    render: () => <NotFoundPage />,
  }
}
