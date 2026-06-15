import { loadDemoData, DEMO_STORAGE_KEYS } from "@/utils/demoPersistence"

/**
 * Identity keys for actors that appear as casting submissions, used by the
 * aggregated "All Actors" view to flag which actors are associated with
 * Submissions. We read the persisted Public Casting demo data directly so the
 * actor-list feature stays decoupled from the Public Casting provider (the two
 * features mount independent provider trees).
 */
export interface SubmissionIdentities {
  /** Normalized emails of all casting submissions. */
  emails: Set<string>
  /** Normalized names of all casting submissions (fallback when email is missing). */
  names: Set<string>
}

interface PersistedSubmission {
  name?: string
  email?: string
}

interface PersistedCastingProject {
  submissions?: PersistedSubmission[]
}

const norm = (value: string | undefined) => (value || "").toLowerCase().trim()

/** Read every casting submission's identity (email + name) from persisted data. */
export function getSubmissionIdentities(): SubmissionIdentities {
  const emails = new Set<string>()
  const names = new Set<string>()

  const persisted = loadDemoData<{ projects?: PersistedCastingProject[] } | null>(
    DEMO_STORAGE_KEYS.publicCasting,
    null
  )

  persisted?.projects?.forEach((project) => {
    project.submissions?.forEach((submission) => {
      const email = norm(submission.email)
      const name = norm(submission.name)
      if (email) emails.add(email)
      if (name) names.add(name)
    })
  })

  return { emails, names }
}

/** True when an actor (by email, falling back to name) matches a casting submission. */
export function matchesSubmission(
  identities: SubmissionIdentities,
  email: string,
  name: string
): boolean {
  const e = norm(email)
  const n = norm(name)
  if (e && identities.emails.has(e)) return true
  if (n && identities.names.has(n)) return true
  return false
}
