import { useEffect, useState } from 'react';
import {
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import { staffUnitsApi } from '@/api/staff-units.api';
import type { EmployeeDto, StaffUnitDto } from '@/types/models';
import { formatFullName } from '@/utils/format';

interface Props {
  unit: StaffUnitDto | null;
  employees: EmployeeDto[];
  onClose: () => void;
  onSaved: () => void;
}

export function AssignEmployeeDialog({ unit, employees, onClose, onSaved }: Props) {
  const [selected, setSelected] = useState<EmployeeDto | null>(null);

  useEffect(() => {
    setSelected(unit?.employee ?? null);
  }, [unit]);

  const submit = async () => {
    if (!unit) return;
    await staffUnitsApi.assign(unit.id, selected?.id ?? null);
    onSaved();
  };

  return (
    <Dialog open={!!unit} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Назначение сотрудника</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" gutterBottom>
          <strong>Должность:</strong> {unit?.position?.title}
          <br />
          <strong>Подразделение:</strong> {unit?.department?.name}
        </Typography>
        <Autocomplete
          sx={{ mt: 2 }}
          options={employees}
          value={selected}
          onChange={(_, v) => setSelected(v)}
          getOptionLabel={(opt) => formatFullName(opt)}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          renderInput={(p) => <TextField {...p} label="Сотрудник" placeholder="Выберите или очистите для снятия" />}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button onClick={() => { setSelected(null); void submit(); }} color="warning">
          Снять
        </Button>
        <Button variant="contained" onClick={submit}>
          Назначить
        </Button>
      </DialogActions>
    </Dialog>
  );
}
