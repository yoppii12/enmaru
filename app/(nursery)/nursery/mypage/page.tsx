import { redirect } from 'next/navigation'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Chip from '@mui/material/Chip'
import Link from 'next/link'
import BusinessIcon from '@mui/icons-material/Business'
import WorkIcon from '@mui/icons-material/Work'
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd'
import StarIcon from '@mui/icons-material/Star'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import PageContainer from '@/components/ui/PageContainer'
import Header from '@/components/common/Header'
import Footer from '@/components/common/Footer'

export const dynamic = 'force-dynamic'

export default async function NurseryMypagePage() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'NURSERY') redirect('/login')

  const profile = await db.nurseryProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, nurseryName: true, isPublished: true },
  })

  const openJobCount = profile
    ? await db.jobPosting.count({ where: { nurseryId: profile.id, status: 'OPEN' } })
    : 0

  const newApplicationCount = profile
    ? await db.match.count({ where: { nurseryId: profile.id, status: 'APPLIED' } })
    : 0

  const navCards = [
    {
      href: '/nursery/profile',
      icon: <BusinessIcon sx={{ fontSize: 36, color: '#F4A7B9' }} />,
      title: '園プロフィール',
      description: '園の基本情報・コンセプト',
    },
    {
      href: '/nursery/jobs',
      icon: <WorkIcon sx={{ fontSize: 36, color: '#F4A7B9' }} />,
      title: '募集管理',
      description: 'スポット募集の作成・管理',
    },
    {
      href: '/nursery/applications',
      icon: <AssignmentIndIcon sx={{ fontSize: 36, color: '#F4A7B9' }} />,
      title: '応募管理',
      description: '届いた応募の確認',
    },
    {
      href: '/nursery/reviews',
      icon: <StarIcon sx={{ fontSize: 36, color: '#F4A7B9' }} />,
      title: '評価を書く',
      description: '業務完了後の評価入力',
    },
  ]

  return (
    <>
      <Header role="NURSERY" email={user.email} />
      <PageContainer>
        {/* あいさつ */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="h1" sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' }, mb: 0.25 }}>
              {profile?.nurseryName ?? 'マイページ'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              えんまーる 保育園ダッシュボード
            </Typography>
          </Box>
          {profile && (
            <Chip
              label={profile.isPublished ? '公開中' : '非公開'}
              size="small"
              sx={{
                bgcolor: profile.isPublished ? '#E8F5E9' : '#F9F9F9',
                color: profile.isPublished ? '#2E7D32' : '#AAAAAA',
                fontSize: '0.75rem',
              }}
            />
          )}
        </Box>

        {/* サマリー */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 1.5,
            mb: 3,
          }}
        >
          <SummaryCard label="公開中の募集" value={openJobCount} unit="件" />
          <SummaryCard label="新着応募" value={newApplicationCount} unit="件" />
        </Box>

        {/* ナビカード */}
        <Grid container spacing={1.5}>
          {navCards.map((card) => (
            <Grid item xs={6} md={3} key={card.href}>
              <Card sx={{ height: '100%' }}>
                <CardActionArea
                  component={Link}
                  href={card.href}
                  sx={{ height: '100%', alignItems: 'flex-start' }}
                >
                  <CardContent sx={{ p: { xs: 1.5, md: 2 } }}>
                    <Box sx={{ mb: 1 }}>{card.icon}</Box>
                    <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 700, fontSize: { xs: '0.8rem', md: '0.875rem' } }}>
                      {card.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                      {card.description}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </PageContainer>
      <Footer />
    </>
  )
}

function SummaryCard({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <Box
      sx={{
        bgcolor: '#F9F9F9',
        borderRadius: 2,
        p: { xs: 1.5, md: 2 },
        textAlign: 'center',
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
        {label}
      </Typography>
      <Typography variant="h3" sx={{ fontSize: { xs: '1.75rem', md: '2rem' }, color: '#F4A7B9' }}>
        {value}
        <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
          {unit}
        </Typography>
      </Typography>
    </Box>
  )
}
