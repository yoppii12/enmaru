import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 })
  }

  const { reason } = await request.json()
  if (!reason?.trim()) {
    return NextResponse.json({ error: '差し戻し理由は必須です' }, { status: 400 })
  }

  const document = await db.document.findUnique({ where: { id: params.id } })
  if (!document) {
    return NextResponse.json({ error: '書類が見つかりません' }, { status: 404 })
  }

  const updated = await db.document.update({
    where: { id: params.id },
    data: { status: 'REJECTED', rejectionReason: reason.trim() },
  })

  return NextResponse.json({ document: updated })
}
