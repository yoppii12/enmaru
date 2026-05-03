import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    primary: {
      main: '#F4A7B9',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#666666',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#FFFFFF',
      paper: '#F9F9F9',
    },
    text: {
      primary: '#333333',
      secondary: '#666666',
      disabled: '#AAAAAA',
    },
    divider: '#AAAAAA',
    error: {
      main: '#E57373',
    },
  },
  typography: {
    fontFamily: "'Noto Sans JP', sans-serif",
    h1: { fontSize: '2rem',     fontWeight: 700, color: '#333333', lineHeight: 1.4 },
    h2: { fontSize: '1.5rem',   fontWeight: 700, color: '#333333', lineHeight: 1.4 },
    h3: { fontSize: '1.25rem',  fontWeight: 700, color: '#333333', lineHeight: 1.5 },
    h4: { fontSize: '1.125rem', fontWeight: 500, color: '#333333', lineHeight: 1.5 },
    body1: { fontSize: '1rem',      fontWeight: 400, color: '#333333', lineHeight: 1.8 },
    body2: { fontSize: '0.875rem',  fontWeight: 400, color: '#666666', lineHeight: 1.7 },
    caption: { fontSize: '0.75rem', fontWeight: 400, color: '#AAAAAA', lineHeight: 1.6 },
    button: { fontSize: '0.875rem', fontWeight: 500, letterSpacing: '0.02em' },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        containedPrimary: {
          borderRadius: '24px',
          padding: '10px 28px',
          '&:hover': { backgroundColor: '#e8929a' },
        },
        outlinedPrimary: {
          borderRadius: '24px',
          padding: '10px 28px',
          '&:hover': { backgroundColor: '#FFF0F3' },
        },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', fullWidth: true },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#F9F9F9',
            '& fieldset': { borderColor: '#AAAAAA' },
            '&:hover fieldset': { borderColor: '#666666' },
            '&.Mui-focused fieldset': { borderColor: '#F4A7B9' },
          },
          '& .MuiInputLabel-root.Mui-focused': { color: '#F4A7B9' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #AAAAAA',
          borderRadius: '12px',
          boxShadow: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          boxShadow: '0 1px 0 #AAAAAA',
          color: '#333333',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: '#AAAAAA' },
      },
    },
  },
})
