import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const nursery = await db.nurseryProfile.findUnique({
      where: { id: params.id, isPublished: true },
      select: {
        id: true,
        nurseryName: true,
        area: true,
        concept: true,
        policy: true,
        isPublished: true,
        reviewsReceived: {
          where: { isPublished: true },
          select: { explanation: true, atmosphere: true, support: true, clarity: true },
        },
      },
    })

    if (!nursery) {
      return NextResponse.json({ error: '保育園が見つかりません' }, { status: 404 })
    }

    const reviews = nursery.reviewsReceived
    const count = reviews.length
    const averageRating =
      count > 0
        ? {
            explanation: reviews.reduce((s, r) => s + r.explanation, 0) / count,
            atmosphere: reviews.reduce((s, r) => s + r.atmosphere, 0) / count,
            support: reviews.reduce((s, r) => s + r.support, 0) / count,
            clarity: reviews.reduce((s, r) => s + r.clarity, 0) / count,
            total:
              reviews.reduce((s, r) => s + r.explanation + r.atmosphere + r.support + r.clarity, 0) /
              (count * 4),
            count,
          }
        : undefined

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { reviewsReceived: _reviews, ...nurseryData } = nursery
    return NextResponse.json({ nursery: { ...nurseryData, averageRating } })
  } catch {
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
