import { NextRequest, NextResponse } from 'next/server'
import { requireRole, canSubmitReview, updateReviewStatus, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['NURSERY'])
    const body = await request.json()
    const { matchId, attitude, communication, skill, comment, wouldRehire } = body

    if (!matchId || attitude === undefined || communication === undefined || skill === undefined || wouldRehire === undefined) {
      return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 })
    }

    for (const val of [attitude, communication, skill]) {
      if (typeof val !== 'number' || val < 1 || val > 5) {
        return NextResponse.json({ error: '評価は1〜5の整数で入力してください' }, { status: 400 })
      }
    }

    const profile = await db.nurseryProfile.findUnique({ where: { userId: user.id } })
    if (!profile) return NextResponse.json({ error: 'プロフィールが見つかりません' }, { status: 404 })

    const allowed = await canSubmitReview(matchId, profile.id)
    if (!allowed) {
      return NextResponse.json({ error: '評価を送信できません' }, { status: 403 })
    }

    const existing = await db.reviewNurseryToSeeker.findUnique({ where: { matchId } })
    if (existing) {
      return NextResponse.json({ error: 'すでに評価済みです' }, { status: 409 })
    }

    const match = await db.match.findUnique({ where: { id: matchId }, select: { seekerId: true } })
    if (!match) return NextResponse.json({ error: 'マッチングが見つかりません' }, { status: 404 })

    const review = await db.reviewNurseryToSeeker.create({
      data: {
        matchId,
        nurseryId: profile.id,
        seekerId: match.seekerId,
        attitude,
        communication,
        skill,
        comment: comment || null,
        wouldRehire: Boolean(wouldRehire),
      },
    })

    await updateReviewStatus(matchId)

    return NextResponse.json({ review }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status })
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
