'use client'

import { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import FormGroup from '@mui/material/FormGroup'
import FormLabel from '@mui/material/FormLabel'
import FormControl from '@mui/material/FormControl'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import PageContainer from '@/components/ui/PageContainer'
import SectionHeading from '@/components/ui/SectionHeading'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ErrorAlert from '@/components/common/ErrorAlert'
import Header from '@/components/common/Header'
import Footer from '@/components/common/Footer'

const PREFERRED_STYLE_OPTIONS = ['午前のみ', '午後のみ', '短時間', '単発', '週1', '週2〜3', '長期']

type ProfileForm = {
  realName: string
  displayName: string
  license: boolean
  blankYears: string
  preferredArea: string
  preferredStyle: string[]
  bio: string
  experience: string
  skills: string
  ngConditions: string
  isPublished: boolean
}

export default function SeekerProfilePage() {
  const [form, setForm] = useState<ProfileForm>({
    realName: '',
    displayName: '',
    license: false,
    blankYears: '',
    preferredArea: '',
    preferredStyle: [],
    bio: '',
    experience: '',
    skills: '',
    ngConditions: '',
    isPublished: false,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetch('/api/seeker/profile')
      .then((r) => r.json())
      .then((data) => {
        if (data.profile) {
          setForm({
            realName: '',
            displayName: data.profile.displayName ?? '',
            license: data.profile.license ?? false,
            blankYears: data.profile.blankYears ?? '',
            preferredArea: data.profile.preferredArea ?? '',
            preferredStyle: data.profile.preferredStyle ?? [],
            bio: data.profile.bio ?? '',
            experience: data.profile.experience ?? '',
            skills: data.profile.skills ?? '',
            ngConditions: data.profile.ngConditions ?? '',
            isPublished: data.profile.isPublished ?? false,
          })
        }
      })
      .catch(() => setError('プロフィールの読み込みに失敗しました'))
      .finally(() => setLoading(false))
  }, [])

  function toggleStyle(style: string) {
    setForm((prev) => ({
      ...prev,
      preferredStyle: prev.preferredStyle.includes(style)
        ? prev.preferredStyle.filter((s) => s !== style)
        : [...prev.preferredStyle, style],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    const res = await fetch('/api/seeker/profile', {
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
      <Header role="SEEKER" />
      <PageContainer maxWidth="md">
        <SectionHeading subtitle="公開される情報と非公開の情報があります">
          プロフィール編集
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
              基本情報
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="本名（非公開）"
                value={form.realName}
                onChange={(e) => setForm({ ...form, realName: e.target.value })}
                fullWidth
                size="small"
                helperText="マッチング成立後、保育園に開示されます"
              />
              <TextField
                label="表示名（公開）"
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                fullWidth
                size="small"
                required
                helperText="保育園に表示される名前です"
              />
              <TextField
                label="希望エリア"
                value={form.preferredArea}
                onChange={(e) => setForm({ ...form, preferredArea: e.target.value })}
                fullWidth
                size="small"
                placeholder="例：長崎市"
              />
            </Box>
          </Box>

          <Divider />

          {/* 資格・経験 */}
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, color: '#666666' }}>
              資格・経験
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.license}
                    onChange={(e) => setForm({ ...form, license: e.target.checked })}
                    size="small"
                    sx={{ color: '#F4A7B9', '&.Mui-checked': { color: '#F4A7B9' } }}
                  />
                }
                label={<Typography variant="body2">保育士資格あり</Typography>}
              />
              <TextField
                label="ブランク期間"
                value={form.blankYears}
                onChange={(e) => setForm({ ...form, blankYears: e.target.value })}
                fullWidth
                size="small"
                placeholder="例：2年、なし"
              />
              <TextField
                label="経験・スキル（公開）"
                value={form.skills}
                onChange={(e) => setForm({ ...form, skills: e.target.value })}
                fullWidth
                size="small"
                multiline
                rows={2}
                placeholder="例：製作活動、リトミック、乳児保育"
              />
              <TextField
                label="職務経歴（公開）"
                value={form.experience}
                onChange={(e) => setForm({ ...form, experience: e.target.value })}
                fullWidth
                size="small"
                multiline
                rows={3}
                placeholder="例：認可保育所で0〜5歳児クラスを5年担当"
              />
            </Box>
          </Box>

          <Divider />

          {/* 希望勤務スタイル */}
          <Box>
            <FormControl component="fieldset" fullWidth>
              <FormLabel component="legend" sx={{ mb: 1, fontSize: '0.875rem', fontWeight: 700, color: '#666666' }}>
                希望勤務スタイル（複数選択可）
              </FormLabel>
              <FormGroup row>
                {PREFERRED_STYLE_OPTIONS.map((style) => (
                  <FormControlLabel
                    key={style}
                    control={
                      <Checkbox
                        checked={form.preferredStyle.includes(style)}
                        onChange={() => toggleStyle(style)}
                        size="small"
                        sx={{ color: '#F4A7B9', '&.Mui-checked': { color: '#F4A7B9' } }}
                      />
                    }
                    label={<Typography variant="body2">{style}</Typography>}
                  />
                ))}
              </FormGroup>
            </FormControl>
          </Box>

          <Divider />

          {/* 自己紹介 */}
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, color: '#666666' }}>
              自己紹介・その他
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="自己紹介（公開）"
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                fullWidth
                size="small"
                multiline
                rows={4}
                placeholder="あなたの強みや保育への思いを教えてください"
              />
              <TextField
                label="NGな条件（非公開）"
                value={form.ngConditions}
                onChange={(e) => setForm({ ...form, ngConditions: e.target.value })}
                fullWidth
                size="small"
                multiline
                rows={2}
                placeholder="例：遠距離移動が難しい、特定の業務が困難"
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
            label={<Typography variant="body2">プロフィールを公開する</Typography>}
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
