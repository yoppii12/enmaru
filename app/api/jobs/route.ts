import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const jobs = await db.jobPosting.findMany({
      where: { status: 'OPEN', nursery: { isPublished: true } },
      select: {
        id: true,
        title: true,
        workDate: true,
        workTimeStart: true,
        workTimeEnd: true,
        hourlyWage: true,
        targetPerson: true,
        nursery: { select: { id: true, nurseryName: true, area: true } },
      },
      orderBy: { workDate: 'asc' },
    })

    return NextResponse.json({ jobs })
  } catch {
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
