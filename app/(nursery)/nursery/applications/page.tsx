import { redirect } from 'next/navigation'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'
import { db } from '@/lib/db'
import PageContainer from '@/components/ui/PageContainer'
import SectionHeading from '@/components/ui/SectionHeading'
import StatusChip from '@/components/ui/StatusChip'
import Header from '@/components/common/Header'
import Footer from '@/components/common/Footer'

export default async function NurseryApplicationsPage() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'NURSERY') redirect('/login')

  const profile = await db.nurseryProfile.findUnique({ where: { userId: user.id } })
  if (!profile) redirect('/nursery/profile')

  const matches = await db.match.findMany({
    where: { nurseryId: profile.id },
    include: {
      application: {
        select: { applyMessage: true, lineContactOk: true, appliedAt: true },
      },
      job: { select: { id: true, title: true, workDate: true, workTimeStart: true, workTimeEnd: true } },
      seeker: { select: { id: true, displayName: true, preferredStyle: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const newMatches = matches.filter((m) => m.status === 'APPLIED')
  const otherMatches = matches.filter((m) => m.status !== 'APPLIED')

  return (
    <>
      <Header role="NURSERY" email={user.email} />
      <PageContainer>
        <SectionHeading subtitle="保育士の本名はマッチング成立後に開示されます">
          応募管理
        </SectionHeading>

        {matches.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography color="text.secondary">まだ応募がありません</Typography>
          </Box>
        ) : (
          <>
            {newMatches.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, color: '#F4A7B9' }}>
                  新着応募（{newMatches.length}件）
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {newMatches.map((match) => <MatchCard key={match.id} match={match} />)}
                </Box>
              </Box>
            )}

            {otherMatches.length > 0 && (
              <>
                {newMatches.length > 0 && <Divider sx={{ my: 2 }} />}
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1.5, color: '#666666' }}>
                    その他（{otherMatches.length}件）
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {otherMatches.map((match) => <MatchCard key={match.id} match={match} />)}
                  </Box>
                </Box>
              </>
            )}
          </>
        )}
      </PageContainer>
      <Footer />
    </>
  )
}

type MatchCardProps = {
  match: {
    id: string
    status: string
    job: { title: string; workDate: Date; workTimeStart: string; workTimeEnd: string }
    seeker: { displayName: string | null; preferredStyle: string[] }
    application: { applyMessage: string | null; lineContactOk: boolean; appliedAt: Date }
  }
}

function MatchCard({ match }: MatchCardProps) {
  return (
    <Box
      sx={{
        p: { xs: 1.5, md: 2 },
        bgcolor: '#FAFAFA',
        borderRadius: 2,
        border: '1px solid #E0E0E0',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, mb: 1 }}>
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {match.seeker.displayName ?? '保育士'}
          </Typography>
          {match.seeker.preferredStyle.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
              {match.seeker.preferredStyle.map((s) => (
                <Chip key={s} label={s} size="small" sx={{ fontSize: '0.65rem', height: 20 }} />
              ))}
            </Box>
          )}
        </Box>
        <StatusChip status={match.status} />
      </Box>

      <Typography variant="caption" color="text.secondary">
        {match.job.title} / {new Date(match.job.workDate).toLocaleDateString('ja-JP')} {match.job.workTimeStart}〜{match.job.workTimeEnd}
      </Typography>

      {match.application.applyMessage && (
        <Box sx={{ mt: 1, p: 1, bgcolor: '#FFFFFF', borderRadius: 1, border: '1px solid #F0F0F0' }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>応募メッセージ</Typography>
          <Typography variant="body2" sx={{ fontSize: '0.8rem', whiteSpace: 'pre-wrap' }}>
            {match.application.applyMessage}
          </Typography>
        </Box>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Typography variant="caption" color="text.secondary">
            応募日: {new Date(match.application.appliedAt).toLocaleDateString('ja-JP')}
          </Typography>
          {match.application.lineContactOk && (
            <Typography variant="caption" sx={{ color: '#2E7D32' }}>LINE連絡OK</Typography>
          )}
        </Box>
        {['MATCHED', 'WORKING', 'COMPLETED', 'REVIEW_OPEN', 'REVIEW_DONE'].includes(match.status) && (
          <Button
            component={Link}
            href={`/nursery/matches/${match.id}`}
            size="small"
            variant="outlined"
            sx={{ fontSize: '0.75rem', borderColor: '#F4A7B9', color: '#F4A7B9' }}
          >
            詳細・チャット
          </Button>
        )}
      </Box>
    </Box>
  )
}
