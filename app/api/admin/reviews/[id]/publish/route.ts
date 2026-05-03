import { NextRequest, NextResponse } from 'next/server'
import { requireRole, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(['ADMIN'])
    const body = await request.json()
    const { type, isPublished } = body as { type: 'seeker-to-nursery' | 'nursery-to-seeker'; isPublished: boolean }

    if (type === 'seeker-to-nursery') {
      const review = await db.reviewSeekerToNursery.update({
        where: { id: params.id },
        data: { isPublished },
      })
      return NextResponse.json({ review })
    } else {
      const review = await db.reviewNurseryToSeeker.update({
        where: { id: params.id },
        data: { isPublished },
      })
      return NextResponse.json({ review })
    }
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status })
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
