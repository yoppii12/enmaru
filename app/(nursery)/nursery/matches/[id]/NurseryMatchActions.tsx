'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import ChatPanel from '@/components/common/ChatPanel'

type Props = {
  matchId: string
  status: string
  hasNurseryReport: boolean
  chatOpen: boolean
  currentUserId: string
}

export default function NurseryMatchActions({ matchId, status, hasNurseryReport, chatOpen, currentUserId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleComplete() {
    setLoading(true)
    setError(null)
    const res = await fetch('/api/work-reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId, completed: true, comment: comment || undefined }),
    })
    setLoading(false)
    if (res.ok) {
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error ?? '操作に失敗しました')
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}

      {status === 'MATCHED' && (
        <Box sx={{ p: 2, bgcolor: '#F0F7FF', borderRadius: 2, border: '1px solid #BBDEFB' }}>
          <Typography variant="body2" color="text.secondary">
            保育士が業務を開始するとステータスが「勤務中」に変わります。
          </Typography>
        </Box>
      )}

      {/* 業務完了報告 */}
      {status === 'WORKING' && !hasNurseryReport && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <TextField
            label="コメント（任意）"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            multiline
            rows={2}
            size="small"
            fullWidth
            placeholder="業務の感想や気づきなど"
          />
          <Button
            variant="contained"
            fullWidth
            disabled={loading}
            onClick={handleComplete}
            sx={{ py: 1.5 }}
          >
            {loading ? '処理中...' : '業務完了を報告する'}
          </Button>
        </Box>
      )}

      {status === 'WORKING' && hasNurseryReport && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 1 }}>
          業務完了を報告しました。保育士の報告を待っています。
        </Typography>
      )}

      {/* チャット */}
      <ChatPanel matchId={matchId} currentUserId={currentUserId} chatOpen={chatOpen} />
    </Box>
  )
}
