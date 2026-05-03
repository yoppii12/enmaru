import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const nurseries = await db.nurseryProfile.findMany({
      where: { isPublished: true },
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
      orderBy: { nurseryName: 'asc' },
    })

    const result = nurseries.map((n) => {
      const reviews = n.reviewsReceived
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
      const { reviewsReceived: _reviews, ...nurseryData } = n
      return { ...nurseryData, averageRating }
    })

    return NextResponse.json({ nurseries: result })
  } catch {
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
