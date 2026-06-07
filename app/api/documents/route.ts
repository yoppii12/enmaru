import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'application/pdf']
const MAX_SIZE = 10 * 1024 * 1024 // 10MB
const BUCKET = 'documents'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensureBucket(supabase: any) {
  const { data: buckets } = await supabase.storage.listBuckets()
  if (!buckets?.find((b: { name: string }) => b.name === BUCKET)) {
    await supabase.storage.createBucket(BUCKET, { public: false })
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'SEEKER') {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const profile = await db.seekerProfile.findUnique({ where: { userId: user.id } })
  if (!profile) {
    return NextResponse.json({ error: 'プロフィールが見つかりません' }, { status: 404 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const documentType = formData.get('documentType') as string | null

  if (!file || !documentType) {
    return NextResponse.json({ error: 'ファイルと書類種別は必須です' }, { status: 400 })
  }

  const validTypes = ['LICENSE', 'HEALTH_CHECK', 'STOOL_TEST', 'RESUME']
  if (!validTypes.includes(documentType)) {
    return NextResponse.json({ error: '無効な書類種別です' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'JPG・PNG・HEIC・PDFのみ対応しています' }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'ファイルサイズは10MB以下にしてください' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  await ensureBucket(supabase)

  const ext = file.name.split('.').pop() ?? 'bin'
  const filePath = `${profile.id}/${documentType}/${Date.now()}.${ext}`
  const arrayBuffer = await file.arrayBuffer()

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, arrayBuffer, { contentType: file.type, upsert: false })

  if (uploadError) {
    return NextResponse.json({ error: 'アップロードに失敗しました' }, { status: 500 })
  }

  // 同じ documentType の既存レコード（PENDING/APPROVED）を REJECTED に
  await db.document.updateMany({
    where: {
      seekerId: profile.id,
      documentType: documentType as 'LICENSE' | 'HEALTH_CHECK' | 'STOOL_TEST' | 'RESUME',
      status: { in: ['PENDING', 'APPROVED'] },
    },
    data: { status: 'REJECTED', rejectionReason: '新しい書類に置き換えられました' },
  })

  const document = await db.document.create({
    data: {
      seekerId: profile.id,
      documentType: documentType as 'LICENSE' | 'HEALTH_CHECK' | 'STOOL_TEST' | 'RESUME',
      fileUrl: filePath,
      status: 'PENDING',
    },
  })

  return NextResponse.json({ document }, { status: 201 })
}

export async function GET() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'SEEKER') {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const profile = await db.seekerProfile.findUnique({ where: { userId: user.id } })
  if (!profile) {
    return NextResponse.json({ error: 'プロフィールが見つかりません' }, { status: 404 })
  }

  const documents = await db.document.findMany({
    where: { seekerId: profile.id },
    orderBy: { uploadedAt: 'desc' },
  })

  const supabase = getSupabaseAdmin()

  const documentsWithUrls = await Promise.all(
    documents.map(async (doc) => {
      const { data } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(doc.fileUrl, 60 * 60) // 1時間有効
      return { ...doc, signedUrl: data?.signedUrl ?? null }
    })
  )

  return NextResponse.json({ documents: documentsWithUrls })
}
