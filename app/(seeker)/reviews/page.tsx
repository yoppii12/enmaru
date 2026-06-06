import { redirect } from 'next/navigation'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import PageContainer from '@/components/ui/PageContainer'
import SectionHeading from '@/components/ui/SectionHeading'
import Header from '@/components/common/Header'
import Footer from '@/components/common/Footer'

export const dynamic = 'force-dynamic'

export default async function SeekerReviewsPage() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'SEEKER') redirect('/login')

  const profile = await db.seekerProfile.findUnique({ where: { userId: user.id } })
  if (!profile) redirect('/profile')

  const matches = await db.match.findMany({
    where: {
      seekerId: profile.id,
      status: { in: ['COMPLETED', 'REVIEW_OPEN', 'REVIEW_DONE'] },
    },
    include: {
      job: { select: { title: true, workDate: true, workTimeStart: true, workTimeEnd: true } },
      nursery: { select: { nurseryName: true } },
      reviewSeekerToNursery: { select: { id: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <>
      <Header role="SEEKER" email={user.email} />
      <PageContainer>
        <SectionHeading subtitle="業務完了後に保育園への評価を入力してください">
          評価を書く
        </SectionHeading>

        {matches.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography color="text.secondary">現在評価できる案件はありません</Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {matches.map((match) => {
              const reviewed = !!match.reviewSeekerToNursery
              return (
                <Box
                  key={match.id}
                  sx={{
                    p: { xs: 1.5, md: 2 },
                    bgcolor: '#FAFAFA',
                    borderRadius: 2,
                    border: '1px solid #E0E0E0',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 1,
                  }}
                >
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {match.nursery.nurseryName}
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {match.job.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(match.job.workDate).toLocaleDateString('ja-JP')} /{' '}
                      {match.job.workTimeStart}〜{match.job.workTimeEnd}
                    </Typography>
                  </Box>
                  <Box sx={{ flexShrink: 0 }}>
                    {reviewed ? (
                      <Chip
                        label="評価済み"
                        size="small"
                        sx={{ bgcolor: '#E8F5E9', color: '#2E7D32', fontSize: '0.75rem' }}
                      />
                    ) : (
                      <Button
                        component={Link}
                        href={`/reviews/${match.id}`}
                        variant="contained"
                        size="small"
                        sx={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                      >
                        評価する
                      </Button>
                    )}
                  </Box>
                </Box>
              )
            })}
          </Box>
        )}
      </PageContainer>
      <Footer />
    </>
  )
}
