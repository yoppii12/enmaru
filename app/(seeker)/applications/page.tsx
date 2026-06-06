import { redirect } from 'next/navigation'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import PageContainer from '@/components/ui/PageContainer'
import SectionHeading from '@/components/ui/SectionHeading'
import StatusChip from '@/components/ui/StatusChip'
import Header from '@/components/common/Header'
import Footer from '@/components/common/Footer'

export const dynamic = 'force-dynamic'

export default async function ApplicationsPage() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'SEEKER') redirect('/login')

  const profile = await db.seekerProfile.findUnique({ where: { userId: user.id } })
  if (!profile) redirect('/profile')

  const applications = await db.application.findMany({
    where: { seekerId: profile.id },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          workDate: true,
          workTimeStart: true,
          workTimeEnd: true,
          nursery: { select: { id: true, nurseryName: true } },
        },
      },
      match: { select: { id: true, status: true } },
    },
    orderBy: { appliedAt: 'desc' },
  })

  return (
    <>
      <Header role="SEEKER" email={user.email} />
      <PageContainer>
        <SectionHeading>応募履歴</SectionHeading>

        {applications.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography color="text.secondary" sx={{ mb: 2 }}>まだ応募履歴がありません</Typography>
            <Typography
              component={Link}
              href="/nurseries"
              variant="body2"
              sx={{ color: '#F4A7B9', textDecoration: 'underline' }}
            >
              保育園を探す
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {applications.map((app) => (
              <Box
                key={app.id}
                sx={{
                  p: { xs: 1.5, md: 2 },
                  bgcolor: '#FAFAFA',
                  borderRadius: 2,
                  border: '1px solid #E0E0E0',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {app.job.nursery.nurseryName}
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {app.job.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(app.job.workDate).toLocaleDateString('ja-JP')} / {app.job.workTimeStart}〜{app.job.workTimeEnd}
                    </Typography>
                  </Box>
                  {app.match && <StatusChip status={app.match.status} />}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    応募日: {new Date(app.appliedAt).toLocaleDateString('ja-JP')}
                  </Typography>
                  {app.match && ['MATCHED', 'WORKING', 'COMPLETED', 'REVIEW_OPEN', 'REVIEW_DONE'].includes(app.match.status) && (
                    <Button
                      component={Link}
                      href={`/matches/${app.match.id}`}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.75rem', borderColor: '#F4A7B9', color: '#F4A7B9' }}
                    >
                      詳細・チャット
                    </Button>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </PageContainer>
      <Footer />
    </>
  )
}
