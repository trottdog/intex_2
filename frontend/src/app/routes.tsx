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
import { ManageMfaPage } from '../pages/auth/ManageMfaPage'
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

type ResolvedRoute = {
  kind: 'public' | 'donor' | 'admin' | 'super-admin' | 'app'
  requiresRole?: UserRole[]
  render: () => ReactElement
  title: string
}

export function resolveRoute(pathname: string, role: UserRole) {
  const residentSections = [
    {
      pattern: '/app/admin/residents/:residentId/process-recordings',
      render: (residentId: number) => <ProcessRecordingsPage residentId={residentId} />,
      title: 'Process Recordings',
    },
    {
      pattern: '/app/admin/residents/:residentId/home-visitations',
      render: (residentId: number) => <HomeVisitationsPage residentId={residentId} />,
      title: 'Home Visitations',
    },
    {
      pattern: '/app/admin/residents/:residentId/case-conferences',
      render: (residentId: number) => <CaseConferencesPage residentId={residentId} />,
      title: 'Case Conferences',
    },
    {
      pattern: '/app/admin/residents/:residentId/education-records',
      render: (residentId: number) =>
        <ResidentSubpageLive residentId={residentId} apiPath="education-records" title="Education records" description="School readiness and academic progress touchpoints." />,
      title: 'Education Records',
    },
    {
      pattern: '/app/admin/residents/:residentId/health-wellbeing-records',
      render: (residentId: number) =>
        <ResidentSubpageLive residentId={residentId} apiPath="health-wellbeing-records" title="Health and wellbeing" description="Physical and wellbeing records for longitudinal care." />,
      title: 'Health and Wellbeing',
    },
    {
      pattern: '/app/admin/residents/:residentId/incident-reports',
      render: (residentId: number) =>
        <ResidentSubpageLive residentId={residentId} apiPath="incident-reports" title="Incident reports" description="Severity, response, and follow-up visibility." />,
      title: 'Incident Reports',
    },
    {
      pattern: '/app/admin/residents/:residentId/intervention-plans',
      render: (residentId: number) =>
        <ResidentSubpageLive residentId={residentId} apiPath="intervention-plans" title="Intervention plans" description="Active plans, due dates, and status review." />,
      title: 'Intervention Plans',
    },
  ]

  for (const section of residentSections) {
    const match = matchPath(section.pattern, pathname)
    if (match) {
      return {
        kind: 'admin',
        requiresRole: ['admin', 'super-admin'] as UserRole[],
        render: () => section.render(Number(match.params.residentId)),
        title: section.title,
      }
    }
  }

  const donationDetailMatch = matchPath('/app/admin/contributions/:donationId', pathname)
  if (donationDetailMatch) {
    return {
      kind: 'admin',
      requiresRole: ['admin', 'super-admin'] as UserRole[],
      render: () => <ContributionDetailPage donationId={Number(donationDetailMatch.params.donationId)} />,
      title: 'Contribution Detail',
    }
  }

  const donorDetailMatch = matchPath('/app/donor/history/:donationId', pathname)
  if (donorDetailMatch) {
    return {
      kind: 'donor',
      requiresRole: ['donor'] as UserRole[],
      render: () => <DonorDonationDetailPage donationId={Number(donorDetailMatch.params.donationId)} />,
      title: 'Donation Detail',
    }
  }

  const safehouseDetailMatch = matchPath('/app/admin/safehouses/:safehouseId', pathname)
  if (safehouseDetailMatch) {
    return {
      kind: 'admin',
      requiresRole: ['admin', 'super-admin'] as UserRole[],
      render: () => <SafehouseDetailPage safehouseId={Number(safehouseDetailMatch.params.safehouseId)} />,
      title: 'Safehouse Detail',
    }
  }

  const residentDetailMatch = matchPath('/app/admin/residents/:residentId', pathname)
  if (residentDetailMatch) {
    return {
      kind: 'admin',
      requiresRole: ['admin', 'super-admin'] as UserRole[],
      render: () => <ResidentDetailPage residentId={Number(residentDetailMatch.params.residentId)} />,
      title: 'Resident Detail',
    }
  }

  const staticRoutes: Array<ResolvedRoute & { path: string }> = [
    { path: '/', kind: 'public', render: () => <HomePage />, title: 'Home' },
    { path: '/impact', kind: 'public', render: () => <ImpactPage />, title: 'Impact' },
    { path: '/programs', kind: 'public', render: () => <OrganizationPage />, title: 'Programs' },
    { path: '/about', kind: 'public', render: () => <OrganizationPage />, title: 'About' },
    { path: '/about/organization', kind: 'public', render: () => <OrganizationPage />, title: 'Organization' },
    { path: '/about/meet-us', kind: 'public', render: () => <MeetUsPage />, title: 'Meet Us' },
    { path: '/social', kind: 'public', render: () => <SocialPage />, title: 'Social' },
    { path: '/donate', kind: 'public', render: () => <DonatePage />, title: 'Donate' },
    { path: '/login', kind: 'public', render: () => <LoginPage />, title: 'Login' },
    { path: '/404', kind: 'public', render: () => <NotFoundPage />, title: 'Page Not Found' },
    { path: '/privacy', kind: 'public', render: () => <PrivacyPage />, title: 'Privacy' },
    { path: '/cookies', kind: 'public', render: () => <CookiePage />, title: 'Cookies' },
    {
      path: '/app',
      kind: 'app',
      requiresRole: ['donor', 'admin', 'super-admin', 'public'],
      render: () => <RoleRedirectPage role={role} />,
      title: 'App',
    },
    {
      path: '/app/account',
      kind: 'app',
      requiresRole: ['donor', 'admin', 'super-admin', 'public'],
      render: () => <AccountPage />,
      title: 'Account',
    },
    {
      path: '/app/account/security',
      kind: 'app',
      requiresRole: ['donor', 'admin', 'super-admin', 'public'],
      render: () => <SecurityPage />,
      title: 'Security',
    },
    {
      path: '/app/account/mfa',
      kind: 'app',
      requiresRole: ['donor', 'admin', 'super-admin', 'public'],
      render: () => <ManageMfaPage />,
      title: 'Manage MFA',
    },
    {
      path: '/app/forbidden',
      kind: 'app',
      requiresRole: ['donor', 'admin', 'super-admin', 'public'],
      render: () => <ForbiddenPage />,
      title: 'Forbidden',
    },
    { path: '/app/donor', kind: 'donor', requiresRole: ['donor'], render: () => <DonorDashboardPage />, title: 'Donor Dashboard' },
    { path: '/app/donor/history', kind: 'donor', requiresRole: ['donor'], render: () => <DonorHistoryPage />, title: 'Donation History' },
    { path: '/app/donor/impact', kind: 'donor', requiresRole: ['donor'], render: () => <DonorImpactPage />, title: 'Your Impact' },
    { path: '/app/donor/profile', kind: 'donor', requiresRole: ['donor'], render: () => <DonorProfilePage />, title: 'Donor Profile' },
    { path: '/app/donor/donate', kind: 'donor', requiresRole: ['donor'], render: () => <DonatePage donorMode />, title: 'Donate' },
    { path: '/app/admin', kind: 'admin', requiresRole: ['admin', 'super-admin'], render: () => <AdminDashboardPage />, title: 'Admin Dashboard' },
    { path: '/app/admin/caseload', kind: 'admin', requiresRole: ['admin', 'super-admin'], render: () => <CaseloadPage />, title: 'Caseload' },
    { path: '/app/admin/donors', kind: 'admin', requiresRole: ['admin', 'super-admin'], render: () => <DonorsPage />, title: 'Donors' },
    { path: '/app/admin/contributions', kind: 'admin', requiresRole: ['admin', 'super-admin'], render: () => <ContributionsPage />, title: 'Contributions' },
    { path: '/app/admin/safehouses', kind: 'admin', requiresRole: ['admin', 'super-admin'], render: () => <SafehousesPage />, title: 'Safehouses' },
    { path: '/app/admin/partners', kind: 'admin', requiresRole: ['admin', 'super-admin'], render: () => <PartnersPage />, title: 'Partners' },
    { path: '/app/admin/reports', kind: 'admin', requiresRole: ['admin', 'super-admin'], render: () => <ReportsPage />, title: 'Reports' },
    { path: '/app/admin/outreach', kind: 'admin', requiresRole: ['admin', 'super-admin'], render: () => <OutreachPage />, title: 'Outreach' },
    { path: '/app/super-admin', kind: 'super-admin', requiresRole: ['super-admin'], render: () => <SuperAdminDashboardPage />, title: 'Super Admin Dashboard' },
    { path: '/app/super-admin/facilities', kind: 'super-admin', requiresRole: ['super-admin'], render: () => <FacilitiesPage />, title: 'Facilities' },
    { path: '/app/super-admin/users', kind: 'super-admin', requiresRole: ['super-admin'], render: () => <UsersPage />, title: 'Users' },
    { path: '/app/super-admin/roles', kind: 'super-admin', requiresRole: ['super-admin'], render: () => <RolesPage />, title: 'Roles' },
    { path: '/app/super-admin/access-policies', kind: 'super-admin', requiresRole: ['super-admin'], render: () => <AccessPoliciesPage />, title: 'Access Policies' },
    { path: '/app/super-admin/reports', kind: 'super-admin', requiresRole: ['super-admin'], render: () => <SuperAdminReportsPage />, title: 'Super Admin Reports' },
    { path: '/app/super-admin/audit', kind: 'super-admin', requiresRole: ['super-admin'], render: () => <AuditPage />, title: 'Audit' },
  ]

  const route = staticRoutes.find((item) => item.path === pathname)
  if (route) {
    return route
  }

  return {
    kind: 'public' as const,
    render: () => <NotFoundPage />,
    title: 'Page Not Found',
  }
}
