'use client'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardActionArea from '@mui/material/CardActionArea'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import Rating from '@mui/material/Rating'
import Link from 'next/link'
import type { PublicNurseryInfo } from '@/types'

type Props = {
  nursery: PublicNurseryInfo
  href: string
}

export default function NurseryCard({ nursery, href }: Props) {
  const avg = nursery.averageRating

  return (
    <Card
      sx={{
        height: '100%',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: '#F4A7B9',
          boxShadow: '0 2px 8px rgba(244, 167, 185, 0.2)',
        },
      }}
    >
      <CardActionArea component={Link} href={href} sx={{ height: '100%', alignItems: 'flex-start' }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          {/* 園名 */}
          <Typography
            variant="h3"
            sx={{ fontSize: { xs: '1rem', md: '1.125rem' }, mb: 1 }}
          >
            {nursery.nurseryName}
          </Typography>

          {/* エリア */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
            <LocationOnIcon sx={{ fontSize: 16, color: '#AAAAAA' }} />
            <Typography variant="body2" color="text.secondary">
              {nursery.area}
            </Typography>
          </Box>

          {/* コンセプト */}
          {nursery.concept && (
            <Typography
              variant="body2"
              sx={{
                mb: 1.5,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {nursery.concept}
            </Typography>
          )}

          {/* 評価 */}
          {avg && avg.count > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 'auto' }}>
              <Rating
                value={avg.total}
                precision={0.1}
                readOnly
                size="small"
                sx={{
                  '& .MuiRating-iconFilled': { color: '#F4A7B9' },
                  '& .MuiRating-iconEmpty': { color: '#AAAAAA' },
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {avg.total.toFixed(1)} ({avg.count}件)
              </Typography>
            </Box>
          )}
          {(!avg || avg.count === 0) && (
            <Chip label="評価なし" size="small" sx={{ bgcolor: '#F9F9F9', color: '#AAAAAA', fontSize: '0.7rem' }} />
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  )
}
