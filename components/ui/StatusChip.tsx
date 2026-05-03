'use client'

import Chip from '@mui/material/Chip'
import { MATCH_STATUS_CONFIG } from '@/types'

type Props = {
  status: string
}

export default function StatusChip({ status }: Props) {
  const config = MATCH_STATUS_CONFIG[status] ?? { label: status, bg: '#F9F9F9', color: '#666666' }

  return (
    <Chip
      label={config.label}
      size="small"
      sx={{
        backgroundColor: config.bg,
        color: config.color,
        fontWeight: 500,
        borderRadius: '4px',
        border: 'none',
      }}
    />
  )
}
