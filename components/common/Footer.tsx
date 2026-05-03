import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import MuiLink from '@mui/material/Link'
import NextLink from 'next/link'

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        bgcolor: '#F9F9F9',
        borderTop: '1px solid #E0E0E0',
        py: { xs: 3, md: 4 },
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 2, md: 3 } }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'center', md: 'center' },
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          {/* ロゴ */}
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, color: '#F4A7B9', fontSize: '1.125rem' }}
          >
            えんまーる
          </Typography>

          {/* リンク */}
          <Box sx={{ display: 'flex', gap: { xs: 2, md: 3 }, flexWrap: 'wrap', justifyContent: 'center' }}>
            <MuiLink
              component={NextLink}
              href="/about"
              variant="body2"
              color="text.secondary"
              underline="hover"
            >
              えんまーるとは
            </MuiLink>
            <MuiLink
              component={NextLink}
              href="/terms"
              variant="body2"
              color="text.secondary"
              underline="hover"
            >
              利用規約
            </MuiLink>
            <MuiLink
              component={NextLink}
              href="/privacy"
              variant="body2"
              color="text.secondary"
              underline="hover"
            >
              プライバシーポリシー
            </MuiLink>
          </Box>

          {/* コピーライト */}
          <Typography variant="caption" color="text.secondary">
            © 2025 えんまーる
          </Typography>
        </Box>
      </Container>
    </Box>
  )
}
