import { NextRequest, NextResponse } from 'next/server'
import { requireRole, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { notifyMatchingConfirmed } from '@/lib/line'

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
    const existingApp = await db.application.findFirst({
      where: { jobId, seekerId: profile.id },
    })
    if (existingApp) {
      return NextResponse.json({ error: 'この募集にはすでに応募済みです' }, { status: 409 })
    }

    // 必須書類チェック（HEALTH_CHECK・RESUME が APPROVED であること）
    const approvedTypes = await db.document.findMany({
      where: { seekerId: profile.id, status: 'APPROVED' },
      select: { documentType: true },
    })
    const approvedSet = new Set(approvedTypes.map((d) => d.documentType))
    const missing = (['HEALTH_CHECK', 'RESUME'] as const).filter((t) => !approvedSet.has(t))
    if (missing.length > 0) {
      return NextResponse.json(
        { error: '応募には書類の認証が必要です', missingDocuments: missing },
        { status: 403 }
      )
    }

    // 募集が存在・OPENであること確認
    const job = await db.jobPosting.findUnique({
      where: { id: jobId, status: 'OPEN' },
      include: {
        nursery: {
          include: { user: { select: { lineUserId: true } } },
        },
      },
    })
    if (!job) return NextResponse.json({ error: 'この募集は受付を終了しました' }, { status: 409 })

    // seekerのlineUserIdを取得
    const seekerUser = await db.user.findUnique({
      where: { id: user.id },
      select: { lineUserId: true },
    })

    // Application と Match を作成（即時MATCHED）
    const application = await db.application.create({
      data: {
        jobId,
        seekerId: profile.id,
        applyMessage: applyMessage || null,
        lineContactOk: Boolean(lineContactOk),
      },
    })

    await db.match.create({
      data: {
        applicationId: application.id,
        jobId,
        nurseryId: job.nurseryId,
        seekerId: profile.id,
        status: 'MATCHED',
      },
    })

    // 募集をCLOSEDにする（先着順）
    await db.jobPosting.update({
      where: { id: jobId },
      data: { status: 'CLOSED' },
    })

    // 双方にマッチング成立LINE通知
    await notifyMatchingConfirmed(
      seekerUser?.lineUserId ?? null,
      job.nursery.user.lineUserId ?? null,
      job.nursery.nurseryName,
      job.title
    )

    return NextResponse.json({ application }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status })
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
