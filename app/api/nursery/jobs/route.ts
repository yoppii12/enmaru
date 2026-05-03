import { NextRequest, NextResponse } from 'next/server'
import { requireRole, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const user = await requireRole(['NURSERY'])

    const profile = await db.nurseryProfile.findUnique({ where: { userId: user.id } })
    if (!profile) {
      return NextResponse.json({ error: 'プロフィールが見つかりません' }, { status: 404 })
    }

    const jobs = await db.jobPosting.findMany({
      where: { nurseryId: profile.id },
      orderBy: { workDate: 'desc' },
    })

    return NextResponse.json({ jobs })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['NURSERY'])

    const profile = await db.nurseryProfile.findUnique({ where: { userId: user.id } })
    if (!profile) {
      return NextResponse.json({ error: 'プロフィールが見つかりません' }, { status: 404 })
    }

    const body = await request.json()
    const { title, workContent, workDate, workTimeStart, workTimeEnd, hourlyWage, targetPerson, remarks } = body

    if (!title || !workContent || !workDate || !workTimeStart || !workTimeEnd) {
      return NextResponse.json({ error: '必須項目を入力してください' }, { status: 400 })
    }

    const job = await db.jobPosting.create({
      data: {
        nurseryId: profile.id,
        title,
        workContent,
        workDate: new Date(workDate),
        workTimeStart,
        workTimeEnd,
        hourlyWage: hourlyWage ? Number(hourlyWage) : null,
        targetPerson: targetPerson || null,
        remarks: remarks || null,
      },
    })

    return NextResponse.json({ job }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
