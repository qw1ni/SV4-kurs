import { FormEvent, useState } from 'react';
import { Link as RouterLink, Navigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Grid,
  LinearProgress,
  Link as MuiLink,
  Stack,
  Stepper,
  Step,
  StepLabel,
  TextField,
  Typography,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { register } from '@/features/auth/authSlice';

const STEPS = ['Учётные данные', 'Профиль', 'Готово'];

export function RegisterPage() {
  const dispatch = useAppDispatch();
  const { status, error, user } = useAppSelector((s) => s.auth);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    firstName: '',
    lastName: '',
    middleName: '',
  });

  if (user) return <Navigate to="/" replace />;

  const next = () => {
    if (step === 0) {
      if (!form.email || form.password.length < 6 || form.password !== form.passwordConfirm) return;
    }
    if (step === 1) {
      if (!form.firstName || !form.lastName) return;
    }
    setStep((s) => s + 1);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void dispatch(
      register({
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        middleName: form.middleName || undefined,
      })
    );
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #7c4dff 0%, #1976d2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <Card sx={{ borderRadius: 3 }}>
          {status === 'loading' && <LinearProgress />}
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Typography variant="h5" align="center" gutterBottom>
              Регистрация
            </Typography>
            <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
              Создайте учётную запись сотрудника
            </Typography>

            <Stepper activeStep={step} sx={{ mb: 3 }}>
              {STEPS.map((s) => (
                <Step key={s}>
                  <StepLabel>{s}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={onSubmit} noValidate>
              {step === 0 && (
                <Stack spacing={2}>
                  <TextField
                    label="Email"
                    type="email"
                    required
                    fullWidth
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                  <TextField
                    label="Пароль (не менее 6 символов)"
                    type="password"
                    required
                    fullWidth
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                  <TextField
                    label="Повторите пароль"
                    type="password"
                    required
                    fullWidth
                    value={form.passwordConfirm}
                    error={form.passwordConfirm.length > 0 && form.password !== form.passwordConfirm}
                    helperText={
                      form.passwordConfirm.length > 0 && form.password !== form.passwordConfirm
                        ? 'Пароли не совпадают'
                        : ''
                    }
                    onChange={(e) => setForm({ ...form, passwordConfirm: e.target.value })}
                  />
                </Stack>
              )}

              {step === 1 && (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Фамилия"
                      required
                      fullWidth
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Имя"
                      required
                      fullWidth
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Отчество (необязательно)"
                      fullWidth
                      value={form.middleName}
                      onChange={(e) => setForm({ ...form, middleName: e.target.value })}
                    />
                  </Grid>
                </Grid>
              )}

              {step === 2 && (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Typography>Готово к отправке. Проверьте данные:</Typography>
                  <Box sx={{ mt: 2, textAlign: 'left', bgcolor: 'action.hover', p: 2, borderRadius: 1.5 }}>
                    <Typography variant="body2">
                      <strong>Email:</strong> {form.email}
                    </Typography>
                    <Typography variant="body2">
                      <strong>ФИО:</strong> {form.lastName} {form.firstName} {form.middleName}
                    </Typography>
                  </Box>
                </Box>
              )}

              <Stack direction="row" justifyContent="space-between" sx={{ mt: 3 }}>
                <Button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
                  Назад
                </Button>
                {step < 2 ? (
                  <Button variant="contained" onClick={next}>
                    Далее
                  </Button>
                ) : (
                  <Button type="submit" variant="contained" disabled={status === 'loading'}>
                    Зарегистрироваться
                  </Button>
                )}
              </Stack>
            </form>

            <Divider sx={{ my: 2.5 }} />
            <Typography variant="body2" align="center">
              Уже есть учётная запись?{' '}
              <MuiLink component={RouterLink} to="/login">
                Войти
              </MuiLink>
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
