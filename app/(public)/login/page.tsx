'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Divider from '@mui/material/Divider'
import MuiLink from '@mui/material/Link'
import NextLink from 'next/link'
import PageContainer from '@/components/ui/PageContainer'
import ErrorAlert from '@/components/common/ErrorAlert'
import LoadingSpinner from '@/components/common/LoadingSpinner'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'ログインに失敗しました')
      return
    }

    const next = searchParams.get('next')
    const redirectTo = next && next.startsWith('/') ? next : data.redirectPath
    router.push(redirectTo)
    router.refresh()
  }

  return (
    <PageContainer maxWidth="sm" py={4}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h1" sx={{ fontSize: { xs: '1.5rem', md: '1.75rem' }, mb: 1 }}>
          ログイン
        </Typography>
        <Typography variant="body2" color="text.secondary">
          えんまーるにログイン
        </Typography>
      </Box>

      <ErrorAlert message={error} />

      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label="メールアドレス"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          fullWidth
          size="small"
          autoComplete="email"
        />
        <TextField
          label="パスワード"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          fullWidth
          size="small"
          autoComplete="current-password"
        />

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={loading}
          sx={{ py: 1.25 }}
        >
          {loading ? 'ログイン中...' : 'ログイン'}
        </Button>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
        まだ登録していない方は{' '}
        <MuiLink component={NextLink} href="/register" color="primary" underline="hover">
          新規登録
        </MuiLink>
      </Typography>
    </PageContainer>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingSpinner fullPage />}>
      <LoginForm />
    </Suspense>
  )
}
