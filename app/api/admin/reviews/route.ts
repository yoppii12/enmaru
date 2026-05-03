import { NextResponse } from 'next/server'
import { requireRole, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    await requireRole(['ADMIN'])

    const [seekerReviews, nurseryReviews] = await Promise.all([
      db.reviewSeekerToNursery.findMany({
        include: {
          seeker: { select: { displayName: true } },
          nursery: { select: { nurseryName: true } },
        },
        orderBy: { reviewedAt: 'desc' },
      }),
      db.reviewNurseryToSeeker.findMany({
        include: {
          nursery: { select: { nurseryName: true } },
          seeker: { select: { displayName: true } },
        },
        orderBy: { reviewedAt: 'desc' },
      }),
    ])

    return NextResponse.json({ seekerReviews, nurseryReviews })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status })
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
