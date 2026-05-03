import { NextResponse } from 'next/server'
import { requireRole, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    await requireRole(['ADMIN'])

    const matches = await db.match.findMany({
      include: {
        job: { select: { title: true, workDate: true, workTimeStart: true, workTimeEnd: true } },
        nursery: { select: { nurseryName: true, area: true } },
        seeker: { select: { displayName: true, realName: true } },
        application: { select: { applyMessage: true, lineContactOk: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ matches })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status })
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
