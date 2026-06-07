'use client'

import { useState, useEffect, useCallback } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import PageContainer from '@/components/ui/PageContainer'
import SectionHeading from '@/components/ui/SectionHeading'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ErrorAlert from '@/components/common/ErrorAlert'
import Header from '@/components/common/Header'
import Footer from '@/components/common/Footer'
import { useCurrentUser } from '@/hooks/useCurrentUser'

const DOCUMENT_LABELS: Record<string, string> = {
  LICENSE: '保育士証',
  HEALTH_CHECK: '健康診断書',
  STOOL_TEST: '検便結果',
  RESUME: '履歴書',
}

type DocumentItem = {
  id: string
  documentType: string
  status: string
  fileUrl: string
  signedUrl: string | null
  rejectionReason: string | null
  uploadedAt: string
  verifiedAt: string | null
  seeker: { id: string; displayName: string | null; realName: string | null }
}

function DocStatusChip({ status }: { status: string }) {
  if (status === 'APPROVED') return <Chip label="認証済み" size="small" sx={{ bgcolor: '#E8F5E9', color: '#2E7D32' }} />
  if (status === 'PENDING') return <Chip label="確認待ち" size="small" sx={{ bgcolor: '#FFF8E1', color: '#F57F17' }} />
  return <Chip label="差し戻し" size="small" sx={{ bgcolor: '#FFEBEE', color: '#C62828' }} />
}

