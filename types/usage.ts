// Shape returned by GET /api/usage (mirrors the AI service response).

export interface UsageBucket {
  calls: number
  tokensIn: number
  tokensOut: number
  costUsd: number
  inputBytes: number
  inputLetters: number
  inputWords: number
  inputPagesEstimate: number
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
}

export interface UsageResponse {
  from: string
  to: string
  totals: UsageBucket
  bySkill: Record<string, UsageBucket>
  byModel: Record<string, UsageBucket>
  recentCalls: RecentCall[]
}
