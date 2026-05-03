import { NextRequest, NextResponse } from 'next/server'
import { requireRole, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { notifyApplicationReceived } from '@/lib/line'

export async function GET() {
  try {
    const user = await requireRole(['SEEKER'])

    const profile = await db.seekerProfile.findUnique({ where: { userId: user.id } })
    if (!profile) return NextResponse.json({ error: 'プロフィールが見つかりません' }, { status: 404 })

    const applications = await db.application.findMany({
      where: { seekerId: profile.id },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            workDate: true,
            workTimeStart: true,
            workTimeEnd: true,
            nursery: { select: { id: true, nurseryName: true, area: true } },
          },
        },
        match: { select: { id: true, status: true } },
      },
      orderBy: { appliedAt: 'desc' },
    })

    return NextResponse.json({ applications })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status })
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['SEEKER'])

    const profile = await db.seekerProfile.findUnique({
      where: { userId: user.id },
      select: { id: true, displayName: true },
    })
    if (!profile) return NextResponse.json({ error: 'プロフィールが見つかりません' }, { status: 404 })

    const body = await request.json()
    const { jobId, applyMessage, lineContactOk } = body

    if (!jobId) return NextResponse.json({ error: '募集IDは必須です' }, { status: 400 })

    // 重複応募チェック
    const existing = await db.application.findFirst({
      where: { jobId, seekerId: profile.id },
    })
    if (existing) {
      return NextResponse.json({ error: 'この募集にはすでに応募済みです' }, { status: 409 })
    }

    // 募集存在確認
    const job = await db.jobPosting.findUnique({
      where: { id: jobId, status: 'OPEN' },
      include: { nursery: { include: { user: { select: { lineUserId: true } } } } },
    })
    if (!job) return NextResponse.json({ error: '募集情報が見つかりません' }, { status: 404 })

    const application = await db.application.create({
      data: {
        jobId,
        seekerId: profile.id,
        applyMessage: applyMessage || null,
        lineContactOk: Boolean(lineContactOk),
      },
    })

    // マッチングレコード作成
    await db.match.create({
      data: {
        applicationId: application.id,
        jobId,
        nurseryId: job.nurseryId,
        seekerId: profile.id,
      },
    })

    // LINE通知
    await notifyApplicationReceived(
      job.nursery.user.lineUserId,
      profile.displayName ?? '保育士',
      job.title
    )

    return NextResponse.json({ application }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status })
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
