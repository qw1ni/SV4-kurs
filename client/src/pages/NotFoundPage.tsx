import { Box, Button, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';

export function NotFoundPage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        p: 3,
      }}
    >
      <Typography variant="h1" sx={{ fontSize: 96, fontWeight: 700, color: 'primary.main' }}>
        404
      </Typography>
      <Typography variant="h5" gutterBottom>
        Страница не найдена
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 420 }}>
        Запрошенный адрес не существует или был удалён. Вернитесь на главную страницу платформы.
      </Typography>
      <Button variant="contained" component={RouterLink} to="/" startIcon={<HomeIcon />}>
        На главную
      </Button>
    </Box>
  );
}
