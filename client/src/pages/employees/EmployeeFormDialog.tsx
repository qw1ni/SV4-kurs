import { useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  TextField,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { employeesApi } from '@/api/employees.api';
import type { EmployeeDto } from '@/types/models';
import { EMPLOYEE_STATUS_LABEL } from '@/utils/format';
import { extractErrorMessage } from '@/api/client';

interface Props {
  open: boolean;
  employee: EmployeeDto | null;
  onClose: () => void;
  onSaved: () => void;
}

interface FormState {
  firstName: string;
  lastName: string;
  middleName: string;
  birthDate: Date | null;
  gender: 'MALE' | 'FEMALE' | '';
  phone: string;
  personalEmail: string;
  address: string;
  hireDate: Date | null;
  dismissalDate: Date | null;
  status: 'ACTIVE' | 'VACATION' | 'SICK_LEAVE' | 'DISMISSED';
}

const initial: FormState = {
  firstName: '',
  lastName: '',
  middleName: '',
  birthDate: null,
  gender: '',
  phone: '',
  personalEmail: '',
  address: '',
  hireDate: new Date(),
  dismissalDate: null,
  status: 'ACTIVE',
};

export function EmployeeFormDialog({ open, employee, onClose, onSaved }: Props) {
  const [form, setForm] = useState<FormState>(initial);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setError(null);
      if (employee) {
        setForm({
          firstName: employee.firstName,
          lastName: employee.lastName,
          middleName: employee.middleName ?? '',
          birthDate: employee.birthDate ? new Date(employee.birthDate) : null,
          gender: employee.gender ?? '',
          phone: employee.phone ?? '',
          personalEmail: employee.personalEmail ?? '',
          address: employee.address ?? '',
          hireDate: new Date(employee.hireDate),
          dismissalDate: employee.dismissalDate ? new Date(employee.dismissalDate) : null,
          status: employee.status,
        });
      } else {
        setForm(initial);
      }
    }
  }, [open, employee]);

  const handleSubmit = async () => {
    if (!form.firstName || !form.lastName || !form.hireDate) {
      setError('Заполните обязательные поля');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        middleName: form.middleName || null,
        birthDate: form.birthDate ? form.birthDate.toISOString() : null,
        gender: form.gender || null,
        phone: form.phone || null,
        personalEmail: form.personalEmail || null,
        address: form.address || null,
        hireDate: form.hireDate.toISOString(),
        dismissalDate: form.dismissalDate ? form.dismissalDate.toISOString() : null,
        status: form.status,
      };
      if (employee) {
        await employeesApi.update(employee.id, payload as never);
      } else {
        await employeesApi.create(payload as never);
      }
      onSaved();
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{employee ? 'Редактирование сотрудника' : 'Новый сотрудник'}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField
              required
              label="Фамилия"
              fullWidth
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              required
              label="Имя"
              fullWidth
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Отчество"
              fullWidth
              value={form.middleName}
              onChange={(e) => setForm({ ...form, middleName: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <DatePicker
              label="Дата рождения"
              value={form.birthDate}
              onChange={(d) => setForm({ ...form, birthDate: d })}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              select
              label="Пол"
              fullWidth
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value as never })}
            >
              <MenuItem value="">—</MenuItem>
              <MenuItem value="MALE">Мужской</MenuItem>
              <MenuItem value="FEMALE">Женский</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Телефон"
              fullWidth
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Личный email"
              type="email"
              fullWidth
              value={form.personalEmail}
              onChange={(e) => setForm({ ...form, personalEmail: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Адрес"
              fullWidth
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <DatePicker
              label="Дата приёма"
              value={form.hireDate}
              onChange={(d) => setForm({ ...form, hireDate: d })}
              slotProps={{ textField: { fullWidth: true, required: true } }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <DatePicker
              label="Дата увольнения"
              value={form.dismissalDate}
              onChange={(d) => setForm({ ...form, dismissalDate: d })}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              select
              label="Статус"
              fullWidth
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as never })}
            >
              {Object.entries(EMPLOYEE_STATUS_LABEL).map(([k, v]) => (
                <MenuItem key={k} value={k}>
                  {v}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          {error && (
            <Grid item xs={12}>
              <span style={{ color: '#d32f2f' }}>{error}</span>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
          {employee ? 'Сохранить' : 'Создать'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
