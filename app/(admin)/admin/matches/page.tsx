'use client'

import { useState, useEffect, useCallback } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import EditIcon from '@mui/icons-material/Edit'
import CheckIcon from '@mui/icons-material/Check'
import PageContainer from '@/components/ui/PageContainer'
import SectionHeading from '@/components/ui/SectionHeading'
import StatusChip from '@/components/ui/StatusChip'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ErrorAlert from '@/components/common/ErrorAlert'
import Header from '@/components/common/Header'
import Footer from '@/components/common/Footer'

const STATUS_OPTIONS = [
  'APPLIED', 'SCREENING', 'MATCHED', 'WORKING', 'COMPLETED', 'REVIEW_OPEN', 'REVIEW_DONE',
]

type Match = {
  id: string
  status: string
  adminMemo: string | null
  createdAt: string
  job: { title: string; workDate: string; workTimeStart: string; workTimeEnd: string }
  nursery: { nurseryName: string; area: string }
  seeker: { displayName: string | null; realName: string | null }
  application: { applyMessage: string | null; lineContactOk: boolean }
}

export default function AdminMatchesPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingMemo, setEditingMemo] = useState<Record<string, string>>({})
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)

  const fetchMatches = useCallback(async () => {
    const res = await fetch('/api/admin/matches')
    const data = await res.json()
    if (res.ok) {
      setMatches(data.matches)
    } else {
      setError(data.error ?? '読み込みに失敗しました')
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchMatches() }, [fetchMatches])

  async function updateStatus(id: string, status: string) {
    setSaving(id)
    const res = await fetch(`/api/admin/matches/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setSaving(null)
    if (res.ok) {
      setMatches((prev) => prev.map((m) => m.id === id ? { ...m, status } : m))
    }
  }

  async function saveMemo(id: string) {
    setSaving(id)
    const memo = editingMemo[id] ?? ''
    const res = await fetch(`/api/admin/matches/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminMemo: memo }),
    })
    setSaving(null)
    if (res.ok) {
      setMatches((prev) => prev.map((m) => m.id === id ? { ...m, adminMemo: memo } : m))
      setEditingMemoId(null)
    }
  }

  if (loading) return <LoadingSpinner fullPage />

  return (
    <>
      <Header role="ADMIN" />
      <PageContainer maxWidth="lg">
        <SectionHeading subtitle={`${matches.length}件`}>マッチング管理</SectionHeading>
        <ErrorAlert message={error} />

        {matches.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
            マッチングデータがありません
          </Typography>
        ) : (
          <>
            {/* スマホ用カードリスト */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
              {matches.map((match) => (
                <MobileMatchCard
                  key={match.id}
                  match={match}
                  onStatusChange={updateStatus}
                  saving={saving === match.id}
                  editingMemo={editingMemo[match.id]}
                  isEditingMemo={editingMemoId === match.id}
                  onStartEditMemo={() => {
                    setEditingMemoId(match.id)
                    setEditingMemo((prev) => ({ ...prev, [match.id]: match.adminMemo ?? '' }))
                  }}
                  onMemoChange={(v) => setEditingMemo((prev) => ({ ...prev, [match.id]: v }))}
                  onSaveMemo={() => saveMemo(match.id)}
                />
              ))}
            </Box>

            {/* PC用テーブル */}
            <TableContainer component={Paper} elevation={0} sx={{ display: { xs: 'none', md: 'block' }, border: '1px solid #E0E0E0', borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#F9F9F9' }}>
                    <TableCell>保育士</TableCell>
                    <TableCell>保育園</TableCell>
                    <TableCell>募集</TableCell>
                    <TableCell>ステータス</TableCell>
                    <TableCell>管理者メモ</TableCell>
                    <TableCell>応募日</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {matches.map((match) => (
                    <TableRow key={match.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{match.seeker.displayName ?? '-'}</Typography>
                        {match.seeker.realName && (
                          <Typography variant="caption" color="text.secondary">（{match.seeker.realName}）</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{match.nursery.nurseryName}</Typography>
                        <Typography variant="caption" color="text.secondary">{match.nursery.area}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{match.job.title}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(match.job.workDate).toLocaleDateString('ja-JP')}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ minWidth: 160 }}>
                        <Select
                          value={match.status}
                          size="small"
                          onChange={(e) => updateStatus(match.id, e.target.value)}
                          disabled={saving === match.id}
                          sx={{ fontSize: '0.8rem' }}
                          renderValue={(val) => <StatusChip status={val} />}
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <MenuItem key={s} value={s}>
                              <StatusChip status={s} />
                            </MenuItem>
                          ))}
                        </Select>
                      </TableCell>
                      <TableCell sx={{ minWidth: 180 }}>
                        {editingMemoId === match.id ? (
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <TextField
                              value={editingMemo[match.id] ?? ''}
                              onChange={(e) => setEditingMemo((prev) => ({ ...prev, [match.id]: e.target.value }))}
                              size="small"
                              multiline
                              maxRows={3}
                              sx={{ flex: 1, fontSize: '0.8rem' }}
                            />
                            <IconButton size="small" onClick={() => saveMemo(match.id)} disabled={saving === match.id}>
                              <CheckIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
                              {match.adminMemo || '—'}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setEditingMemoId(match.id)
                                setEditingMemo((prev) => ({ ...prev, [match.id]: match.adminMemo ?? '' }))
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(match.createdAt).toLocaleDateString('ja-JP')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </PageContainer>
      <Footer />
    </>
  )
}

type MobileMatchCardProps = {
  match: Match
  onStatusChange: (id: string, status: string) => void
  saving: boolean
  editingMemo?: string
  isEditingMemo: boolean
  onStartEditMemo: () => void
  onMemoChange: (v: string) => void
  onSaveMemo: () => void
}

function MobileMatchCard({
  match, onStatusChange, saving, editingMemo, isEditingMemo, onStartEditMemo, onMemoChange, onSaveMemo,
}: MobileMatchCardProps) {
  return (
    <Box sx={{ p: 1.5, bgcolor: '#FAFAFA', borderRadius: 2, border: '1px solid #E0E0E0' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Box>
          <Typography variant="subtitle2">{match.seeker.displayName ?? '—'}</Typography>
          {match.seeker.realName && (
            <Typography variant="caption" color="text.secondary">（{match.seeker.realName}）</Typography>
          )}
        </Box>
        <StatusChip status={match.status} />
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        {match.nursery.nurseryName} / {match.job.title}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
        {new Date(match.job.workDate).toLocaleDateString('ja-JP')}
      </Typography>

      <Select
        value={match.status}
        size="small"
        onChange={(e) => onStatusChange(match.id, e.target.value)}
        disabled={saving}
        fullWidth
        sx={{ fontSize: '0.8rem', mb: 1 }}
      >
        {STATUS_OPTIONS.map((s) => (
          <MenuItem key={s} value={s}><StatusChip status={s} /></MenuItem>
        ))}
      </Select>

      {isEditingMemo ? (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <TextField
            value={editingMemo ?? ''}
            onChange={(e) => onMemoChange(e.target.value)}
            size="small"
            fullWidth
            multiline
            maxRows={3}
            placeholder="管理者メモ"
          />
          <Button size="small" variant="contained" onClick={onSaveMemo} disabled={saving} sx={{ whiteSpace: 'nowrap' }}>保存</Button>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
            {match.adminMemo ? `メモ: ${match.adminMemo}` : 'メモなし'}
          </Typography>
          <IconButton size="small" onClick={onStartEditMemo}><EditIcon fontSize="small" /></IconButton>
        </Box>
      )}
    </Box>
  )
}
