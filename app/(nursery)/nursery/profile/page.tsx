'use client'

import { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import PageContainer from '@/components/ui/PageContainer'
import SectionHeading from '@/components/ui/SectionHeading'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ErrorAlert from '@/components/common/ErrorAlert'
import Header from '@/components/common/Header'
import Footer from '@/components/common/Footer'

type ProfileForm = {
  nurseryName: string
  area: string
  address: string
  contactName: string
  phone: string
  concept: string
  policy: string
  isPublished: boolean
}

export default function NurseryProfilePage() {
  const [form, setForm] = useState<ProfileForm>({
    nurseryName: '',
    area: '',
    address: '',
    contactName: '',
    phone: '',
    concept: '',
    policy: '',
    isPublished: false,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetch('/api/nursery/profile')
      .then((r) => r.json())
      .then((data) => {
        if (data.profile) {
          setForm({
            nurseryName: data.profile.nurseryName ?? '',
            area: data.profile.area ?? '',
            address: data.profile.address ?? '',
            contactName: data.profile.contactName ?? '',
            phone: data.profile.phone ?? '',
            concept: data.profile.concept ?? '',
            policy: data.profile.policy ?? '',
            isPublished: data.profile.isPublished ?? false,
          })
        }
      })
      .catch(() => setError('プロフィールの読み込みに失敗しました'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    const res = await fetch('/api/nursery/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()
    setSaving(false)

    if (!res.ok) {
      setError(data.error ?? '保存に失敗しました')
      return
    }

    setSuccess(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) return <LoadingSpinner fullPage />

  return (
    <>
      <Header role="NURSERY" />
      <PageContainer maxWidth="md">
        <SectionHeading subtitle="公開情報と非公開情報があります">
          園プロフィール編集
        </SectionHeading>

        <ErrorAlert message={error} />
        {success && (
          <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
            プロフィールを保存しました
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* 基本情報 */}
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, color: '#666666' }}>
              基本情報（公開）
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="園名"
                value={form.nurseryName}
                onChange={(e) => setForm({ ...form, nurseryName: e.target.value })}
                fullWidth
                size="small"
                required
              />
              <TextField
                label="エリア"
                value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
                fullWidth
                size="small"
                required
                placeholder="例：長崎市"
              />
            </Box>
          </Box>

          <Divider />

          {/* 非公開情報 */}
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, color: '#666666' }}>
              連絡先情報（マッチング成立後に開示）
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="住所"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                fullWidth
                size="small"
              />
              <TextField
                label="担当者名"
                value={form.contactName}
                onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                fullWidth
                size="small"
              />
              <TextField
                label="電話番号"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                fullWidth
                size="small"
                type="tel"
              />
            </Box>
          </Box>

          <Divider />

          {/* コンセプト・方針 */}
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, color: '#666666' }}>
              コンセプト・保育方針（公開）
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="コンセプト"
                value={form.concept}
                onChange={(e) => setForm({ ...form, concept: e.target.value })}
                fullWidth
                size="small"
                multiline
                rows={3}
                placeholder="園のコンセプトや特色を教えてください"
              />
              <TextField
                label="保育方針"
                value={form.policy}
                onChange={(e) => setForm({ ...form, policy: e.target.value })}
                fullWidth
                size="small"
                multiline
                rows={3}
                placeholder="保育への姿勢や大切にしていることを教えてください"
              />
            </Box>
          </Box>

          <Divider />

          <FormControlLabel
            control={
              <Checkbox
                checked={form.isPublished}
                onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                size="small"
                sx={{ color: '#F4A7B9', '&.Mui-checked': { color: '#F4A7B9' } }}
              />
            }
            label={<Typography variant="body2">プロフィールを公開する（保育士が閲覧できるようになります）</Typography>}
          />

          <Button
            type="submit"
            variant="contained"
            disabled={saving}
            sx={{ py: 1.25, alignSelf: { xs: 'stretch', md: 'flex-start' }, minWidth: { md: 200 } }}
          >
            {saving ? '保存中...' : '保存する'}
          </Button>
        </Box>
      </PageContainer>
      <Footer />
    </>
  )
}
