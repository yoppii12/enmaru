import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: '未認証です' }, { status: 401 })

    const match = await db.match.findUnique({
      where: { id: params.id },
      include: {
        job: { select: { title: true, workDate: true, workTimeStart: true, workTimeEnd: true } },
        nursery: { select: { id: true, nurseryName: true, area: true } },
        seeker: { select: { id: true, displayName: true } },
      },
    })

    if (!match) return NextResponse.json({ error: 'マッチングが見つかりません' }, { status: 404 })

    // 本人確認（保育士または保育園の関係者のみ）
    if (user.role === 'SEEKER') {
      const profile = await db.seekerProfile.findUnique({ where: { userId: user.id } })
      if (!profile || match.seekerId !== profile.id) {
        return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 })
      }
    } else if (user.role === 'NURSERY') {
      const profile = await db.nurseryProfile.findUnique({ where: { userId: user.id } })
      if (!profile || match.nurseryId !== profile.id) {
        return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 })
      }
    }
    // ADMIN はすべてのマッチングにアクセス可

    return NextResponse.json({ match })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status })
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
