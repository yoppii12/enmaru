'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import Rating from '@mui/material/Rating'
import Alert from '@mui/material/Alert'
import PageContainer from '@/components/ui/PageContainer'
import SectionHeading from '@/components/ui/SectionHeading'
import ErrorAlert from '@/components/common/ErrorAlert'
import Header from '@/components/common/Header'
import Footer from '@/components/common/Footer'

const CRITERIA = [
  { key: 'attitude', label: '勤務態度' },
  { key: 'communication', label: 'コミュニケーション' },
  { key: 'skill', label: '保育スキル' },
] as const

type Ratings = Record<'attitude' | 'communication' | 'skill', number>

export default function NurseryReviewPage() {
  const router = useRouter()
  const params = useParams()
  const matchId = params.matchId as string

  const [ratings, setRatings] = useState<Ratings>({ attitude: 0, communication: 0, skill: 0 })
  const [comment, setComment] = useState('')
  const [wouldRehire, setWouldRehire] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    for (const c of CRITERIA) {
      if (ratings[c.key] === 0) {
        setError(`「${c.label}」を評価してください`)
        return
      }
    }

    setSubmitting(true)
    setError(null)

    const res = await fetch('/api/reviews/nursery-to-seeker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId, ...ratings, comment, wouldRehire }),
    })

    const data = await res.json()
    setSubmitting(false)

    if (!res.ok) {
      setError(data.error ?? '評価の送信に失敗しました')
      return
    }

    setSuccess(true)
  }

  if (success) {
    return (
      <>
        <Header role="NURSERY" />
        <PageContainer maxWidth="sm">
          <Alert severity="success" sx={{ borderRadius: 2, mb: 2 }}>
            評価を送信しました。ありがとうございます。
          </Alert>
          <Button variant="contained" fullWidth onClick={() => router.push('/nursery/mypage')}>
            マイページへ戻る
          </Button>
        </PageContainer>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header role="NURSERY" />
      <PageContainer maxWidth="sm">
        <SectionHeading subtitle="保育士への評価を入力してください">
          保育士を評価する
        </SectionHeading>

        <ErrorAlert message={error} />

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {CRITERIA.map(({ key, label }) => (
            <Box key={key}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>{label}</Typography>
              <Rating
                value={ratings[key]}
                onChange={(_, val) => setRatings((prev) => ({ ...prev, [key]: val ?? 0 }))}
                size="large"
                sx={{ '& .MuiRating-iconFilled': { color: '#F4A7B9' }, '& .MuiRating-iconEmpty': { color: '#AAAAAA' } }}
              />
            </Box>
          ))}

          <TextField
            label="コメント（任意）"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            fullWidth
            size="small"
            multiline
            rows={4}
            placeholder="一緒に働いての感想を自由に書いてください"
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={wouldRehire}
                onChange={(e) => setWouldRehire(e.target.checked)}
                size="small"
                sx={{ color: '#F4A7B9', '&.Mui-checked': { color: '#F4A7B9' } }}
              />
            }
            label={<Typography variant="body2">またこの保育士に依頼したい</Typography>}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={submitting}
            sx={{ py: 1.25 }}
          >
            {submitting ? '送信中...' : '評価を送信する'}
          </Button>
        </Box>
      </PageContainer>
      <Footer />
    </>
  )
}
