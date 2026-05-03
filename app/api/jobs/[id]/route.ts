import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const job = await db.jobPosting.findUnique({
      where: { id: params.id, status: 'OPEN', nursery: { isPublished: true } },
      select: {
        id: true,
        title: true,
        workContent: true,
        workDate: true,
        workTimeStart: true,
        workTimeEnd: true,
        hourlyWage: true,
        targetPerson: true,
        remarks: true,
        status: true,
        nursery: { select: { id: true, nurseryName: true, area: true } },
      },
    })

    if (!job) {
      return NextResponse.json({ error: '募集情報が見つかりません' }, { status: 404 })
    }

    return NextResponse.json({ job })
  } catch {
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
