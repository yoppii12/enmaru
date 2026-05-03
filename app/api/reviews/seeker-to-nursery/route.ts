import { NextRequest, NextResponse } from 'next/server'
import { requireRole, canSubmitReview, updateReviewStatus, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['SEEKER'])
    const body = await request.json()
    const { matchId, explanation, atmosphere, support, clarity, comment, wouldWorkAgain } = body

    if (!matchId || explanation === undefined || atmosphere === undefined || support === undefined || clarity === undefined || wouldWorkAgain === undefined) {
      return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 })
    }

    for (const val of [explanation, atmosphere, support, clarity]) {
      if (typeof val !== 'number' || val < 1 || val > 5) {
        return NextResponse.json({ error: '評価は1〜5の整数で入力してください' }, { status: 400 })
      }
    }

    const profile = await db.seekerProfile.findUnique({ where: { userId: user.id } })
    if (!profile) return NextResponse.json({ error: 'プロフィールが見つかりません' }, { status: 404 })

    const allowed = await canSubmitReview(matchId, profile.id)
    if (!allowed) {
      return NextResponse.json({ error: '評価を送信できません' }, { status: 403 })
    }

    // 重複チェック
    const existing = await db.reviewSeekerToNursery.findUnique({ where: { matchId } })
    if (existing) {
      return NextResponse.json({ error: 'すでに評価済みです' }, { status: 409 })
    }

    const match = await db.match.findUnique({ where: { id: matchId }, select: { nurseryId: true } })
    if (!match) return NextResponse.json({ error: 'マッチングが見つかりません' }, { status: 404 })

    const review = await db.reviewSeekerToNursery.create({
      data: {
        matchId,
        seekerId: profile.id,
        nurseryId: match.nurseryId,
        explanation,
        atmosphere,
        support,
        clarity,
        comment: comment || null,
        wouldWorkAgain: Boolean(wouldWorkAgain),
      },
    })

    await updateReviewStatus(matchId)

    return NextResponse.json({ review }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status })
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
