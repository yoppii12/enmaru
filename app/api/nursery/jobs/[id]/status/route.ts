import { NextRequest, NextResponse } from 'next/server'
import { requireRole, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireRole(['NURSERY'])
    const body = await request.json()
    const { status } = body as { status: 'OPEN' | 'CLOSED' }

    if (!['OPEN', 'CLOSED'].includes(status)) {
      return NextResponse.json({ error: '無効なステータスです' }, { status: 400 })
    }

    const profile = await db.nurseryProfile.findUnique({ where: { userId: user.id } })
    if (!profile) return NextResponse.json({ error: 'プロフィールが見つかりません' }, { status: 404 })

    const existing = await db.jobPosting.findUnique({ where: { id: params.id, nurseryId: profile.id } })
    if (!existing) return NextResponse.json({ error: '募集情報が見つかりません' }, { status: 404 })

    const job = await db.jobPosting.update({ where: { id: params.id }, data: { status } })
    return NextResponse.json({ job })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status })
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
