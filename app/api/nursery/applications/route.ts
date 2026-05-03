import { NextResponse } from 'next/server'
import { requireRole, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const user = await requireRole(['NURSERY'])

    const profile = await db.nurseryProfile.findUnique({ where: { userId: user.id } })
    if (!profile) return NextResponse.json({ error: 'プロフィールが見つかりません' }, { status: 404 })

    const matches = await db.match.findMany({
      where: { nurseryId: profile.id },
      include: {
        application: {
          select: {
            applyMessage: true,
            lineContactOk: true,
            appliedAt: true,
          },
        },
        job: { select: { id: true, title: true, workDate: true, workTimeStart: true, workTimeEnd: true } },
        seeker: { select: { id: true, displayName: true, preferredArea: true, preferredStyle: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ matches })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status })
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
