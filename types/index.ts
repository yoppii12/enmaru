import type { Role, MatchStatus, ReviewStatus, JobStatus } from '@prisma/client'

export type { Role, MatchStatus, ReviewStatus, JobStatus }

export type UserRole = 'SEEKER' | 'NURSERY' | 'ADMIN'

export type PublicSeekerInfo = {
  id: string
  displayName: string
  preferredArea: string | null
  blankYears: string | null
  preferredStyle: string[]
  skills: string | null
  bio: string | null
}

export type PublicNurseryInfo = {
  id: string
  nurseryName: string
  area: string
  concept: string | null
  policy: string | null
  isPublished: boolean
  averageRating?: {
    explanation: number
    atmosphere: number
    support: number
    clarity: number
    total: number
    count: number
  }
}

export type MatchStatusConfig = {
  label: string
  bg: string
  color: string
}

export const MATCH_STATUS_CONFIG: Record<string, MatchStatusConfig> = {
  APPLIED:     { label: '応募中',        bg: '#F9F9F9', color: '#666666' },
  SCREENING:   { label: '確認中',        bg: '#FFF8E1', color: '#F9A825' },
  MATCHED:     { label: 'マッチング成立', bg: '#E8F5E9', color: '#2E7D32' },
  WORKING:     { label: '業務実施中',    bg: '#E3F2FD', color: '#1565C0' },
  COMPLETED:   { label: '業務完了',      bg: '#F3E5F5', color: '#6A1B9A' },
  REVIEW_OPEN: { label: '評価受付中',    bg: '#FFF0F3', color: '#F4A7B9' },
  REVIEW_DONE: { label: '評価完了',      bg: '#F9F9F9', color: '#AAAAAA' },
}

export type CurrentUser = {
  id: string
  email: string
  role: UserRole
  supabaseId: string | null
  lineUserId: string | null
  seekerProfileId?: string
  nurseryProfileId?: string
}
