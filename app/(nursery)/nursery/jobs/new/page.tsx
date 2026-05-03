'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PageContainer from '@/components/ui/PageContainer'
import SectionHeading from '@/components/ui/SectionHeading'
import ErrorAlert from '@/components/common/ErrorAlert'
import Header from '@/components/common/Header'
import Footer from '@/components/common/Footer'
import JobForm, { type JobFormState } from '@/components/nursery/JobForm'

const INITIAL_FORM: JobFormState = {
  title: '',
  workContent: '',
  workDate: '',
  workTimeStart: '',
  workTimeEnd: '',
  hourlyWage: '',
  targetPerson: '',
  remarks: '',
}

export default function NewJobPage() {
  const router = useRouter()
  const [form, setForm] = useState<JobFormState>(INITIAL_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const res = await fetch('/api/nursery/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        hourlyWage: form.hourlyWage ? Number(form.hourlyWage) : null,
      }),
    })

    const data = await res.json()
    setSaving(false)

    if (!res.ok) {
      setError(data.error ?? '作成に失敗しました')
      return
    }

    router.push('/nursery/jobs')
  }

  return (
    <>
      <Header role="NURSERY" />
      <PageContainer maxWidth="md">
        <SectionHeading>新規募集作成</SectionHeading>
        <ErrorAlert message={error} />
        <JobForm form={form} setForm={setForm} onSubmit={handleSubmit} saving={saving} submitLabel="作成する" />
      </PageContainer>
      <Footer />
    </>
  )
}