export default function AdminDocumentsPage() {
  const currentUser = useCurrentUser()
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('PENDING')
  const [processing, setProcessing] = useState<string | null>(null)
  const [rejectTarget, setRejectTarget] = useState<DocumentItem | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const fetchDocuments = useCallback(async (status: string) => {
    setLoading(true)
    const res = await fetch(`/api/admin/documents?status=${status}`)
    const data = await res.json()
    setLoading(false)
    if (res.ok) {
      setDocuments(data.documents)
    } else {
      setError(data.error ?? '読み込みに失敗しました')
    }
  }, [])

  useEffect(() => { fetchDocuments(filterStatus) }, [fetchDocuments, filterStatus])

  async function handleVerify(id: string) {
    setProcessing(id)
    const res = await fetch(`/api/admin/documents/${id}/verify`, { method: 'PATCH' })
    setProcessing(null)
    if (res.ok) {
      setDocuments((prev) => prev.filter((d) => d.id !== id))
    } else {
      const data = await res.json()
      setError(data.error ?? '操作に失敗しました')
    }
  }

  async function handleReject() {
    if (!rejectTarget || !rejectReason.trim()) return
    setProcessing(rejectTarget.id)
    const res = await fetch(`/api/admin/documents/${rejectTarget.id}/reject`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: rejectReason.trim() }),
    })
    setProcessing(null)
    if (res.ok) {
      setDocuments((prev) => prev.filter((d) => d.id !== rejectTarget.id))
      setRejectTarget(null)
      setRejectReason('')
    } else {
      const data = await res.json()
      setError(data.error ?? '操作に失敗しました')
    }
  }

  if (loading) return <LoadingSpinner fullPage />

  return (
    <>
      <Header role="ADMIN" email={currentUser?.email ?? undefined} />
      <PageContainer maxWidth="lg">
        <SectionHeading subtitle={`${documents.length}件`}>書類確認</SectionHeading>
        <ErrorAlert message={error} />

        <ToggleButtonGroup
          value={filterStatus}
          exclusive
          onChange={(_, v) => { if (v) setFilterStatus(v) }}
          size="small"
          sx={{ mb: 2 }}
        >
          <ToggleButton value="PENDING">確認待ち</ToggleButton>
          <ToggleButton value="APPROVED">認証済み</ToggleButton>
          <ToggleButton value="REJECTED">差し戻し</ToggleButton>
        </ToggleButtonGroup>

        {documents.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
            該当する書類はありません
          </Typography>
        ) : (
          <>
            {/* スマホ用カード */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
              {documents.map((doc) => (
                <MobileDocCard
                  key={doc.id}
                  doc={doc}
                  onVerify={handleVerify}
                  onReject={(d) => { setRejectTarget(d); setRejectReason('') }}
                  processing={processing === doc.id}
                />
              ))}
            </Box>

            {/* PC用テーブル */}
            <TableContainer component={Paper} elevation={0} sx={{ display: { xs: 'none', md: 'block' }, border: '1px solid #E0E0E0', borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#F9F9F9' }}>
                    <TableCell>保育士</TableCell>
                    <TableCell>書類種別</TableCell>
                    <TableCell>ステータス</TableCell>
                    <TableCell>ファイル</TableCell>
                    <TableCell>提出日</TableCell>
                    <TableCell>操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{doc.seeker.displayName ?? '—'}</Typography>
                        {doc.seeker.realName && (
                          <Typography variant="caption" color="text.secondary">（{doc.seeker.realName}）</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{DOCUMENT_LABELS[doc.documentType] ?? doc.documentType}</Typography>
                      </TableCell>
                      <TableCell>
                        <DocStatusChip status={doc.status} />
                        {doc.rejectionReason && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                            {doc.rejectionReason}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {doc.signedUrl && (
                          <FilePreview signedUrl={doc.signedUrl} fileUrl={doc.fileUrl} />
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(doc.uploadedAt).toLocaleDateString('ja-JP')}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ minWidth: 180 }}>
                        {doc.status === 'PENDING' && (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<CheckCircleIcon />}
                              disabled={processing === doc.id}
                              onClick={() => handleVerify(doc.id)}
                              sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' }, fontSize: '0.75rem' }}
                            >
                              認証
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<CancelIcon />}
                              disabled={processing === doc.id}
                              onClick={() => { setRejectTarget(doc); setRejectReason('') }}
                              sx={{ borderColor: '#C62828', color: '#C62828', fontSize: '0.75rem' }}
                            >
                              差し戻し
                            </Button>
                          </Box>
                        )}
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

      {/* 差し戻しダイアログ */}
      <Dialog open={!!rejectTarget} onClose={() => setRejectTarget(null)} fullWidth maxWidth="sm">
        <DialogTitle>差し戻し理由を入力</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {rejectTarget && `${DOCUMENT_LABELS[rejectTarget.documentType]} / ${rejectTarget.seeker.displayName ?? '保育士'}`}
          </Typography>
          <TextField
            label="差し戻し理由"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            fullWidth
            multiline
            rows={3}
            placeholder="例：画像が不鮮明です。再度撮影してアップロードしてください。"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectTarget(null)}>キャンセル</Button>
          <Button
            variant="contained"
            disabled={!rejectReason.trim() || !!processing}
            onClick={handleReject}
            sx={{ bgcolor: '#C62828', '&:hover': { bgcolor: '#B71C1C' } }}
          >
            差し戻す
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

function FilePreview({ signedUrl, fileUrl }: { signedUrl: string; fileUrl: string }) {
  const isPdf = fileUrl.toLowerCase().endsWith('.pdf')
  if (isPdf) {
    return (
      <Button
        size="small"
        endIcon={<OpenInNewIcon />}
        href={signedUrl}
        target="_blank"
        rel="noopener noreferrer"
        component="a"
        sx={{ fontSize: '0.7rem', color: '#1565C0' }}
      >
        PDFを開く
      </Button>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <a href={signedUrl} target="_blank" rel="noopener noreferrer">
      <img src={signedUrl} alt="書類" style={{ maxWidth: 80, maxHeight: 60, objectFit: 'cover', borderRadius: 4, border: '1px solid #E0E0E0' }} />
    </a>
  )
}

function MobileDocCard({
  doc,
  onVerify,
  onReject,
  processing,
}: {
  doc: DocumentItem
  onVerify: (id: string) => void
  onReject: (doc: DocumentItem) => void
  processing: boolean
}) {
  return (
    <Box sx={{ p: 1.5, bgcolor: '#FAFAFA', borderRadius: 2, border: '1px solid #E0E0E0' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="subtitle2">{doc.seeker.displayName ?? '—'}</Typography>
        <DocStatusChip status={doc.status} />
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        {DOCUMENT_LABELS[doc.documentType]} / {new Date(doc.uploadedAt).toLocaleDateString('ja-JP')}
      </Typography>
      {doc.rejectionReason && (
        <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
          {doc.rejectionReason}
        </Typography>
      )}
      {doc.signedUrl && (
        <Box sx={{ my: 1 }}>
          <FilePreview signedUrl={doc.signedUrl} fileUrl={doc.fileUrl} />
        </Box>
      )}
      {doc.status === 'PENDING' && (
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <Button
            size="small"
            variant="contained"
            disabled={processing}
            onClick={() => onVerify(doc.id)}
            sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' }, fontSize: '0.75rem', flex: 1 }}
          >
            認証する
          </Button>
          <Button
            size="small"
            variant="outlined"
            disabled={processing}
            onClick={() => onReject(doc)}
            sx={{ borderColor: '#C62828', color: '#C62828', fontSize: '0.75rem', flex: 1 }}
          >
            差し戻す
          </Button>
        </Box>
      )}
    </Box>
  )
}
