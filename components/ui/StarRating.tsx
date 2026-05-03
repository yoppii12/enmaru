'use client'

import Rating from '@mui/material/Rating'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

type Props = {
  value: number
  onChange?: (value: number | null) => void
  readOnly?: boolean
  label?: string
  size?: 'small' | 'medium' | 'large'
}

export default function StarRating({ value, onChange, readOnly = false, label, size = 'medium' }: Props) {
  return (
    <Box>
      {label && (
        <Typography variant="body2" sx={{ mb: 0.5 }}>
          {label}
        </Typography>
      )}
      <Rating
        value={value}
        onChange={readOnly ? undefined : (_, v) => onChange?.(v)}
        readOnly={readOnly}
        size={size}
        sx={{
          '& .MuiRating-iconFilled': { color: '#F4A7B9' },
          '& .MuiRating-iconEmpty': { color: '#AAAAAA' },
        }}
      />
    </Box>
  )
}
