import { FormEvent, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { PageHeader } from '@/components/common/PageHeader';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { setTheme } from '@/features/ui/uiSlice';
import { resetAllFilters } from '@/features/filters/filtersSlice';
import { showSnackbar } from '@/features/ui/uiSlice';
import { authApi } from '@/api/auth.api';
import { extractErrorMessage } from '@/api/client';

export function SettingsPage() {
  const dispatch = useAppDispatch();
  const mode = useAppSelector((s) => s.ui.mode);
  const user = useAppSelector((s) => s.auth.user);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (newPassword.length < 6) {
      setError('Пароль должен быть не короче 6 символов');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }
    setSubmitting(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setSuccess('Пароль успешно изменён');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Настройки"
        subtitle="Внешний вид и параметры учётной записи"
        crumbs={[{ label: 'Настройки' }]}
      />

      <Stack spacing={2.5}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Внешний вид
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={mode === 'dark'}
                  onChange={(_, checked) => dispatch(setTheme(checked ? 'dark' : 'light'))}
                />
              }
              label={mode === 'dark' ? 'Тёмная тема' : 'Светлая тема'}
            />
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Сброс сохранённых фильтров и настроек (порядок сортировки, диапазоны окладов и т. д.)
            </Typography>
            <Button
              variant="outlined"
              onClick={() => {
                dispatch(resetAllFilters());
                dispatch(showSnackbar({ message: 'Настройки сброшены', severity: 'info' }));
              }}
            >
              Сбросить настройки
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Учётная запись
            </Typography>
            <Box sx={{ mb: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1.5 }}>
              <Typography variant="body2">Email: {user?.email}</Typography>
              <Typography variant="body2">
                Роль: {user?.role === 'HR_MANAGER' ? 'HR-менеджер' : 'Сотрудник'}
              </Typography>
            </Box>

            <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
              Смена пароля
            </Typography>
            <form onSubmit={submit}>
              <Stack spacing={2} sx={{ maxWidth: 420 }}>
                {error && <Alert severity="error">{error}</Alert>}
                {success && <Alert severity="success">{success}</Alert>}
                <TextField
                  type="password"
                  label="Текущий пароль"
                  required
                  fullWidth
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <TextField
                  type="password"
                  label="Новый пароль"
                  required
                  fullWidth
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <TextField
                  type="password"
                  label="Повторите новый пароль"
                  required
                  fullWidth
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <Button type="submit" variant="contained" disabled={submitting}>
                  Изменить пароль
                </Button>
              </Stack>
            </form>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
