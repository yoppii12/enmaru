import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClientWithServiceRole } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import type { UserRole } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, role } = body as { email: string; password: string; role: UserRole }

    if (!email || !password || !role) {
      return NextResponse.json({ error: 'メールアドレス、パスワード、ロールは必須です' }, { status: 400 })
    }
    if (!['SEEKER', 'NURSERY'].includes(role)) {
      return NextResponse.json({ error: '無効なロールです' }, { status: 400 })
    }

    const supabase = createSupabaseServerClientWithServiceRole()

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError || !authData.user) {
      if (authError?.message?.includes('already registered')) {
        return NextResponse.json({ error: 'このメールアドレスは既に登録されています' }, { status: 409 })
      }
      return NextResponse.json({ error: '登録に失敗しました' }, { status: 500 })
    }

    const user = await db.user.create({
      data: {
        email,
        role,
        supabaseId: authData.user.id,
        agreedAt: new Date(),
      },
    })

    if (role === 'SEEKER') {
      await db.seekerProfile.create({
        data: { userId: user.id },
      })
    } else if (role === 'NURSERY') {
      await db.nurseryProfile.create({
        data: {
          userId: user.id,
          nurseryName: '',
          area: '',
        },
      })
    }

    return NextResponse.json({ message: '登録が完了しました' }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
