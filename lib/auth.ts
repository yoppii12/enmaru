import { prisma } from './db'
import { createSupabaseServerClient } from './supabase/server'
import type { UserRole, CurrentUser } from '@/types'
import type { MatchStatus } from '@prisma/client'

export async function getSession() {
  const supabase = createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabaseUser = await getSession()
  if (!supabaseUser) return null

  const user = await prisma.user.findUnique({
    where: { supabaseId: supabaseUser.id },
    include: {
      seekerProfile: { select: { id: true } },
      nurseryProfile: { select: { id: true } },
    },
  })
  if (!user) return null

  return {
    id: user.id,
    email: user.email,
    role: user.role as UserRole,
    supabaseId: user.supabaseId,
    lineUserId: user.lineUserId,
    seekerProfileId: user.seekerProfile?.id,
    nurseryProfileId: user.nurseryProfile?.id,
  }
}

export async function requireAuth(): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user) {
    throw new AuthError(401, '認証が必要です')
  }
  return user
}

export async function requireRole(roles: UserRole[]): Promise<CurrentUser> {
  const user = await requireAuth()
  if (!roles.includes(user.role)) {
    throw new AuthError(403, 'アクセス権限がありません')
  }
  return user
}

export async function canSubmitReview(matchId: string, profileId: string): Promise<boolean> {
  const match = await prisma.match.findUnique({ where: { id: matchId } })
  if (!match) return false

  const allowedStatuses: MatchStatus[] = ['COMPLETED', 'REVIEW_OPEN']
  if (!allowedStatuses.includes(match.status)) return false

  return match.seekerId === profileId || match.nurseryId === profileId
}

export async function updateReviewStatus(matchId: string): Promise<void> {
  const [nurseryReview, seekerReview] = await Promise.all([
    prisma.reviewNurseryToSeeker.findUnique({ where: { matchId } }),
    prisma.reviewSeekerToNursery.findUnique({ where: { matchId } }),
  ])

  const reviewStatus = nurseryReview && seekerReview ? 'DONE'
    : nurseryReview || seekerReview ? 'PARTIAL'
    : 'NONE'

  await prisma.match.update({
    where: { id: matchId },
    data: {
      reviewStatus,
      ...(reviewStatus === 'DONE' && { status: 'REVIEW_DONE' }),
    },
  })
}

export class AuthError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}
