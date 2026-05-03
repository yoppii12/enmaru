import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { AuthError } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: '未認証です' }, { status: 401 })
    }
    return NextResponse.json({ user })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
