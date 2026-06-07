import { redirect } from 'next/navigation'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Link from 'next/link'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import SearchIcon from '@mui/icons-material/Search'
import AssignmentIcon from '@mui/icons-material/Assignment'
import StarIcon from '@mui/icons-material/Star'
import Alert from '@mui/material/Alert'
import FolderIcon from '@mui/icons-material/Folder'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import PageContainer from '@/components/ui/PageContainer'
import Header from '@/components/common/Header'
import Footer from '@/components/common/Footer'

export const dynamic = 'force-dynamic'

export default async function SeekerMypagePage() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'SEEKER') redirect('/login')

  const profile = await db.seekerProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, displayName: true },
  })

  const documents = profile
    ? await db.document.findMany({
        where: { seekerId: profile.id },
        orderBy: { uploadedAt: 'desc' },
      })
    : []

  const approvedTypes = new Set(
    documents.filter((d) => d.status === 'APPROVED').map((d) => d.documentType)
  )
  const hasMissingRequired = !approvedTypes.has('LICENSE') || !approvedTypes.has('HEALTH_CHECK')
  const hasPending = documents.some((d) => d.status === 'PENDING')

  const applicationCount = profile
    ? await db.application.count({ where: { seekerId: profile.id } })
    : 0

  const activeMatchCount = profile
    ? await db.match.count({
        where: {
          seekerId: profile.id,
          status: { in: ['SCREENING', 'MATCHED', 'WORKING'] },
        },
      })
    : 0

  const navCards = [
    {
      href: '/profile',
      icon: <AccountCircleIcon sx={{ fontSize: 36, color: '#F4A7B9' }} />,
      title: 'プロフィール編集',
      description: '自己紹介や希望条件を設定',
    },
    {
      href: '/nurseries',
      icon: <SearchIcon sx={{ fontSize: 36, color: '#F4A7B9' }} />,
      title: '保育園を探す',
      description: '長崎市内の保育園・募集を閲覧',
    },
    {
      href: '/applications',
      icon: <AssignmentIcon sx={{ fontSize: 36, color: '#F4A7B9' }} />,
      title: '応募履歴',
      description: '応募した募集の状況を確認',
    },
    {
      href: '/reviews',
      icon: <StarIcon sx={{ fontSize: 36, color: '#F4A7B9' }} />,
      title: '評価を書く',
      description: '業務完了後の評価入力',
    },
  ]

  return (
    <>
      <Header role="SEEKER" email={user.email} />
      <PageContainer>
        {/* 書類ステータスバナー */}
        {hasMissingRequired && (
          <Alert
            severity="warning"
            icon={<FolderIcon />}
            sx={{ mb: 2 }}
            action={
              <Typography
                component={Link}
                href="/documents"
                variant="caption"
                sx={{ color: 'inherit', textDecoration: 'underline', whiteSpace: 'nowrap' }}
              >
                書類管理へ
              </Typography>
            }
          >
            応募には保育士証・健康診断書の認証が必要です
          </Alert>
        )}
        {!hasMissingRequired && hasPending && (
          <Alert severity="info" icon={<FolderIcon />} sx={{ mb: 2 }}>
            書類を確認中です。認証まで少々お待ちください。
          </Alert>
        )}

        {/* あいさつ */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h1" sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' }, mb: 0.5 }}>
            {profile?.displayName ? `${profile.displayName}さん、こんにちは` : 'マイページ'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            えんまーるへようこそ
          </Typography>
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
          <SummaryCard label="応募件数" value={applicationCount} unit="件" />
          <SummaryCard label="進行中のマッチング" value={activeMatchCount} unit="件" />
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
