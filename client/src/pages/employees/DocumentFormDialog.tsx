import { useState } from 'react';
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
import { DOCUMENT_TYPE_LABEL } from '@/utils/format';

interface Props {
  open: boolean;
  employeeId: number;
  onClose: () => void;
  onSaved: () => void;
}

export function DocumentFormDialog({ open, employeeId, onClose, onSaved }: Props) {
  const [type, setType] = useState<string>('PASSPORT');
  const [number, setNumber] = useState('');
  const [issueDate, setIssueDate] = useState<Date | null>(null);
  const [issuedBy, setIssuedBy] = useState('');
  const [notes, setNotes] = useState('');

  const reset = () => {
    setType('PASSPORT');
    setNumber('');
    setIssueDate(null);
    setIssuedBy('');
    setNotes('');
  };

  const submit = async () => {
    if (!number) return;
    await employeesApi.addDocument(employeeId, {
      type: type as never,
      number,
      issueDate: issueDate ? (issueDate.toISOString() as never) : null,
      issuedBy: issuedBy || null,
      notes: notes || null,
    });
    reset();
    onSaved();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Добавить документ</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="Тип"
              fullWidth
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {Object.entries(DOCUMENT_TYPE_LABEL).map(([k, v]) => (
                <MenuItem key={k} value={k}>
                  {v}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Номер"
              required
              fullWidth
              value={number}
              onChange={(e) => setNumber(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <DatePicker
              label="Дата выдачи"
              value={issueDate}
              onChange={setIssueDate}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Кем выдан"
              fullWidth
              value={issuedBy}
              onChange={(e) => setIssuedBy(e.target.value)}
            />
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
          Добавить
        </Button>
      </DialogActions>
    </Dialog>
  );
}
