'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import SendIcon from '@mui/icons-material/Send'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'

type Message = {
  id: string
  body: string
  createdAt: string
  sender: { id: string; role: string }
}

type Props = {
  matchId: string
  currentUserId: string
  chatOpen: boolean
}

export default function ChatPanel({ matchId, currentUserId, chatOpen }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/matches/${matchId}/messages`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages)
      }
    } catch {
      // 無視
    }
  }, [matchId])

  useEffect(() => {
    if (!chatOpen) return
    fetchMessages()
    const timer = setInterval(fetchMessages, 3000)
    return () => clearInterval(timer)
  }, [chatOpen, fetchMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    if (!input.trim() || sending) return
    setSending(true)
    try {
      const res = await fetch(`/api/matches/${matchId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: input.trim() }),
      })
      if (res.ok) {
        setInput('')
        await fetchMessages()
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <Box sx={{ border: '1px solid #E0E0E0', borderRadius: 2, overflow: 'hidden' }}>
      {/* ヘッダー */}
      <Box sx={{ px: 2, py: 1.5, bgcolor: '#F9F9F9', borderBottom: '1px solid #E0E0E0', display: 'flex', alignItems: 'center', gap: 1 }}>
        <ChatBubbleOutlineIcon sx={{ fontSize: 18, color: '#F4A7B9' }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>チャット</Typography>
      </Box>

      {!chatOpen ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            チャット期間が終了しました
          </Typography>
        </Box>
      ) : (
        <>
          {/* メッセージ一覧 */}
          <Box sx={{ height: 320, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {messages.length === 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
                メッセージはまだありません
              </Typography>
            )}
            {messages.map((msg) => {
              const isMine = msg.sender.id === currentUserId
              return (
                <Box
                  key={msg.id}
                  sx={{
                    display: 'flex',
                    justifyContent: isMine ? 'flex-end' : 'flex-start',
                  }}
                >
                  <Box
                    sx={{
                      maxWidth: '75%',
                      px: 1.5,
                      py: 1,
                      borderRadius: isMine ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                      bgcolor: isMine ? '#F4A7B9' : '#F0F0F0',
                      color: isMine ? '#FFFFFF' : '#333333',
                    }}
                  >
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                      {msg.body}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ display: 'block', textAlign: 'right', mt: 0.25, opacity: 0.7, fontSize: '0.65rem' }}
                    >
                      {new Date(msg.createdAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Box>
                </Box>
              )
            })}
            <div ref={bottomRef} />
          </Box>

          {/* 送信フォーム */}
          <Box sx={{ px: 2, py: 1.5, borderTop: '1px solid #E0E0E0', display: 'flex', gap: 1, alignItems: 'flex-end' }}>
            <TextField
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder="メッセージを入力..."
              multiline
              maxRows={3}
              fullWidth
              size="small"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <IconButton
              onClick={handleSend}
              disabled={!input.trim() || sending}
              sx={{ bgcolor: '#F4A7B9', color: '#FFFFFF', '&:hover': { bgcolor: '#e8869c' }, '&:disabled': { bgcolor: '#E0E0E0' }, flexShrink: 0 }}
            >
              <SendIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </>
      )}
    </Box>
  )
}
