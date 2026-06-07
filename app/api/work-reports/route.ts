import { NextRequest, NextResponse } from 'next/server'
import { requireRole, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { notifyWorkCompleted } from '@/lib/line'
import { createNotification, NOTIFICATION_TYPES } from '@/lib/notifications'

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['SEEKER', 'NURSERY'])
    const body = await request.json()
    const { matchId, completed, comment } = body

    if (!matchId || completed === undefined) {
      return NextResponse.json({ error: 'matchIdとcompletedは必須です' }, { status: 400 })
    }

    const match = await db.match.findUnique({
      where: { id: matchId },
      include: {
        seeker: { include: { user: { select: { id: true, lineUserId: true } } } },
        nursery: { include: { user: { select: { id: true, lineUserId: true } } } },
      },
    })
    if (!match) return NextResponse.json({ error: 'マッチングが見つかりません' }, { status: 404 })

    // 権限確認
    let reporterType: string
    if (user.role === 'SEEKER') {
      const profile = await db.seekerProfile.findUnique({ where: { userId: user.id } })
      if (!profile || match.seekerId !== profile.id) {
        return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 })
      }
      reporterType = 'SEEKER'
    } else {
      const profile = await db.nurseryProfile.findUnique({ where: { userId: user.id } })
      if (!profile || match.nurseryId !== profile.id) {
        return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 })
      }
      reporterType = 'NURSERY'
    }

    // 重複チェック
    const existingReport = await db.workReport.findFirst({
      where: { matchId, reporterType },
    })
    if (existingReport) {
      return NextResponse.json({ error: 'すでに報告済みです' }, { status: 409 })
    }

    const report = await db.workReport.create({
      data: { matchId, reporterType, completed, comment: comment || null },
    })

    // 相手に業務完了報告の通知
    const otherUserId = reporterType === 'SEEKER'
      ? match.nursery.user.id
      : match.seeker.user.id
    await createNotification(
      otherUserId,
      NOTIFICATION_TYPES.WORK_REPORT_SUBMITTED,
      '業務完了が報告されました',
      '相手が業務完了を報告しました。あなたも報告してください。',
      reporterType === 'SEEKER' ? `/nursery/matches/${matchId}` : `/matches/${matchId}`
    )

    // 双方の報告が揃ったか確認
    const allReports = await db.workReport.findMany({ where: { matchId } })
    const hasSeeker = allReports.some((r) => r.reporterType === 'SEEKER')
    const hasNursery = allReports.some((r) => r.reporterType === 'NURSERY')

    if (hasSeeker && hasNursery) {
      await db.match.update({ where: { id: matchId }, data: { status: 'COMPLETED', completedAt: new Date() } })

      // 管理者に通知
      const adminUsers = await db.user.findMany({ where: { role: 'ADMIN' } })
      for (const admin of adminUsers) {
        if (admin.lineUserId) {
          await notifyWorkCompleted(admin.lineUserId, matchId)
        }
      }
    }

    return NextResponse.json({ report }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status })
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
