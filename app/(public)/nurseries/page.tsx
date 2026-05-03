import { Metadata } from 'next'
import Grid from '@mui/material/Grid'

export const dynamic = 'force-dynamic'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { db } from '@/lib/db'
import PageContainer from '@/components/ui/PageContainer'
import SectionHeading from '@/components/ui/SectionHeading'
import NurseryCard from '@/components/common/NurseryCard'
import Header from '@/components/common/Header'
import Footer from '@/components/common/Footer'
import type { PublicNurseryInfo } from '@/types'

export const metadata: Metadata = {
  title: '保育園一覧 | えんまーる',
  description: '長崎市内の保育園・保育施設の一覧です。スポットサポートを募集している保育園を探せます。',
}

async function getNurseries(): Promise<PublicNurseryInfo[]> {
  const nurseries = await db.nurseryProfile.findMany({
    where: { isPublished: true },
    select: {
      id: true,
      nurseryName: true,
      area: true,
      concept: true,
      policy: true,
      isPublished: true,
      reviewsReceived: {
        where: { isPublished: true },
        select: { explanation: true, atmosphere: true, support: true, clarity: true },
      },
    },
    orderBy: { nurseryName: 'asc' },
  })

  return nurseries.map((n) => {
    const reviews = n.reviewsReceived
    const count = reviews.length
    const averageRating =
      count > 0
        ? {
            explanation: reviews.reduce((s, r) => s + r.explanation, 0) / count,
            atmosphere: reviews.reduce((s, r) => s + r.atmosphere, 0) / count,
            support: reviews.reduce((s, r) => s + r.support, 0) / count,
            clarity: reviews.reduce((s, r) => s + r.clarity, 0) / count,
            total:
              reviews.reduce((s, r) => s + r.explanation + r.atmosphere + r.support + r.clarity, 0) /
              (count * 4),
            count,
          }
        : undefined

    return {
      id: n.id,
      nurseryName: n.nurseryName,
      area: n.area,
      concept: n.concept,
      policy: n.policy,
      isPublished: n.isPublished,
      averageRating,
    }
  })
}

export default async function NurseriesPage() {
  const nurseries = await getNurseries()

  return (
    <>
      <Header />
      <PageContainer>
        <SectionHeading subtitle="スポットサポートを募集している保育施設">
          保育園一覧
        </SectionHeading>

        {nurseries.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography color="text.secondary">現在公開中の保育園はありません</Typography>
          </Box>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {nurseries.length}件の保育園
            </Typography>
            <Grid container spacing={{ xs: 1.5, md: 2 }}>
              {nurseries.map((nursery) => (
                <Grid item xs={12} sm={6} md={4} key={nursery.id}>
                  <NurseryCard nursery={nursery} href={`/nurseries/${nursery.id}`} />
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </PageContainer>
      <Footer />
    </>
  )
}
