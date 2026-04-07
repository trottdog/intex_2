import { HomeVisitationsPage } from './HomeVisitationsPage'

export function CaseConferencesPage({ residentId }: { residentId: number }) {
  return <HomeVisitationsPage residentId={residentId} />
}
