'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import PageContainer from '@/components/ui/PageContainer'
import SectionHeading from '@/components/ui/SectionHeading'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ErrorAlert from '@/components/common/ErrorAlert'
import Header from '@/components/common/Header'
import Footer from '@/components/common/Footer'
import JobForm, { type JobFormState } from '@/components/nursery/JobForm'

export default function EditJobPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [form, setForm] = useState<JobFormState>({
    title: '',
    workContent: '',
    workDate: '',
    workTimeStart: '',
    workTimeEnd: '',
    hourlyWage: '',
    targetPerson: '',
    remarks: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [closing, setClosing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<'OPEN' | 'CLOSED'>('OPEN')

  useEffect(() => {
    fetch(`/api/nursery/jobs/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.job) {
          const job = data.job
          setStatus(job.status)
          setForm({
            title: job.title ?? '',
            workContent: job.workContent ?? '',
            workDate: job.workDate ? new Date(job.workDate).toISOString().split('T')[0] : '',
            workTimeStart: job.workTimeStart ?? '',
            workTimeEnd: job.workTimeEnd ?? '',
            hourlyWage: job.hourlyWage ? String(job.hourlyWage) : '',
            targetPerson: job.targetPerson ?? '',
            remarks: job.remarks ?? '',
          })
        }
      })
      .catch(() => setError('募集情報の読み込みに失敗しました'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const res = await fetch(`/api/nursery/jobs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        hourlyWage: form.hourlyWage ? Number(form.hourlyWage) : null,
      }),
    })

    const data = await res.json()
    setSaving(false)

    if (!res.ok) {
      setError(data.error ?? '保存に失敗しました')
      return
    }

    router.push('/nursery/jobs')
  }

  async function handleToggleStatus() {
    setClosing(true)
    const newStatus = status === 'OPEN' ? 'CLOSED' : 'OPEN'
    const res = await fetch(`/api/nursery/jobs/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    setClosing(false)
    if (res.ok) {
      setStatus(newStatus)
    }
  }

  if (loading) return <LoadingSpinner fullPage />

  return (
    <>
      <Header role="NURSERY" />
      <PageContainer maxWidth="md">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <SectionHeading>募集編集</SectionHeading>
          <Button
            variant="outlined"
            size="small"
            onClick={handleToggleStatus}
            disabled={closing}
            sx={{
              borderColor: status === 'OPEN' ? '#AAAAAA' : '#F4A7B9',
              color: status === 'OPEN' ? '#666666' : '#F4A7B9',
              fontSize: '0.75rem',
            }}
          >
            {status === 'OPEN' ? '募集を終了する' : '募集を再開する'}
          </Button>
        </Box>
        <ErrorAlert message={error} />
        <JobForm form={form} setForm={setForm} onSubmit={handleSubmit} saving={saving} submitLabel="保存する" />
      </PageContainer>
      <Footer />
    </>
  )
}
