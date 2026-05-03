import { NextRequest, NextResponse } from 'next/server'
import { requireRole, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const user = await requireRole(['NURSERY'])

    const profile = await db.nurseryProfile.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        nurseryName: true,
        area: true,
        address: true,
        contactName: true,
        phone: true,
        concept: true,
        policy: true,
        isPublished: true,
      },
    })

    if (!profile) {
      return NextResponse.json({ error: 'プロフィールが見つかりません' }, { status: 404 })
    }

    return NextResponse.json({ profile })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireRole(['NURSERY'])
    const body = await request.json()

    const { nurseryName, area, address, contactName, phone, concept, policy, isPublished } = body

    const profile = await db.nurseryProfile.update({
      where: { userId: user.id },
      data: {
        ...(nurseryName !== undefined && { nurseryName }),
        ...(area !== undefined && { area }),
        ...(address !== undefined && { address }),
        ...(contactName !== undefined && { contactName }),
        ...(phone !== undefined && { phone }),
        ...(concept !== undefined && { concept }),
        ...(policy !== undefined && { policy }),
        ...(isPublished !== undefined && { isPublished }),
      },
      select: {
        id: true,
        nurseryName: true,
        area: true,
        address: true,
        contactName: true,
        phone: true,
        concept: true,
        policy: true,
        isPublished: true,
      },
    })

    return NextResponse.json({ profile })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
