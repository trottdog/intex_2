import { useSession } from '../../app/session'
import type { Supporter } from '../../data/mockData'
import { useApiResource } from '../../lib/api'
import { ErrorState, SkeletonStackRows, SkeletonSurface, Surface } from '../../components/ui'
import { PageSection } from '../../components/PageSection'
import { NAME_INPUT_PATTERN, NAME_INPUT_TITLE } from '../../utils/formValidation'

export function DonorProfilePage() {
  const { user } = useSession()
  const supporter = useApiResource<Supporter | null>(
    user?.supporterId != null ? `/supporters/${user.supporterId}` : '/supporters/me',
    null,
  )

  return (
    <PageSection title="Profile" description="A lightweight self-service profile for donor contact and preference updates.">
      {supporter.isLoading ? (
        <SkeletonSurface title="Profile settings"><SkeletonStackRows count={4} /></SkeletonSurface>
      ) : supporter.error ? (
        <ErrorState title="Could not load profile" description={supporter.error} />
      ) : (
      <Surface title="Profile settings" subtitle="Update your contact information and preferences.">
        <form className="form-grid" onSubmit={(event) => event.preventDefault()}>
          <label>
            Name
            <input
              required
              minLength={2}
              maxLength={120}
              pattern={NAME_INPUT_PATTERN}
              title={NAME_INPUT_TITLE}
              defaultValue={supporter.data?.displayName ?? user?.fullName ?? ''}
            />
          </label>
          <label>
            Email
            <input type="email" required maxLength={254} defaultValue={supporter.data?.email ?? user?.email ?? ''} />
          </label>
          <label>
            Region
            <input minLength={2} maxLength={120} defaultValue={supporter.data?.region ?? ''} />
          </label>
          <button className="primary-button full-span" type="submit">
            Save changes
          </button>
        </form>
      </Surface>
      )}
    </PageSection>
  )
}
