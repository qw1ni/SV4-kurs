import { FormEvent, useState } from 'react';
import { Link as RouterLink, Navigate, useLocation } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  IconButton,
  InputAdornment,
  LinearProgress,
  Link as MuiLink,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LoginIcon from '@mui/icons-material/Login';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { login } from '@/features/auth/authSlice';

export function LoginPage() {
  const dispatch = useAppDispatch();
  const { status, error, user } = useAppSelector((s) => s.auth);
  const location = useLocation();
  const [email, setEmail] = useState('hr@staffing.local');
  const [password, setPassword] = useState('hr12345');
  const [showPass, setShowPass] = useState(false);

  if (user) {
    const to = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/';
    return <Navigate to={to} replace />;
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void dispatch(login({ email, password }));
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1976d2 0%, #7c4dff 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Container maxWidth="xs">
        <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
          {status === 'loading' && <LinearProgress />}
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: 'primary.main',
                  color: 'white',
                  borderRadius: 2,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 22,
                  mb: 1.5,
                }}
              >
                ШР
              </Box>
              <Typography variant="h5">Вход в систему</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Платформа управления штатным расписанием
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={onSubmit} noValidate>
              <Stack spacing={2}>
                <TextField
                  label="Email"
                  type="email"
                  required
                  autoFocus
                  fullWidth
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
                <TextField
                  label="Пароль"
                  type={showPass ? 'text' : 'password'}
                  required
                  fullWidth
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPass((v) => !v)} edge="end" size="small">
                          {showPass ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  startIcon={<LoginIcon />}
                  disabled={status === 'loading'}
                >
                  Войти
                </Button>
              </Stack>
            </form>

            <Divider sx={{ my: 2.5 }}>или</Divider>

            <Typography variant="body2" align="center">
              Нет учётной записи?{' '}
              <MuiLink component={RouterLink} to="/register">
                Зарегистрироваться
              </MuiLink>
            </Typography>

            <Box sx={{ mt: 2.5, p: 1.5, bgcolor: 'action.hover', borderRadius: 1.5 }}>
              <Typography variant="caption" color="text.secondary" component="div">
                <strong>Демо-доступ:</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary" component="div">
                HR: hr@staffing.local / hr12345
              </Typography>
              <Typography variant="caption" color="text.secondary" component="div">
                Сотрудник: employee@staffing.local / emp12345
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
