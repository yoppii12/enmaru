import { NextRequest, NextResponse } from 'next/server'
import { requireRole, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole(['SEEKER'])

    const profile = await db.seekerProfile.findUnique({ where: { userId: user.id } })
    if (!profile) return NextResponse.json({ error: 'プロフィールが見つかりません' }, { status: 404 })

    const match = await db.match.findUnique({ where: { id: params.id } })
    if (!match) return NextResponse.json({ error: 'マッチングが見つかりません' }, { status: 404 })
    if (match.seekerId !== profile.id) return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 })
    if (match.status !== 'MATCHED') return NextResponse.json({ error: '業務開始できる状態ではありません' }, { status: 400 })

    const updated = await db.match.update({
      where: { id: params.id },
      data: { status: 'WORKING' },
    })

    return NextResponse.json({ match: updated })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status })
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
