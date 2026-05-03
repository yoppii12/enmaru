import { notFound } from 'next/navigation'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Rating from '@mui/material/Rating'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Link from 'next/link'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import PageContainer from '@/components/ui/PageContainer'
import SectionHeading from '@/components/ui/SectionHeading'
import Header from '@/components/common/Header'
import Footer from '@/components/common/Footer'

type Props = { params: { id: string } }

export default async function SeekerNurseryDetailPage({ params }: Props) {
  const user = await getCurrentUser()

  const nursery = await db.nurseryProfile.findUnique({
    where: { id: params.id, isPublished: true },
    select: {
      id: true,
      nurseryName: true,
      area: true,
      concept: true,
      policy: true,
      isPublished: true,
      jobPostings: {
        where: { status: 'OPEN' },
        select: { id: true, title: true, workDate: true, workTimeStart: true, workTimeEnd: true, hourlyWage: true, targetPerson: true, workContent: true },
        orderBy: { workDate: 'asc' },
      },
      reviewsReceived: {
        where: { isPublished: true },
        select: { explanation: true, atmosphere: true, support: true, clarity: true, comment: true, reviewedAt: true },
        orderBy: { reviewedAt: 'desc' },
      },
    },
  })

  if (!nursery) notFound()

  const reviews = nursery.reviewsReceived
  const count = reviews.length
  const avg = count > 0 ? {
    total: reviews.reduce((s, r) => s + r.explanation + r.atmosphere + r.support + r.clarity, 0) / (count * 4),
    count,
  } : null

  // ログイン済み保育士の応募済みJobId一覧
  let appliedJobIds: string[] = []
  if (user?.role === 'SEEKER') {
    const profile = await db.seekerProfile.findUnique({ where: { userId: user.id } })
    if (profile) {
      const apps = await db.application.findMany({
        where: {
          seekerId: profile.id,
          jobId: { in: nursery.jobPostings.map((j) => j.id) },
        },
        select: { jobId: true },
      })
      appliedJobIds = apps.map((a) => a.jobId)
    }
  }

  return (
    <>
      <Header role={user?.role ?? null} />
      <PageContainer maxWidth="md">
        {/* ヘッダー */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h1" sx={{ fontSize: { xs: '1.375rem', md: '1.75rem' }, mb: 1 }}>
            {nursery.nurseryName}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
            <LocationOnIcon sx={{ fontSize: 16, color: '#AAAAAA' }} />
            <Typography variant="body2" color="text.secondary">{nursery.area}</Typography>
          </Box>
          {avg && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Rating
                value={avg.total}
                precision={0.1}
                readOnly
                size="small"
                sx={{ '& .MuiRating-iconFilled': { color: '#F4A7B9' }, '& .MuiRating-iconEmpty': { color: '#AAAAAA' } }}
              />
              <Typography variant="caption" color="text.secondary">{avg.total.toFixed(1)} ({avg.count}件)</Typography>
            </Box>
          )}
        </Box>

        <Divider sx={{ mb: 3 }} />

        {nursery.concept && (
          <Box sx={{ mb: 3 }}>
            <SectionHeading>コンセプト</SectionHeading>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{nursery.concept}</Typography>
          </Box>
        )}

        {nursery.policy && (
          <Box sx={{ mb: 3 }}>
            <SectionHeading>保育方針</SectionHeading>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{nursery.policy}</Typography>
          </Box>
        )}

        {/* 募集一覧 */}
        <Box sx={{ mb: 3 }}>
          <SectionHeading subtitle={`${nursery.jobPostings.length}件`}>現在の募集</SectionHeading>
          {nursery.jobPostings.length === 0 ? (
            <Typography variant="body2" color="text.secondary">現在募集中の求人はありません</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {nursery.jobPostings.map((job) => {
                const applied = appliedJobIds.includes(job.id)
                return (
                  <Card key={job.id} sx={{ border: '1px solid #E0E0E0' }}>
                    <CardContent sx={{ p: { xs: 1.5, md: 2 } }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>{job.title}</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CalendarTodayIcon sx={{ fontSize: 13, color: '#AAAAAA' }} />
                          <Typography variant="caption" color="text.secondary">
                            {new Date(job.workDate).toLocaleDateString('ja-JP')}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <AccessTimeIcon sx={{ fontSize: 13, color: '#AAAAAA' }} />
                          <Typography variant="caption" color="text.secondary">
                            {job.workTimeStart}〜{job.workTimeEnd}
                          </Typography>
                        </Box>
                        {job.hourlyWage && (
                          <Typography variant="caption" color="text.secondary">
                            時給{job.hourlyWage.toLocaleString()}円
                          </Typography>
                        )}
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: '0.8rem' }}>
                        {job.workContent}
                      </Typography>
                      {user?.role === 'SEEKER' ? (
                        applied ? (
                          <Typography variant="caption" sx={{ color: '#2E7D32' }}>✓ 応募済み</Typography>
                        ) : (
                          <Button
                            component={Link}
                            href={`/applications/new?jobId=${job.id}`}
                            variant="contained"
                            size="small"
                            sx={{ fontSize: '0.8rem' }}
                          >
                            この募集に応募する
                          </Button>
                        )
                      ) : (
                        <Button
                          component={Link}
                          href="/register"
                          variant="outlined"
                          size="small"
                          sx={{ fontSize: '0.8rem', borderColor: '#F4A7B9', color: '#F4A7B9' }}
                        >
                          登録して応募する
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </Box>
          )}
        </Box>
      </PageContainer>
      <Footer />
    </>
  )
}
