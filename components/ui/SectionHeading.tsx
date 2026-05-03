'use client'

import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'

type Props = {
  children: React.ReactNode
  subtitle?: string
}

export default function SectionHeading({ children, subtitle }: Props) {
  return (
    <Box sx={{ mb: { xs: 3, md: 4 } }}>
      <Typography
        variant="h2"
        sx={{
          borderLeft: '4px solid #F4A7B9',
          paddingLeft: '12px',
          fontSize: { xs: '1.25rem', md: '1.5rem' },
        }}
      >
        {children}
      </Typography>
      {subtitle && (
        <Typography variant="body2" sx={{ mt: 1, pl: '16px', color: '#666666' }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  )
}
