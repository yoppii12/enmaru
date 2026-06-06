import { redirect } from 'next/navigation'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import PageContainer from '@/components/ui/PageContainer'
import SectionHeading from '@/components/ui/SectionHeading'
import StatusChip from '@/components/ui/StatusChip'
import Header from '@/components/common/Header'
import Footer from '@/components/common/Footer'
import NurseryMatchActions from './NurseryMatchActions'

export const dynamic = 'force-dynamic'

type Props = { params: { id: string } }

export default async function NurseryMatchDetailPage({ params }: Props) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'NURSERY') redirect('/login')

  const profile = await db.nurseryProfile.findUnique({ where: { userId: user.id } })
  if (!profile) redirect('/nursery/profile')

  const match = await db.match.findUnique({
    where: { id: params.id },
    include: {
      job: {
        select: {
          title: true,
          workDate: true,
          workTimeStart: true,
          workTimeEnd: true,
          workContent: true,
          hourlyWage: true,
        },
      },
      seeker: { select: { displayName: true, preferredStyle: true, bio: true } },
      workReports: { select: { reporterType: true } },
    },
  })

  if (!match || match.nurseryId !== profile.id) redirect('/nursery/applications')

  const chatOpen = ['MATCHED', 'WORKING'].includes(match.status) ||
    (['COMPLETED', 'REVIEW_OPEN', 'REVIEW_DONE'].includes(match.status) &&
      match.completedAt != null &&
      Date.now() - match.completedAt.getTime() < 24 * 60 * 60 * 1000)

  const hasNurseryReport = match.workReports.some((r) => r.reporterType === 'NURSERY')

  return (
    <>
      <Header role="NURSERY" email={user.email} />
      <PageContainer maxWidth="sm">
        <SectionHeading subtitle={match.seeker.displayName ?? '保育士'}>
          マッチング詳細
        </SectionHeading>

        {/* ステータス */}
        <Box sx={{ mb: 2 }}>
          <StatusChip status={match.status} />
        </Box>

        {/* 業務情報 */}
        <Box sx={{ p: 2, bgcolor: '#FAFAFA', borderRadius: 2, border: '1px solid #E0E0E0', mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            {match.job.title}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            👤 担当：{match.seeker.displayName ?? '保育士'}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            📅 {new Date(match.job.workDate).toLocaleDateString('ja-JP')}
            {match.job.workTimeStart}〜{match.job.workTimeEnd}
          </Typography>
          {match.job.hourlyWage && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              💴 時給 {match.job.hourlyWage.toLocaleString()}円
            </Typography>
          )}
          <Divider sx={{ my: 1.5 }} />
          <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
            {match.job.workContent}
          </Typography>
        </Box>

        {/* アクション + チャット */}
        <NurseryMatchActions
          matchId={match.id}
          status={match.status}
          hasNurseryReport={hasNurseryReport}
          chatOpen={chatOpen}
          currentUserId={user.id}
        />
      </PageContainer>
      <Footer />
    </>
  )
}
