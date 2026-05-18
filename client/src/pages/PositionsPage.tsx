import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
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
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { PageHeader } from '@/components/common/PageHeader';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { positionsApi } from '@/api/positions.api';
import type { PositionDto } from '@/types/models';
import { formatDate, formatMoney } from '@/utils/format';
import { useAppDispatch } from '@/app/hooks';
import { showSnackbar } from '@/features/ui/uiSlice';

export function PositionsPage() {
  const dispatch = useAppDispatch();
  const [items, setItems] = useState<PositionDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PositionDto | null>(null);
  const [deleting, setDeleting] = useState<PositionDto | null>(null);
  const [salaryFor, setSalaryFor] = useState<PositionDto | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await positionsApi.list(search || undefined, category || undefined);
      setItems(data);
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  useEffect(() => {
    void load();
  }, [load]);

  const categories = useMemo(
    () => Array.from(new Set(items.map((p) => p.category).filter(Boolean))) as string[],
    [items]
  );

  return (
    <Box>
      <PageHeader
        title="Должности"
        subtitle="Справочник должностей и окладов"
        crumbs={[{ label: 'Должности' }]}
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            Добавить должность
          </Button>
        }
      />

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <TextField
                size="small"
                fullWidth
                label="Поиск"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                size="small"
                fullWidth
                label="Категория"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <MenuItem value="">Все</MenuItem>
                {categories.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
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
            <Typography>Должности не найдены</Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Должность</TableCell>
                  <TableCell>Код</TableCell>
                  <TableCell>Категория</TableCell>
                  <TableCell>Текущий оклад</TableCell>
                  <TableCell>Шт. ед.</TableCell>
                  <TableCell align="right">Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((p) => {
                  const latestSalary = p.salaryHistory?.[0];
                  return (
                    <TableRow key={p.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {p.title}
                        </Typography>
                        {p.description && (
                          <Typography variant="caption" color="text.secondary">
                            {p.description}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={p.code} />
                      </TableCell>
                      <TableCell>{p.category ?? '—'}</TableCell>
                      <TableCell>
                        {latestSalary ? (
                          <Stack>
                            <Typography variant="body2">{formatMoney(latestSalary.baseSalary)}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              с {formatDate(latestSalary.effectiveFrom)}
                            </Typography>
                          </Stack>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell>{p._count?.staffUnits ?? 0}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="История окладов">
                          <IconButton size="small" onClick={() => setSalaryFor(p)}>
                            <AttachMoneyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Редактировать">
                          <IconButton size="small" onClick={() => { setEditing(p); setFormOpen(true); }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Удалить">
                          <IconButton size="small" color="error" onClick={() => setDeleting(p)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        )}
      </Card>

      <PositionFormDialog
        open={formOpen}
        editing={editing}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false);
          dispatch(showSnackbar({ message: 'Сохранено', severity: 'success' }));
          void load();
        }}
      />

      <SalaryDialog
        position={salaryFor}
        onClose={() => setSalaryFor(null)}
        onSaved={() => {
          dispatch(showSnackbar({ message: 'Оклад добавлен', severity: 'success' }));
          void load();
        }}
      />

      <ConfirmDialog
        open={!!deleting}
        title="Удалить должность?"
        message={`Должность «${deleting?.title}» будет удалена.`}
        confirmText="Удалить"
        destructive
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await positionsApi.remove(deleting.id);
            void load();
            dispatch(showSnackbar({ message: 'Удалено', severity: 'info' }));
          } catch {
            dispatch(showSnackbar({ message: 'Не удалось удалить (есть штатные единицы)', severity: 'error' }));
          }
        }}
      />
    </Box>
  );
}

function PositionFormDialog({
  open,
  editing,
  onClose,
  onSaved,
}: {
  open: boolean;
  editing: PositionDto | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [qualification, setQualification] = useState('');

  useEffect(() => {
    if (open) {
      setTitle(editing?.title ?? '');
      setCode(editing?.code ?? '');
      setDescription(editing?.description ?? '');
      setCategory(editing?.category ?? '');
      setQualification(editing?.qualificationRequirements ?? '');
    }
  }, [open, editing]);

  const submit = async () => {
    if (!title || !code) return;
    const payload = {
      title,
      code,
      description: description || null,
      category: category || null,
      qualificationRequirements: qualification || null,
    };
    if (editing) {
      await positionsApi.update(editing.id, payload);
    } else {
      await positionsApi.create(payload);
    }
    onSaved();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editing ? 'Редактирование должности' : 'Новая должность'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <TextField label="Название" required fullWidth value={title} onChange={(e) => setTitle(e.target.value)} />
          <TextField
            label="Код"
            required
            fullWidth
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
          <TextField label="Категория" fullWidth value={category} onChange={(e) => setCategory(e.target.value)} />
          <TextField
            label="Описание"
            fullWidth
            multiline
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <TextField
            label="Квалификационные требования"
            fullWidth
            multiline
            rows={2}
            value={qualification}
            onChange={(e) => setQualification(e.target.value)}
          />
        </Stack>
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

function SalaryDialog({
  position,
  onClose,
  onSaved,
}: {
  position: PositionDto | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [baseSalary, setBaseSalary] = useState(0);
  const [allowances, setAllowances] = useState(0);
  const [effectiveFrom, setEffectiveFrom] = useState(() => new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');

  const submit = async () => {
    if (!position) return;
    await positionsApi.addSalary(position.id, {
      baseSalary,
      allowances,
      effectiveFrom,
      reason: reason || null,
    });
    setBaseSalary(0);
    setAllowances(0);
    setReason('');
    onSaved();
    onClose();
  };

  return (
    <Dialog open={!!position} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Оклад: {position?.title}</DialogTitle>
      <DialogContent dividers>
        <Typography variant="caption" color="text.secondary">
          История окладов:
        </Typography>
        <Table size="small" sx={{ mb: 2 }}>
          <TableHead>
            <TableRow>
              <TableCell>С даты</TableCell>
              <TableCell>Оклад</TableCell>
              <TableCell>Надбавки</TableCell>
              <TableCell>Причина</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {position?.salaryHistory?.map((s) => (
              <TableRow key={s.id}>
                <TableCell>{formatDate(s.effectiveFrom)}</TableCell>
                <TableCell>{formatMoney(s.baseSalary)}</TableCell>
                <TableCell>{formatMoney(s.allowances)}</TableCell>
                <TableCell>{s.reason ?? '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Typography variant="subtitle2" gutterBottom>
          Добавить новую запись
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Оклад"
              type="number"
              fullWidth
              value={baseSalary}
              onChange={(e) => setBaseSalary(Number(e.target.value))}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Надбавки"
              type="number"
              fullWidth
              value={allowances}
              onChange={(e) => setAllowances(Number(e.target.value))}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="С даты"
              type="date"
              fullWidth
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Причина" fullWidth value={reason} onChange={(e) => setReason(e.target.value)} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Закрыть</Button>
        <Button variant="contained" onClick={submit}>
          Добавить
        </Button>
      </DialogActions>
    </Dialog>
  );
}
