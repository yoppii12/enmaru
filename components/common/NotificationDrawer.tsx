'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Drawer from '@mui/material/Drawer'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import CloseIcon from '@mui/icons-material/Close'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import HandshakeIcon from '@mui/icons-material/Handshake'
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn'
import StarBorderIcon from '@mui/icons-material/StarBorder'
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone'

type NotificationItem = {
  id: string
  type: string
  title: string
  body: string
  linkUrl: string | null
  read: boolean
  createdAt: string
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  MATCH_CONFIRMED:       <HandshakeIcon sx={{ color: '#F4A7B9', fontSize: 20 }} />,
  DOCUMENT_APPROVED:     <CheckCircleOutlineIcon sx={{ color: '#2E7D32', fontSize: 20 }} />,
  DOCUMENT_REJECTED:     <ErrorOutlineIcon sx={{ color: '#C62828', fontSize: 20 }} />,
  WORK_REPORT_SUBMITTED: <AssignmentTurnedInIcon sx={{ color: '#1565C0', fontSize: 20 }} />,
  REVIEW_REQUESTED:      <StarBorderIcon sx={{ color: '#F57F17', fontSize: 20 }} />,
}

type Props = {
  open: boolean
  onClose: () => void
  onRead: () => void
}

export default function NotificationDrawer({ open, onClose, onRead }: Props) {
  const router = useRouter()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch('/api/notifications')
      .then((r) => r.ok ? r.json() : { notifications: [] })
      .then((data) => setNotifications(data.notifications ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [open])

  async function handleReadAll() {
    await fetch('/api/notifications/read-all', { method: 'PATCH' })
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    onRead()
  }

  async function handleClick(notification: NotificationItem) {
    if (!notification.read) {
      await fetch(`/api/notifications/${notification.id}/read`, { method: 'PATCH' })
      setNotifications((prev) =>
        prev.map((n) => n.id === notification.id ? { ...n, read: true } : n)
      )
      onRead()
    }
    if (notification.linkUrl) {
      onClose()
      router.push(notification.linkUrl)
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100vw', sm: 380 } } }}
    >
      {/* ヘッダー */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5, borderBottom: '1px solid #E0E0E0' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          通知
          {unreadCount > 0 && (
            <Typography component="span" variant="caption" sx={{ ml: 1, color: '#F4A7B9' }}>
              {unreadCount}件未読
            </Typography>
          )}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {unreadCount > 0 && (
            <Button size="small" onClick={handleReadAll} sx={{ fontSize: '0.7rem', color: '#888' }}>
              全て既読
            </Button>
          )}
          <IconButton size="small" onClick={onClose} aria-label="閉じる">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* 通知リスト */}
      <Box sx={{ overflowY: 'auto', flex: 1 }}>
        {loading && (
          <Typography variant="body2" color="text.secondary" sx={{ p: 3, textAlign: 'center' }}>
            読み込み中...
          </Typography>
        )}

        {!loading && notifications.length === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, gap: 1 }}>
            <NotificationsNoneIcon sx={{ fontSize: 40, color: '#E0E0E0' }} />
            <Typography variant="body2" color="text.secondary">通知はありません</Typography>
          </Box>
        )}

        {!loading && notifications.map((notification, index) => (
          <Box key={notification.id}>
            <Box
              onClick={() => handleClick(notification)}
              sx={{
                display: 'flex',
                gap: 1.5,
                px: 2,
                py: 1.5,
                cursor: notification.linkUrl ? 'pointer' : 'default',
                bgcolor: notification.read ? 'transparent' : '#FFF8F9',
                '&:hover': notification.linkUrl ? { bgcolor: '#F9F9F9' } : {},
                position: 'relative',
              }}
            >
              {/* 未読ドット */}
              {!notification.read && (
                <Box sx={{
                  position: 'absolute',
                  left: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: '#F4A7B9',
                }} />
              )}

              {/* アイコン */}
              <Box sx={{ mt: 0.25, flexShrink: 0 }}>
                {TYPE_ICONS[notification.type] ?? <NotificationsNoneIcon sx={{ fontSize: 20, color: '#9E9E9E' }} />}
              </Box>

              {/* テキスト */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: notification.read ? 400 : 600, lineHeight: 1.4 }}>
                  {notification.title}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4, mt: 0.25 }}>
                  {notification.body}
                </Typography>
                <Typography variant="caption" sx={{ color: '#BBBBBB', fontSize: '0.65rem', mt: 0.25, display: 'block' }}>
                  {new Date(notification.createdAt).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </Typography>
              </Box>
            </Box>
            {index < notifications.length - 1 && <Divider />}
          </Box>
        ))}
      </Box>
    </Drawer>
  )
}
