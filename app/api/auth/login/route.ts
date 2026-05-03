import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body as { email: string; password: string }

    if (!email || !password) {
      return NextResponse.json({ error: 'メールアドレスとパスワードは必須です' }, { status: 400 })
    }

    const supabase = await createSupabaseServerClient()

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !data.user) {
      return NextResponse.json({ error: 'メールアドレスまたはパスワードが正しくありません' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { supabaseId: data.user.id },
      select: { id: true, role: true, isActive: true },
    })

    if (!user || !user.isActive) {
      await supabase.auth.signOut()
      return NextResponse.json({ error: 'アカウントが無効です' }, { status: 403 })
    }

    const redirectPath =
      user.role === 'SEEKER' ? '/mypage' :
      user.role === 'NURSERY' ? '/nursery/mypage' :
      '/admin/matches'

    return NextResponse.json({ redirectPath })
  } catch {
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
