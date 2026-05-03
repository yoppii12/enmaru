'use client'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardActionArea from '@mui/material/CardActionArea'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import CurrencyYenIcon from '@mui/icons-material/CurrencyYen'
import Link from 'next/link'
import dayjs from 'dayjs'

type JobCardData = {
  id: string
  title: string
  workDate: Date | string
  workTimeStart: Date | string
  workTimeEnd: Date | string
  hourlyWage: number | null
  targetPerson: string | null
  nurseryName?: string
}

type Props = {
  job: JobCardData
  href: string
}

export default function JobCard({ job, href }: Props) {
  const date = dayjs(job.workDate).format('YYYY年M月D日')
  const start = dayjs(job.workTimeStart).format('HH:mm')
  const end = dayjs(job.workTimeEnd).format('HH:mm')

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
          {job.nurseryName && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              {job.nurseryName}
            </Typography>
          )}

          {/* タイトル */}
          <Typography
            variant="h3"
            sx={{ fontSize: { xs: '1rem', md: '1.125rem' }, mb: 1.5 }}
          >
            {job.title}
          </Typography>

          {/* 日時 */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <CalendarTodayIcon sx={{ fontSize: 14, color: '#AAAAAA' }} />
              <Typography variant="body2" color="text.secondary">
                {date}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <AccessTimeIcon sx={{ fontSize: 14, color: '#AAAAAA' }} />
              <Typography variant="body2" color="text.secondary">
                {start} 〜 {end}
              </Typography>
            </Box>
            {job.hourlyWage && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <CurrencyYenIcon sx={{ fontSize: 14, color: '#AAAAAA' }} />
                <Typography variant="body2" color="text.secondary">
                  時給 {job.hourlyWage.toLocaleString()}円
                </Typography>
              </Box>
            )}
          </Box>

          {/* 対象者 */}
          {job.targetPerson && (
            <Chip
              label={job.targetPerson}
              size="small"
              sx={{ bgcolor: '#F9F9F9', color: '#666666', fontSize: '0.7rem' }}
            />
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  )
}
