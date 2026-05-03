import { NextRequest, NextResponse } from 'next/server'
import { requireRole, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const user = await requireRole(['SEEKER'])

    const profile = await db.seekerProfile.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        displayName: true,
        license: true,
        blankYears: true,
        preferredArea: true,
        preferredStyle: true,
        bio: true,
        experience: true,
        skills: true,
        ngConditions: true,
        isPublished: true,
        // realName は意図的に除外
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
    const user = await requireRole(['SEEKER'])
    const body = await request.json()

    const {
      realName,
      displayName,
      license,
      blankYears,
      preferredArea,
      preferredStyle,
      bio,
      experience,
      skills,
      ngConditions,
      isPublished,
    } = body

    const profile = await db.seekerProfile.update({
      where: { userId: user.id },
      data: {
        ...(realName !== undefined && { realName }),
        ...(displayName !== undefined && { displayName }),
        ...(license !== undefined && { license }),
        ...(blankYears !== undefined && { blankYears }),
        ...(preferredArea !== undefined && { preferredArea }),
        ...(preferredStyle !== undefined && { preferredStyle }),
        ...(bio !== undefined && { bio }),
        ...(experience !== undefined && { experience }),
        ...(skills !== undefined && { skills }),
        ...(ngConditions !== undefined && { ngConditions }),
        ...(isPublished !== undefined && { isPublished }),
      },
      select: {
        id: true,
        displayName: true,
        license: true,
        blankYears: true,
        preferredArea: true,
        preferredStyle: true,
        bio: true,
        experience: true,
        skills: true,
        ngConditions: true,
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
