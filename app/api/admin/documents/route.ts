import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

const BUCKET = 'documents'

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  const documents = await db.document.findMany({
    where: status ? { status: status as 'PENDING' | 'APPROVED' | 'REJECTED' } : undefined,
    include: {
      seeker: {
        select: { id: true, displayName: true, realName: true },
      },
    },
    orderBy: { uploadedAt: 'desc' },
  })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const documentsWithUrls = await Promise.all(
    documents.map(async (doc) => {
      const { data } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(doc.fileUrl, 60 * 60)
      return { ...doc, signedUrl: data?.signedUrl ?? null }
    })
  )

  return NextResponse.json({ documents: documentsWithUrls })
}
