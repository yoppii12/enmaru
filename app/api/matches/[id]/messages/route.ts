import { NextRequest, NextResponse } from 'next/server'
import { requireRole, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'

const CHAT_OPEN_STATUSES = ['MATCHED', 'WORKING', 'COMPLETED', 'REVIEW_OPEN', 'REVIEW_DONE']

async function checkChatAccess(matchId: string, userId: string, role: string) {
  const profile = role === 'SEEKER'
    ? await db.seekerProfile.findUnique({ where: { userId } })
    : await db.nurseryProfile.findUnique({ where: { userId } })
  if (!profile) return null

  const match = await db.match.findUnique({ where: { id: matchId } })
  if (!match) return null

  const isParticipant = role === 'SEEKER'
    ? match.seekerId === profile.id
    : match.nurseryId === profile.id
  if (!isParticipant) return null

  if (!CHAT_OPEN_STATUSES.includes(match.status)) return null

  // COMPLETED以降は completedAt から24時間以内のみ
  if (['COMPLETED', 'REVIEW_OPEN', 'REVIEW_DONE'].includes(match.status) && match.completedAt) {
    const elapsed = Date.now() - match.completedAt.getTime()
    if (elapsed > 24 * 60 * 60 * 1000) return null
  }

  return { match, profileId: profile.id }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole(['SEEKER', 'NURSERY'])
    const access = await checkChatAccess(params.id, user.id, user.role)
    if (!access) return NextResponse.json({ error: 'アクセスできません' }, { status: 403 })

    const messages = await db.message.findMany({
      where: { matchId: params.id },
      include: { sender: { select: { id: true, role: true } } },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ messages })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status })
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole(['SEEKER', 'NURSERY'])
    const access = await checkChatAccess(params.id, user.id, user.role)
    if (!access) return NextResponse.json({ error: 'チャット期間外です' }, { status: 403 })

    const body = await request.json()
    const { body: msgBody } = body
    if (!msgBody?.trim()) return NextResponse.json({ error: 'メッセージを入力してください' }, { status: 400 })

    const message = await db.message.create({
      data: { matchId: params.id, senderId: user.id, body: msgBody.trim() },
      include: { sender: { select: { id: true, role: true } } },
    })

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status })
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
