import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import Header from '@/components/common/Header'
import Footer from '@/components/common/Footer'
import PageContainer from '@/components/ui/PageContainer'
import SectionHeading from '@/components/ui/SectionHeading'
import DocumentUploadSection from './DocumentUploadSection'

export const dynamic = 'force-dynamic'

const DOCUMENT_LABELS: Record<string, string> = {
  LICENSE: '保育士証',
  HEALTH_CHECK: '健康診断書',
  STOOL_TEST: '検便結果',
  RESUME: '履歴書',
}

const REQUIRED_TYPES = ['HEALTH_CHECK', 'RESUME']
const OPTIONAL_TYPES = ['LICENSE', 'STOOL_TEST']

export default async function DocumentsPage() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'SEEKER') redirect('/login')

  const profile = await db.seekerProfile.findUnique({ where: { userId: user.id } })
  if (!profile) redirect('/profile')

  const allDocuments = await db.document.findMany({
    where: { seekerId: profile.id },
    orderBy: { uploadedAt: 'desc' },
  })

  // 各書類種別の最新レコードだけ取り出す
  const latestByType: Record<string, typeof allDocuments[0] | null> = {}
  for (const type of [...REQUIRED_TYPES, ...OPTIONAL_TYPES]) {
    latestByType[type] = allDocuments.find((d) => d.documentType === type) ?? null
  }

  return (
    <>
      <Header role="SEEKER" email={user.email} />
      <PageContainer>
        <SectionHeading subtitle="応募には健康診断書・履歴書の認証が必要です">
          書類管理
        </SectionHeading>

        <DocumentUploadSection
          latestByType={latestByType}
          requiredTypes={REQUIRED_TYPES}
          optionalTypes={OPTIONAL_TYPES}
          documentLabels={DOCUMENT_LABELS}
        />
      </PageContainer>
      <Footer />
    </>
  )
}
