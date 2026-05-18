import { createTheme, ThemeOptions } from '@mui/material/styles';

const sharedShape: ThemeOptions['shape'] = { borderRadius: 10 };

export function buildTheme(mode: 'light' | 'dark') {
  return createTheme({
    palette: {
      mode,
      primary: { main: '#1976d2' },
      secondary: { main: '#7c4dff' },
      success: { main: '#2e7d32' },
      warning: { main: '#ed6c02' },
      error: { main: '#d32f2f' },
      background:
        mode === 'light'
          ? { default: '#f5f7fb', paper: '#ffffff' }
          : { default: '#0f1419', paper: '#1a1f29' },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h4: { fontWeight: 600 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      button: { textTransform: 'none', fontWeight: 500 },
    },
    shape: sharedShape,
    components: {
      MuiButton: {
        styleOverrides: {
          root: { borderRadius: 8, paddingInline: 16 },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            transition: 'box-shadow 200ms ease, transform 200ms ease',
            '&:hover': { boxShadow: '0 6px 18px rgba(0,0,0,0.08)' },
          },
        },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            border: mode === 'light' ? '1px solid #e3e7ef' : '1px solid #2a313d',
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: { fontWeight: 600 },
        },
      },
    },
  });
}
