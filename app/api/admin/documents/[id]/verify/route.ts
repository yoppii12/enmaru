import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { createNotification, NOTIFICATION_TYPES } from '@/lib/notifications'

const DOCUMENT_LABELS: Record<string, string> = {
  LICENSE: '保育士証',
  HEALTH_CHECK: '健康診断書',
  STOOL_TEST: '検便結果',
  RESUME: '履歴書',
}

export async function PATCH(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 })
  }

  const document = await db.document.findUnique({
    where: { id: params.id },
    include: { seeker: { include: { user: { select: { id: true } } } } },
  })
  if (!document) {
    return NextResponse.json({ error: '書類が見つかりません' }, { status: 404 })
  }

  const updated = await db.document.update({
    where: { id: params.id },
    data: { status: 'APPROVED', verifiedAt: new Date() },
  })

  // 全必須書類が揃ったか確認（今回承認分も含める）
  const approvedDocs = await db.document.findMany({
    where: { seekerId: document.seekerId, status: 'APPROVED' },
    select: { documentType: true },
  })
  const approvedSet = new Set(approvedDocs.map((d) => d.documentType))
  const allRequiredApproved = ['HEALTH_CHECK', 'RESUME'].every((t) => approvedSet.has(t))

  const label = DOCUMENT_LABELS[document.documentType] ?? document.documentType
  const body = allRequiredApproved
    ? `${label}が認証されました。必須書類が揃い、応募が可能になりました。`
    : `${label}が認証されました。引き続き必要な書類をご提出ください。`

  await createNotification(
    document.seeker.user.id,
    NOTIFICATION_TYPES.DOCUMENT_APPROVED,
    '書類が認証されました',
    body,
    '/documents'
  )

  return NextResponse.json({ document: updated })
}
