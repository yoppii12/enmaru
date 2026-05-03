'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import Divider from '@mui/material/Divider'
import PageContainer from '@/components/ui/PageContainer'
import SectionHeading from '@/components/ui/SectionHeading'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ErrorAlert from '@/components/common/ErrorAlert'
import Header from '@/components/common/Header'
import Footer from '@/components/common/Footer'

type JobInfo = {
  id: string
  title: string
  workDate: string
  workTimeStart: string
  workTimeEnd: string
  nursery: { nurseryName: string; area: string }
}

function ApplicationForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const jobId = searchParams.get('jobId')

  const [job, setJob] = useState<JobInfo | null>(null)
  const [applyMessage, setApplyMessage] = useState('')
  const [lineContactOk, setLineContactOk] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!jobId) { setLoading(false); return }
    fetch(`/api/jobs/${jobId}`)
      .then((r) => r.json())
      .then((data) => { if (data.job) setJob(data.job) })
      .catch(() => setError('募集情報の読み込みに失敗しました'))
      .finally(() => setLoading(false))
  }, [jobId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!jobId) return

    setSubmitting(true)
    setError(null)

    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId, applyMessage, lineContactOk }),
    })

    const data = await res.json()
    setSubmitting(false)

    if (!res.ok) {
      setError(data.error ?? '応募に失敗しました')
      return
    }

    router.push('/applications')
  }

  if (loading) return <LoadingSpinner />

  return (
    <>
      <SectionHeading>応募する</SectionHeading>
      <ErrorAlert message={error} />

      {!jobId && (
        <Typography color="text.secondary">募集IDが指定されていません</Typography>
      )}

      {job && (
        <Box sx={{ p: { xs: 1.5, md: 2 }, bgcolor: '#F9F9F9', borderRadius: 2, mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{job.nursery.nurseryName}</Typography>
          <Typography variant="body2" sx={{ mt: 0.25 }}>{job.title}</Typography>
          <Typography variant="caption" color="text.secondary">
            {new Date(job.workDate).toLocaleDateString('ja-JP')} / {job.workTimeStart}〜{job.workTimeEnd}
          </Typography>
        </Box>
      )}

      {jobId && (
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField
            label="応募メッセージ（任意）"
            value={applyMessage}
            onChange={(e) => setApplyMessage(e.target.value)}
            fullWidth
            size="small"
            multiline
            rows={4}
            placeholder="自己紹介や意気込みを書いてください（任意）"
          />

          <Divider />

          <FormControlLabel
            control={
              <Checkbox
                checked={lineContactOk}
                onChange={(e) => setLineContactOk(e.target.checked)}
                size="small"
                sx={{ color: '#F4A7B9', '&.Mui-checked': { color: '#F4A7B9' } }}
              />
            }
            label={
              <Box>
                <Typography variant="body2">LINEでの連絡を許可する</Typography>
                <Typography variant="caption" color="text.secondary">
                  マッチング成立後、LINE経由で連絡を受け取ることができます
                </Typography>
              </Box>
            }
          />

          <Box sx={{ display: 'flex', gap: 1.5, flexDirection: { xs: 'column', sm: 'row' } }}>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              fullWidth
              sx={{ py: 1.25 }}
            >
              {submitting ? '送信中...' : '応募する'}
            </Button>
            <Button
              variant="outlined"
              onClick={() => router.back()}
              fullWidth
              sx={{ py: 1.25, borderColor: '#AAAAAA', color: '#666666' }}
            >
              キャンセル
            </Button>
          </Box>
        </Box>
      )}
    </>
  )
}

export default function NewApplicationPage() {
  return (
    <>
      <Header role="SEEKER" />
      <PageContainer maxWidth="sm">
        <Suspense fallback={<LoadingSpinner />}>
          <ApplicationForm />
        </Suspense>
      </PageContainer>
      <Footer />
    </>
  )
}
