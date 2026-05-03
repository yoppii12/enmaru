import { NextRequest, NextResponse } from 'next/server'
import { requireRole, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'

async function getOwnedJob(userId: string, jobId: string) {
  const profile = await db.nurseryProfile.findUnique({ where: { userId } })
  if (!profile) return null
  return db.jobPosting.findUnique({ where: { id: jobId, nurseryId: profile.id } })
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireRole(['NURSERY'])
    const job = await getOwnedJob(user.id, params.id)
    if (!job) return NextResponse.json({ error: '募集情報が見つかりません' }, { status: 404 })
    return NextResponse.json({ job })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status })
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireRole(['NURSERY'])
    const existing = await getOwnedJob(user.id, params.id)
    if (!existing) return NextResponse.json({ error: '募集情報が見つかりません' }, { status: 404 })

    const body = await request.json()
    const { title, workContent, workDate, workTimeStart, workTimeEnd, hourlyWage, targetPerson, remarks } = body

    const job = await db.jobPosting.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(workContent !== undefined && { workContent }),
        ...(workDate !== undefined && { workDate: new Date(workDate) }),
        ...(workTimeStart !== undefined && { workTimeStart }),
        ...(workTimeEnd !== undefined && { workTimeEnd }),
        hourlyWage: hourlyWage ? Number(hourlyWage) : null,
        ...(targetPerson !== undefined && { targetPerson: targetPerson || null }),
        ...(remarks !== undefined && { remarks: remarks || null }),
      },
    })

    return NextResponse.json({ job })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status })
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireRole(['NURSERY'])
    const existing = await getOwnedJob(user.id, params.id)
    if (!existing) return NextResponse.json({ error: '募集情報が見つかりません' }, { status: 404 })

    await db.jobPosting.delete({ where: { id: params.id } })
    return NextResponse.json({ message: '削除しました' })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status })
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
