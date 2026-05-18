import { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import CancelIcon from '@mui/icons-material/Cancel';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusChip } from '@/components/common/StatusChip';
import { leavesApi } from '@/api/leaves.api';
import type { LeaveRequestDto } from '@/types/models';
import { formatDate, formatFullName, LEAVE_STATUS_LABEL, LEAVE_TYPE_LABEL } from '@/utils/format';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { showSnackbar } from '@/features/ui/uiSlice';

export function LeaveRequestsPage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const isHr = user?.role === 'HR_MANAGER';

  const [items, setItems] = useState<LeaveRequestDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [deciding, setDeciding] = useState<LeaveRequestDto | null>(null);
  const [decision, setDecision] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [decisionText, setDecisionText] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await leavesApi.list({
        status: statusFilter || undefined,
        type: typeFilter || undefined,
      });
      setItems(data);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Box>
      <PageHeader
        title="Заявки на отпуск"
        subtitle={isHr ? 'Управление заявками сотрудников' : 'Ваши заявки'}
        crumbs={[{ label: 'Заявки' }]}
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setFormOpen(true)}>
            Новая заявка
          </Button>
        }
      />

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                size="small"
                fullWidth
                label="Статус"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">Все</MenuItem>
                {Object.entries(LEAVE_STATUS_LABEL).map(([k, v]) => (
                  <MenuItem key={k} value={k}>
                    {v}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                size="small"
                fullWidth
                label="Тип"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <MenuItem value="">Все</MenuItem>
                {Object.entries(LEAVE_TYPE_LABEL).map(([k, v]) => (
                  <MenuItem key={k} value={k}>
                    {v}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : items.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography>Заявок нет</Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Сотрудник</TableCell>
                  <TableCell>Тип</TableCell>
                  <TableCell>Период</TableCell>
                  <TableCell>Причина</TableCell>
                  <TableCell>Подана</TableCell>
                  <TableCell>Статус</TableCell>
                  <TableCell align="right">Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((lr) => (
                  <TableRow key={lr.id} hover>
                    <TableCell>{formatFullName(lr.employee)}</TableCell>
                    <TableCell>{LEAVE_TYPE_LABEL[lr.type]}</TableCell>
                    <TableCell>
                      {formatDate(lr.startDate)} — {formatDate(lr.endDate)}
                    </TableCell>
                    <TableCell>{lr.reason ?? '—'}</TableCell>
                    <TableCell>{formatDate(lr.createdAt)}</TableCell>
                    <TableCell>
                      <StatusChip status={lr.status} variant="leave" />
                    </TableCell>
                    <TableCell align="right">
                      {isHr && lr.status === 'PENDING' && (
                        <>
                          <Tooltip title="Одобрить">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => {
                                setDecision('APPROVED');
                                setDeciding(lr);
                              }}
                            >
                              <CheckIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Отклонить">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                setDecision('REJECTED');
                                setDeciding(lr);
                              }}
                            >
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      {lr.status === 'PENDING' && !isHr && (
                        <Tooltip title="Отозвать">
                          <IconButton
                            size="small"
                            onClick={async () => {
                              await leavesApi.cancel(lr.id);
                              dispatch(showSnackbar({ message: 'Заявка отозвана', severity: 'info' }));
                              void load();
                            }}
                          >
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Card>

      <NewLeaveDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false);
          dispatch(showSnackbar({ message: 'Заявка подана', severity: 'success' }));
          void load();
        }}
      />

      <Dialog open={!!deciding} onClose={() => setDeciding(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{decision === 'APPROVED' ? 'Одобрить заявку' : 'Отклонить заявку'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Typography variant="body2">
              {formatFullName(deciding?.employee)}: {deciding && LEAVE_TYPE_LABEL[deciding.type]} с{' '}
              {formatDate(deciding?.startDate)} по {formatDate(deciding?.endDate)}
            </Typography>
            <TextField
              label="Комментарий"
              multiline
              rows={3}
              fullWidth
              value={decisionText}
              onChange={(e) => setDecisionText(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeciding(null)}>Отмена</Button>
          <Button
            variant="contained"
            color={decision === 'APPROVED' ? 'success' : 'error'}
            onClick={async () => {
              if (!deciding) return;
              await leavesApi.decide(deciding.id, decision, decisionText || undefined);
              setDeciding(null);
              setDecisionText('');
              dispatch(showSnackbar({ message: 'Решение принято', severity: 'success' }));
              void load();
            }}
          >
            {decision === 'APPROVED' ? 'Одобрить' : 'Отклонить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function NewLeaveDialog({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [type, setType] = useState('ANNUAL');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) {
      setType('ANNUAL');
      setStartDate(null);
      setEndDate(null);
      setReason('');
    }
  }, [open]);

  const submit = async () => {
    if (!startDate || !endDate) return;
    await leavesApi.create({
      type,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      reason: reason || undefined,
    });
    onSaved();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Новая заявка на отпуск</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <TextField
            select
            label="Тип отпуска"
            fullWidth
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            {Object.entries(LEAVE_TYPE_LABEL).map(([k, v]) => (
              <MenuItem key={k} value={k}>
                {v}
              </MenuItem>
            ))}
          </TextField>
          <DatePicker
            label="Дата начала"
            value={startDate}
            onChange={setStartDate}
            slotProps={{ textField: { fullWidth: true, required: true } }}
          />
          <DatePicker
            label="Дата окончания"
            value={endDate}
            onChange={setEndDate}
            slotProps={{ textField: { fullWidth: true, required: true } }}
          />
          <TextField
            label="Причина"
            fullWidth
            multiline
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button variant="contained" onClick={submit}>
          Подать
        </Button>
      </DialogActions>
    </Dialog>
  );
}
