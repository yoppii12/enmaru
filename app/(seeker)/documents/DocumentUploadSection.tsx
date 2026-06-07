'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import UploadFileIcon from '@mui/icons-material/UploadFile'

type DocumentRecord = {
  id: string
  documentType: string
  status: string
  rejectionReason: string | null
  uploadedAt: Date
  verifiedAt: Date | null
}

type Props = {
  latestByType: Record<string, DocumentRecord | null>
  requiredTypes: string[]
  optionalTypes: string[]
  documentLabels: Record<string, string>
}

function StatusDisplay({ doc }: { doc: DocumentRecord | null }) {
  if (!doc) return <Chip label="未提出" size="small" sx={{ bgcolor: '#F5F5F5', color: '#9E9E9E' }} />
  if (doc.status === 'APPROVED') return <Chip icon={<CheckCircleIcon />} label="認証済み" size="small" sx={{ bgcolor: '#E8F5E9', color: '#2E7D32' }} />
  if (doc.status === 'PENDING') return <Chip icon={<HourglassEmptyIcon />} label="確認待ち" size="small" sx={{ bgcolor: '#FFF8E1', color: '#F57F17' }} />
  return <Chip icon={<ErrorOutlineIcon />} label="差し戻し" size="small" sx={{ bgcolor: '#FFEBEE', color: '#C62828' }} />
}

function DocumentCard({
  type,
  label,
  required,
  doc,
  onUpload,
  uploading,
}: {
  type: string
  label: string
  required: boolean
  doc: DocumentRecord | null
  onUpload: (type: string, file: File) => void
  uploading: string | null
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isUploading = uploading === type

  return (
    <Box
      sx={{
        p: { xs: 2, md: 2.5 },
        bgcolor: '#FAFAFA',
        borderRadius: 2,
        border: '1px solid',
        borderColor: doc?.status === 'REJECTED' ? '#FFCDD2' : '#E0E0E0',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{label}</Typography>
          {required && (
            <Chip label="必須" size="small" sx={{ fontSize: '0.65rem', height: 18, bgcolor: '#FCE4EC', color: '#C62828' }} />
          )}
        </Box>
        <StatusDisplay doc={doc} />
      </Box>

      {doc?.status === 'REJECTED' && doc.rejectionReason && (
        <Alert severity="error" sx={{ mb: 1.5, py: 0.5, fontSize: '0.8rem' }}>
          {doc.rejectionReason}
        </Alert>
      )}

      {doc && doc.status !== 'REJECTED' && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          提出日: {new Date(doc.uploadedAt).toLocaleDateString('ja-JP')}
          {doc.status === 'APPROVED' && doc.verifiedAt && (
            <> / 認証日: {new Date(doc.verifiedAt).toLocaleDateString('ja-JP')}</>
          )}
        </Typography>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/heic,application/pdf"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onUpload(type, file)
          e.target.value = ''
        }}
      />
      <Button
        size="small"
        variant={doc ? 'outlined' : 'contained'}
        startIcon={<UploadFileIcon />}
        disabled={isUploading || doc?.status === 'APPROVED'}
        onClick={() => fileInputRef.current?.click()}
        sx={{
          fontSize: '0.75rem',
          ...(doc ? { borderColor: '#F4A7B9', color: '#F4A7B9' } : { bgcolor: '#F4A7B9', '&:hover': { bgcolor: '#e8869c' } }),
        }}
      >
        {isUploading ? 'アップロード中...' : doc ? '再提出する' : 'アップロード'}
      </Button>
      {doc?.status === 'APPROVED' && (
        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
          認証済みのため変更できません
        </Typography>
      )}
    </Box>
  )
}

export default function DocumentUploadSection({
  latestByType,
  requiredTypes,
  optionalTypes,
  documentLabels,
}: Props) {
  const router = useRouter()
  const [uploading, setUploading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleUpload(type: string, file: File) {
    setUploading(type)
    setError(null)
    setSuccess(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('documentType', type)

    const res = await fetch('/api/documents', { method: 'POST', body: formData })
    setUploading(null)

    if (res.ok) {
      setSuccess(`${documentLabels[type]}をアップロードしました。確認後に認証されます。`)
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error ?? 'アップロードに失敗しました')
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess(null)}>{success}</Alert>}

      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#C62828' }}>
        必須書類
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {requiredTypes.map((type) => (
          <DocumentCard
            key={type}
            type={type}
            label={documentLabels[type]}
            required
            doc={latestByType[type] ?? null}
            onUpload={handleUpload}
            uploading={uploading}
          />
        ))}
      </Box>

      <Divider />

      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#666' }}>
        任意書類
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {optionalTypes.map((type) => (
          <DocumentCard
            key={type}
            type={type}
            label={documentLabels[type]}
            required={false}
            doc={latestByType[type] ?? null}
            onUpload={handleUpload}
            uploading={uploading}
          />
        ))}
      </Box>

      <Box sx={{ p: 2, bgcolor: '#F9F9F9', borderRadius: 2, border: '1px solid #E0E0E0' }}>
        <Typography variant="caption" color="text.secondary">
          対応フォーマット: JPG・PNG・HEIC・PDF（各10MBまで）
        </Typography>
      </Box>
    </Box>
  )
}
