import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Pagination,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import VisibilityIcon from '@mui/icons-material/Visibility';

import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { resetEmployeesFilters, setEmployeesFilters } from '@/features/filters/filtersSlice';
import { showSnackbar } from '@/features/ui/uiSlice';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusChip } from '@/components/common/StatusChip';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmployeeFormDialog } from './employees/EmployeeFormDialog';
import { employeesApi } from '@/api/employees.api';
import { departmentsApi } from '@/api/departments.api';
import { positionsApi } from '@/api/positions.api';
import type { DepartmentDto, EmployeeDto, PositionDto } from '@/types/models';
import { EMPLOYEE_STATUS_LABEL, formatDate, formatFullName } from '@/utils/format';

export function EmployeesPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const filters = useAppSelector((s) => s.filters.employees);

  const [items, setItems] = useState<EmployeeDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [positions, setPositions] = useState<PositionDto[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<EmployeeDto | null>(null);
  const [deleting, setDeleting] = useState<EmployeeDto | null>(null);

  const pageCount = Math.max(1, Math.ceil(total / filters.pageSize));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await employeesApi.list({
        q: filters.search || undefined,
        status: filters.status || undefined,
        departmentId: filters.departmentId ?? undefined,
        positionId: filters.positionId ?? undefined,
        page: filters.page,
        pageSize: filters.pageSize,
        sortBy: filters.sortBy,
        sortDir: filters.sortDir,
      });
      setItems(data.items);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    departmentsApi.list().then(setDepartments).catch(() => undefined);
    positionsApi.list().then(setPositions).catch(() => undefined);
  }, []);

  const handleSort = (col: string) => {
    if (filters.sortBy === col) {
      dispatch(setEmployeesFilters({ sortDir: filters.sortDir === 'asc' ? 'desc' : 'asc' }));
    } else {
      dispatch(setEmployeesFilters({ sortBy: col, sortDir: 'asc' }));
    }
  };

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.search) n++;
    if (filters.status) n++;
    if (filters.departmentId) n++;
    if (filters.positionId) n++;
    return n;
  }, [filters]);

  return (
    <Box>
      <PageHeader
        title="Сотрудники"
        subtitle="Управление картотекой сотрудников организации"
        crumbs={[{ label: 'Сотрудники' }]}
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            Добавить сотрудника
          </Button>
        }
      />

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                placeholder="Поиск по ФИО, телефону, email…"
                fullWidth
                size="small"
                autoFocus
                value={filters.search}
                onChange={(e) =>
                  dispatch(setEmployeesFilters({ search: e.target.value, page: 1 }))
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: filters.search ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => dispatch(setEmployeesFilters({ search: '' }))}>
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                select
                size="small"
                fullWidth
                label="Статус"
                value={filters.status}
                onChange={(e) =>
                  dispatch(setEmployeesFilters({ status: e.target.value as never, page: 1 }))
                }
              >
                <MenuItem value="">Все</MenuItem>
                {Object.entries(EMPLOYEE_STATUS_LABEL).map(([k, v]) => (
                  <MenuItem key={k} value={k}>
                    {v}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                size="small"
                fullWidth
                label="Подразделение"
                value={filters.departmentId ?? ''}
                onChange={(e) =>
                  dispatch(
                    setEmployeesFilters({
                      departmentId: e.target.value ? Number(e.target.value) : null,
                      page: 1,
                    })
                  )
                }
              >
                <MenuItem value="">Все</MenuItem>
                {departments.map((d) => (
                  <MenuItem key={d.id} value={d.id}>
                    {d.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                select
                size="small"
                fullWidth
                label="Должность"
                value={filters.positionId ?? ''}
                onChange={(e) =>
                  dispatch(
                    setEmployeesFilters({
                      positionId: e.target.value ? Number(e.target.value) : null,
                      page: 1,
                    })
                  )
                }
              >
                <MenuItem value="">Все</MenuItem>
                {positions.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.title}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={1}>
              <Tooltip title="Сбросить фильтры">
                <span>
                  <Button
                    fullWidth
                    color="inherit"
                    startIcon={<RestartAltIcon />}
                    disabled={activeFilterCount === 0}
                    onClick={() => dispatch(resetEmployeesFilters())}
                  >
                    Сброс
                  </Button>
                </span>
              </Tooltip>
            </Grid>
          </Grid>

          {activeFilterCount > 0 && (
            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              <Chip label={`Активных фильтров: ${activeFilterCount}`} size="small" color="primary" />
              <Chip label={`Найдено: ${total}`} size="small" />
            </Stack>
          )}
        </CardContent>
      </Card>

      <Card>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : items.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6">Извините, совпадений не обнаружено</Typography>
            <Typography variant="body2" color="text.secondary">
              Попробуйте изменить параметры поиска
            </Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell width={56} />
                  <TableCell sortDirection={filters.sortBy === 'lastName' ? filters.sortDir : false}>
                    <TableSortLabel
                      active={filters.sortBy === 'lastName'}
                      direction={filters.sortDir}
                      onClick={() => handleSort('lastName')}
                    >
                      ФИО
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Подразделение</TableCell>
                  <TableCell>Должность</TableCell>
                  <TableCell sortDirection={filters.sortBy === 'hireDate' ? filters.sortDir : false}>
                    <TableSortLabel
                      active={filters.sortBy === 'hireDate'}
                      direction={filters.sortDir}
                      onClick={() => handleSort('hireDate')}
                    >
                      Дата приёма
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Телефон</TableCell>
                  <TableCell>Статус</TableCell>
                  <TableCell align="right">Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((e) => {
                  const unit = e.staffUnits?.[0];
                  return (
                    <TableRow key={e.id} hover>
                      <TableCell>
                        <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 14 }}>
                          {e.firstName.charAt(0)}
                          {e.lastName.charAt(0)}
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {formatFullName(e)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {e.personalEmail ?? '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>{unit?.department?.name ?? '—'}</TableCell>
                      <TableCell>{unit?.position?.title ?? '—'}</TableCell>
                      <TableCell>{formatDate(e.hireDate)}</TableCell>
                      <TableCell>{e.phone ?? '—'}</TableCell>
                      <TableCell>
                        <StatusChip status={e.status} variant="employee" />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Карточка">
                          <IconButton size="small" onClick={() => navigate(`/employees/${e.id}`)}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Редактировать">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setEditing(e);
                              setFormOpen(true);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Удалить">
                          <IconButton size="small" color="error" onClick={() => setDeleting(e)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems="center"
              spacing={1}
              sx={{ p: 2 }}
            >
              <Typography variant="caption" color="text.secondary">
                Показано {items.length} из {total}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  select
                  size="small"
                  label="На страницу"
                  value={filters.pageSize}
                  onChange={(e) =>
                    dispatch(setEmployeesFilters({ pageSize: Number(e.target.value), page: 1 }))
                  }
                  sx={{ width: 130 }}
                >
                  {[10, 20, 50, 100].map((n) => (
                    <MenuItem key={n} value={n}>
                      {n}
                    </MenuItem>
                  ))}
                </TextField>
                <Pagination
                  page={filters.page}
                  count={pageCount}
                  onChange={(_e, page) => dispatch(setEmployeesFilters({ page }))}
                  color="primary"
                  shape="rounded"
                />
              </Stack>
            </Stack>
          </Box>
        )}
      </Card>

      <EmployeeFormDialog
        open={formOpen}
        employee={editing}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false);
          void load();
          dispatch(
            showSnackbar({ message: editing ? 'Сотрудник обновлён' : 'Сотрудник создан', severity: 'success' })
          );
        }}
      />

      <ConfirmDialog
        open={!!deleting}
        title="Удалить сотрудника?"
        message={`Сотрудник «${formatFullName(deleting)}» и все его данные будут удалены. Это действие нельзя отменить.`}
        confirmText="Удалить"
        destructive
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await employeesApi.remove(deleting.id);
            dispatch(showSnackbar({ message: 'Сотрудник удалён', severity: 'success' }));
            void load();
          } catch (err) {
            dispatch(showSnackbar({ message: 'Не удалось удалить', severity: 'error' }));
          }
        }}
      />
    </Box>
  );
}
