import { useSession } from '../../app/session'
import type { Resident } from '../../data/mockData'
import { useApiResource } from '../../lib/api'
import {
  formatMlScore,
  getMlSignalLabel,
  getMlSignalTone,
  type MlEntityInsight,
} from '../../lib/ml'
import {
  AppLink,
  EmptyState,
  ErrorState,
  SkeletonStackRows,
  SkeletonStatCard,
  SkeletonSurface,
  StatusPill,
  Surface,
} from '../../components/ui'
import { PageSection } from '../../components/PageSection'
import { asRecord } from '../../utils/helpers'
import { canSessionUserAccessResident } from '../../utils/sessionFilters'

export function ResidentDetailPage({ residentId }: { residentId: number }) {
  const { user } = useSession()
  const residentResource = useApiResource<Resident | null>(`/residents/${residentId}`, null)
  const residentInsights = useApiResource<MlEntityInsight[]>(`/ml/residents/${residentId}/insights`, [])

  if (residentResource.isLoading) {
    return (
      <PageSection title="" description="">
        <div className="stat-grid"><SkeletonStatCard /><SkeletonStatCard /><SkeletonStatCard /></div>
        <div className="two-column-grid">
          <SkeletonSurface><SkeletonStackRows count={4} /></SkeletonSurface>
          <SkeletonSurface><SkeletonStackRows count={4} /></SkeletonSurface>
        </div>
      </PageSection>
    )
  }

  const resident = residentResource.data
  const residentRiskInsight = residentInsights.data.find((item) => item.pipelineName === 'resident_risk')
  const casePrioritizationInsight = residentInsights.data.find((item) => item.pipelineName === 'case_prioritization')
  const reintegrationInsight = residentInsights.data.find((item) => item.pipelineName === 'reintegration_readiness')
  const counselingProgressInsight = residentInsights.data.find((item) => item.pipelineName === 'counseling_progress')
  const educationImprovementInsight = residentInsights.data.find((item) => item.pipelineName === 'education_improvement')
  const homeVisitationInsight = residentInsights.data.find((item) => item.pipelineName === 'home_visitation_outcome')

  if (!resident) {
    return <PageSection title="Resident not found" description={residentResource.error ?? 'The selected resident could not be located.'}><EmptyState title="No resident found" description="Choose a resident from the caseload inventory." /></PageSection>
  }

  if (user && !canSessionUserAccessResident(user, resident)) {
    return (
      <PageSection title="Outside your facility scope" description="This resident belongs to a safehouse you are not assigned to.">
        <ErrorState
          title="Not available in your scope"
          description={`Resident ${resident.caseControlNo} is at safehouse ${resident.safehouseId}. Your assignments: ${user.safehouseIds?.length ? user.safehouseIds.join(', ') : 'none'}.`}
        />
      </PageSection>
    )
  }

  const residentLinks = [
    ['Overview', `/app/admin/residents/${residentId}`],
    ['Process recordings', `/app/admin/residents/${residentId}/process-recordings`],
    ['Home visitations', `/app/admin/residents/${residentId}/home-visitations`],
    ['Case conferences', `/app/admin/residents/${residentId}/case-conferences`],
    ['Education', `/app/admin/residents/${residentId}/education-records`],
    ['Health', `/app/admin/residents/${residentId}/health-wellbeing-records`],
    ['Incidents', `/app/admin/residents/${residentId}/incident-reports`],
    ['Plans', `/app/admin/residents/${residentId}/intervention-plans`],
  ] as const

  return (
    <PageSection title={`Resident ${resident.caseControlNo}`} description="Structured, tabbed case workspace for professional staff use.">
      <div className="resident-header">
        <div>
          <span className="eyebrow">Assigned worker</span>
          <h2>{resident.assignedSocialWorker}</h2>
          <p>
            {resident.caseCategory} · age {resident.presentAge} · {resident.reintegrationStatus}
          </p>
        </div>
        <div className="resident-badges">
          <StatusPill tone="default">{resident.caseStatus}</StatusPill>
          <StatusPill tone={resident.currentRiskLevel === 'High' ? 'danger' : resident.currentRiskLevel === 'Moderate' ? 'warning' : 'success'}>
            {resident.currentRiskLevel} risk
          </StatusPill>
        </div>
      </div>
      <nav className="tab-nav">
        {residentLinks.map(([label, to]) => (
          <AppLink key={to} to={to} className={window.location.pathname === to ? 'active' : undefined}>
            {label}
          </AppLink>
        ))}
      </nav>
      <div className="two-column-grid resident-grid">
        <Surface title="Decision support" subtitle="Latest nightly model outputs for this resident.">
          {residentInsights.isLoading ? (
            <SkeletonStackRows count={3} />
          ) : residentInsights.error ? (
            <ErrorState title="Could not load decision support" description={residentInsights.error} />
          ) : !residentRiskInsight && !casePrioritizationInsight && !reintegrationInsight && !counselingProgressInsight && !educationImprovementInsight && !homeVisitationInsight ? (
            <EmptyState title="No resident insights yet" description="The nightly ML refresh will publish resident-specific risk, prioritization, readiness, counseling, education, and visitation signals here." />
          ) : (
            <div className="stack-list">
              {residentRiskInsight ? (
                <div className="stack-row">
                  <div>
                    <strong>Resident risk</strong>
                    <p>{String(asRecord(residentRiskInsight.prediction.context).recommended_action ?? 'Review the intervention plan and follow-up actions.')}</p>
                  </div>
                  <div className="align-right">
                    <StatusPill tone={getMlSignalTone('resident_risk', residentRiskInsight.prediction.predictionScore)}>
                      {getMlSignalLabel('resident_risk', residentRiskInsight.prediction.predictionScore)}
                    </StatusPill>
                    <p>{formatMlScore(residentRiskInsight.prediction.predictionScore)}</p>
                  </div>
                </div>
              ) : null}
              {reintegrationInsight ? (
                <div className="stack-row">
                  <div>
                    <strong>Reintegration readiness</strong>
                    <p>{String(asRecord(reintegrationInsight.prediction.context).recommended_action ?? 'Review reintegration milestones and family readiness.')}</p>
                  </div>
                  <div className="align-right">
                    <StatusPill tone={getMlSignalTone('reintegration_readiness', reintegrationInsight.prediction.predictionScore)}>
                      {getMlSignalLabel('reintegration_readiness', reintegrationInsight.prediction.predictionScore)}
                    </StatusPill>
                    <p>{formatMlScore(reintegrationInsight.prediction.predictionScore)}</p>
                  </div>
                </div>
              ) : null}
              {casePrioritizationInsight ? (
                <div className="stack-row">
                  <div>
                    <strong>Case prioritization</strong>
                    <p>{String(asRecord(casePrioritizationInsight.prediction.context).recommended_action ?? 'Prioritize this resident for near-term case review and follow-up.')}</p>
                  </div>
                  <div className="align-right">
                    <StatusPill tone={getMlSignalTone('case_prioritization', casePrioritizationInsight.prediction.predictionScore)}>
                      {getMlSignalLabel('case_prioritization', casePrioritizationInsight.prediction.predictionScore)}
                    </StatusPill>
                    <p>{formatMlScore(casePrioritizationInsight.prediction.predictionScore)}</p>
                  </div>
                </div>
              ) : null}
              {counselingProgressInsight ? (
                <div className="stack-row">
                  <div>
                    <strong>Counseling progress</strong>
                    <p>{String(asRecord(counselingProgressInsight.prediction.context).recommended_action ?? 'Review the current counseling plan and look for momentum changes.')}</p>
                  </div>
                  <div className="align-right">
                    <StatusPill tone={getMlSignalTone('counseling_progress', counselingProgressInsight.prediction.predictionScore)}>
                      {getMlSignalLabel('counseling_progress', counselingProgressInsight.prediction.predictionScore)}
                    </StatusPill>
                    <p>{formatMlScore(counselingProgressInsight.prediction.predictionScore)}</p>
                  </div>
                </div>
              ) : null}
              {educationImprovementInsight ? (
                <div className="stack-row">
                  <div>
                    <strong>Education improvement</strong>
                    <p>{String(asRecord(educationImprovementInsight.prediction.context).recommended_action ?? 'Review the education plan and reinforce the support patterns linked to improvement.')}</p>
                  </div>
                  <div className="align-right">
                    <StatusPill tone={getMlSignalTone('education_improvement', educationImprovementInsight.prediction.predictionScore)}>
                      {getMlSignalLabel('education_improvement', educationImprovementInsight.prediction.predictionScore)}
                    </StatusPill>
                    <p>{formatMlScore(educationImprovementInsight.prediction.predictionScore)}</p>
                  </div>
                </div>
              ) : null}
              {homeVisitationInsight ? (
                <div className="stack-row">
                  <div>
                    <strong>Home visitation outcome</strong>
                    <p>{String(asRecord(homeVisitationInsight.prediction.context).recommended_action ?? 'Use the visitation signal to guide reintegration planning and family follow-up.')}</p>
                  </div>
                  <div className="align-right">
                    <StatusPill tone={getMlSignalTone('home_visitation_outcome', homeVisitationInsight.prediction.predictionScore)}>
                      {getMlSignalLabel('home_visitation_outcome', homeVisitationInsight.prediction.predictionScore)}
                    </StatusPill>
                    <p>{formatMlScore(homeVisitationInsight.prediction.predictionScore)}</p>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </Surface>
        <Surface title="Case summary" subtitle="Core case classification and reintegration status.">
          <div className="stack-list">
            <div className="stack-row"><strong>Case status</strong><p>{resident.caseStatus}</p></div>
            <div className="stack-row"><strong>Case category</strong><p>{resident.caseCategory}</p></div>
            {resident.caseSubCategory ? (
              <div className="stack-row"><strong>Sub-category</strong><p>{resident.caseSubCategory}</p></div>
            ) : null}
            <div className="stack-row"><strong>Reintegration status</strong><p>{resident.reintegrationStatus}</p></div>
            <div className="stack-row">
              <strong>Risk level</strong>
              <StatusPill tone={resident.currentRiskLevel === 'High' ? 'danger' : resident.currentRiskLevel === 'Moderate' ? 'warning' : 'success'}>
                {resident.currentRiskLevel}
              </StatusPill>
            </div>
            <div className="stack-row"><strong>Assigned social worker</strong><p>{resident.assignedSocialWorker}</p></div>
          </div>
        </Surface>

        <Surface title="Demographics" subtitle="Age, gender, nationality, and religious background.">
          <div className="stack-list">
            <div className="stack-row"><strong>Age</strong><p>{resident.presentAge}</p></div>
            <div className="stack-row"><strong>Gender</strong><p>{resident.gender ?? '—'}</p></div>
            <div className="stack-row"><strong>Nationality</strong><p>{resident.nationality ?? '—'}</p></div>
            <div className="stack-row"><strong>Religion</strong><p>{resident.religion ?? '—'}</p></div>
          </div>
        </Surface>

        <Surface title="Disability information" subtitle="Disability status and any required accommodations.">
          <div className="stack-list">
            <div className="stack-row">
              <strong>Has disability</strong>
              <StatusPill tone={resident.hasDisability ? 'warning' : 'default'}>
                {resident.hasDisability ? 'Yes' : 'No'}
              </StatusPill>
            </div>
            {resident.hasDisability && resident.disabilityDetails ? (
              <div className="stack-row"><strong>Details</strong><p>{resident.disabilityDetails}</p></div>
            ) : null}
          </div>
        </Surface>

        <Surface title="Family socio-demographic profile" subtitle="DSWD classification categories for reporting.">
          <div className="stack-list">
            <div className="stack-row">
              <strong>4Ps beneficiary</strong>
              <StatusPill tone={resident.is4PsBeneficiary ? 'success' : 'default'}>{resident.is4PsBeneficiary ? 'Yes' : 'No'}</StatusPill>
            </div>
            <div className="stack-row">
              <strong>Solo parent household</strong>
              <StatusPill tone={resident.isSoloParent ? 'warning' : 'default'}>{resident.isSoloParent ? 'Yes' : 'No'}</StatusPill>
            </div>
            <div className="stack-row">
              <strong>Indigenous peoples group</strong>
              <StatusPill tone={resident.isIndigenousGroup ? 'warning' : 'default'}>{resident.isIndigenousGroup ? 'Yes' : 'No'}</StatusPill>
            </div>
            <div className="stack-row">
              <strong>Informal settler</strong>
              <StatusPill tone={resident.isInformalSettler ? 'warning' : 'default'}>{resident.isInformalSettler ? 'Yes' : 'No'}</StatusPill>
            </div>
          </div>
        </Surface>

        <Surface title="Admission details" subtitle="How and when the resident entered the safehouse.">
          <div className="stack-list">
            <div className="stack-row"><strong>Admission date</strong><p>{resident.admissionDate ?? '—'}</p></div>
            <div className="stack-row"><strong>Admission type</strong><p>{resident.admissionType ?? '—'}</p></div>
          </div>
        </Surface>

        <Surface title="Referral information" subtitle="Source agency and referral pathway.">
          <div className="stack-list">
            <div className="stack-row"><strong>Referral source</strong><p>{resident.referralSource ?? '—'}</p></div>
            <div className="stack-row"><strong>Referring agency</strong><p>{resident.referralAgency ?? '—'}</p></div>
          </div>
        </Surface>
      </div>

      <Surface title="Quick navigation" subtitle="Jump to detailed sub-records for this resident.">
        <div className="stack-list">
          <div className="stack-row">
            <strong>Process recordings</strong>
            <AppLink to={`/app/admin/residents/${residentId}/process-recordings`}>View counseling history</AppLink>
          </div>
          <div className="stack-row">
            <strong>Home visitations</strong>
            <AppLink to={`/app/admin/residents/${residentId}/home-visitations`}>View visit log</AppLink>
          </div>
          <div className="stack-row">
            <strong>Case conferences</strong>
            <AppLink to={`/app/admin/residents/${residentId}/case-conferences`}>View conferences</AppLink>
          </div>
          <div className="stack-row">
            <strong>Intervention plan</strong>
            <AppLink to={`/app/admin/residents/${residentId}/intervention-plans`}>View active plans</AppLink>
          </div>
        </div>
      </Surface>
    </PageSection>
  )
}
