import { useEffect, useState } from 'react';
import {
  Autocomplete,
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
import { staffUnitsApi } from '@/api/staff-units.api';
import type { DepartmentDto, EmployeeDto, PositionDto, StaffUnitDto } from '@/types/models';
import { SCHEDULE_LABEL, STAFF_UNIT_STATUS_LABEL, formatFullName } from '@/utils/format';

interface Props {
  open: boolean;
  editing: StaffUnitDto | null;
  departments: DepartmentDto[];
  positions: PositionDto[];
  employees: EmployeeDto[];
  onClose: () => void;
  onSaved: () => void;
}

export function StaffUnitFormDialog({
  open,
  editing,
  departments,
  positions,
  employees,
  onClose,
  onSaved,
}: Props) {
  const [departmentId, setDepartmentId] = useState<number | ''>('');
  const [positionId, setPositionId] = useState<number | ''>('');
  const [employee, setEmployee] = useState<EmployeeDto | null>(null);
  const [salary, setSalary] = useState(0);
  const [rate, setRate] = useState(1);
  const [schedule, setSchedule] = useState('FULL_TIME');
  const [status, setStatus] = useState('VACANT');
  const [openedDate, setOpenedDate] = useState<Date | null>(new Date());
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) {
      if (editing) {
        setDepartmentId(editing.departmentId);
        setPositionId(editing.positionId);
        setEmployee(editing.employee ?? null);
        setSalary(Number(editing.salary));
        setRate(Number(editing.rate));
        setSchedule(editing.workSchedule);
        setStatus(editing.status);
        setOpenedDate(new Date(editing.openedDate));
        setNotes(editing.notes ?? '');
      } else {
        setDepartmentId('');
        setPositionId('');
        setEmployee(null);
        setSalary(0);
        setRate(1);
        setSchedule('FULL_TIME');
        setStatus('VACANT');
        setOpenedDate(new Date());
        setNotes('');
      }
    }
  }, [open, editing]);

  const submit = async () => {
    if (!departmentId || !positionId || !openedDate) return;
    const payload = {
      departmentId: Number(departmentId),
      positionId: Number(positionId),
      employeeId: employee?.id ?? null,
      salary,
      rate,
      workSchedule: schedule as never,
      status: status as never,
      openedDate: openedDate.toISOString(),
      notes: notes || null,
    };
    if (editing) {
      await staffUnitsApi.update(editing.id, payload as never);
    } else {
      await staffUnitsApi.create(payload as never);
    }
    onSaved();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{editing ? 'Редактирование штатной единицы' : 'Новая штатная единица'}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              required
              label="Подразделение"
              fullWidth
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value === '' ? '' : Number(e.target.value))}
            >
              {departments.map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              required
              label="Должность"
              fullWidth
              value={positionId}
              onChange={(e) => setPositionId(e.target.value === '' ? '' : Number(e.target.value))}
            >
              {positions.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.title}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <Autocomplete
              options={employees}
              value={employee}
              onChange={(_, v) => setEmployee(v)}
              getOptionLabel={(opt) => formatFullName(opt)}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              renderInput={(p) => <TextField {...p} label="Сотрудник (опционально)" />}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              label="Оклад, ₽"
              type="number"
              fullWidth
              value={salary}
              onChange={(e) => setSalary(Number(e.target.value))}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              required
              label="Ставка"
              type="number"
              fullWidth
              inputProps={{ step: 0.25, min: 0.25, max: 2 }}
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <DatePicker
              label="Открыта с"
              value={openedDate}
              onChange={setOpenedDate}
              slotProps={{ textField: { fullWidth: true, required: true } }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="График"
              fullWidth
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
            >
              {Object.entries(SCHEDULE_LABEL).map(([k, v]) => (
                <MenuItem key={k} value={k}>
                  {v}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="Статус"
              fullWidth
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {Object.entries(STAFF_UNIT_STATUS_LABEL).map(([k, v]) => (
                <MenuItem key={k} value={k}>
                  {v}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Примечания"
              fullWidth
              multiline
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button variant="contained" onClick={submit}>
          {editing ? 'Сохранить' : 'Создать'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
