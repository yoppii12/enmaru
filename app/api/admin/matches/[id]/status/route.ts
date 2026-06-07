import { NextRequest, NextResponse } from 'next/server'
import { requireRole, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { notifyMatchingConfirmed, notifyReviewRequest } from '@/lib/line'
import { createNotification, NOTIFICATION_TYPES } from '@/lib/notifications'

const VALID_STATUSES = ['APPLIED', 'SCREENING', 'MATCHED', 'WORKING', 'COMPLETED', 'REVIEW_OPEN', 'REVIEW_DONE']

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(['ADMIN'])

    const body = await request.json()
    const { status, adminMemo } = body

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: '無効なステータスです' }, { status: 400 })
    }

    const existing = await db.match.findUnique({
      where: { id: params.id },
      include: {
        nursery: { include: { user: { select: { id: true, lineUserId: true } } } },
        seeker: { include: { user: { select: { id: true, lineUserId: true } } } },
        job: { select: { title: true } },
      },
    })
    if (!existing) return NextResponse.json({ error: 'マッチングが見つかりません' }, { status: 404 })

    const match = await db.match.update({
      where: { id: params.id },
      data: {
        ...(status && { status }),
        ...(adminMemo !== undefined && { adminMemo }),
      },
    })

    // MATCHED: 双方にLINE通知
    if (status === 'MATCHED') {
      await notifyMatchingConfirmed(
        existing.seeker.user.lineUserId,
        existing.nursery.user.lineUserId,
        existing.nursery.nurseryName,
        existing.job.title
      )
    }

    // REVIEW_OPEN: 評価依頼通知
    if (status === 'REVIEW_OPEN') {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
      await notifyReviewRequest(existing.seeker.user.lineUserId, appUrl, params.id)
      await notifyReviewRequest(existing.nursery.user.lineUserId, appUrl, params.id)
      await createNotification(
        existing.seeker.user.id,
        NOTIFICATION_TYPES.REVIEW_REQUESTED,
        'レビューをお願いします',
        `${existing.nursery.nurseryName}への評価を投稿してください`,
        `/reviews/${params.id}`
      )
      await createNotification(
        existing.nursery.user.id,
        NOTIFICATION_TYPES.REVIEW_REQUESTED,
        'レビューをお願いします',
        `担当保育士への評価を投稿してください`,
        `/nursery/reviews/${params.id}`
      )
    }

    return NextResponse.json({ match })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status })
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
