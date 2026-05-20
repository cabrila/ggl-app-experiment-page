// Shape returned by GET /api/usage (mirrors the AI service response).

export interface UsageBucket {
  calls: number
  // NEW: total underlying AI calls. For most rows this equals `calls`;
  // higher when chunking (scene-extract on long screenplays) or when a
  // repair retry kicked in. Optional for backwards compat with older
  // records collected before the field was introduced.
  aiCallCount?: number
  tokensIn: number
  tokensOut: number
  costUsd: number
  inputBytes: number
  inputLetters: number
  inputWords: number
  inputPagesEstimate: number
  // NEW: summed wall-clock wait time across this bucket. This is the
  // "total time users actually waited" for extracts in the bucket — the
  // human-meaningful value. Optional for backwards compat.
  wallTimeMs?: number
  // NEW: summed AI compute time. Can be much larger than wallTimeMs when
  // chunked extracts ran in parallel. Useful for debugging only.
  latencyMs?: number
}

export interface RecentCall {
  timestamp: string
  taskId: string
  skillId: string
  model: string
  phase: "model_call" | "repair_call"
  tokensIn: number
  tokensOut: number
  costUsd: number
  inputBytes: number
  inputLetters: number
  inputWords: number
  inputPagesEstimate: number
  inputLettersEstimated: boolean
  latencyMs: number
  // NEW: user-perceived wait time (start of extract → result delivered).
  // For chunked scene-extract this is much smaller than latencyMs because
  // the chunks ran in parallel. Optional — older records lack it and the
  // UI should render "—" in that case (not 0).
  wallTimeMs?: number
  // NEW: usage attribution. Older records won't have these — render "—".
  userId?: string
  userEmail?: string
  // NEW: number of underlying AI calls that produced this extract. 1 for
  // single-call skills; N for chunked scene-extract. Always present on
  // new records; older ones are treated as 1 at render time.
  aiCallCount?: number
}

export interface UsageResponse {
  from: string
  to: string
  totals: UsageBucket
  bySkill: Record<string, UsageBucket>
  byModel: Record<string, UsageBucket>
  // NEW: per-user aggregation, keyed by userEmail or "unknown".
  byUser?: Record<string, UsageBucket>
  recentCalls: RecentCall[]
}
