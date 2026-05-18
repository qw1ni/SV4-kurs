import { useCallback, useEffect, useState } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  MenuItem,
  Slider,
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
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusChip } from '@/components/common/StatusChip';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { staffUnitsApi } from '@/api/staff-units.api';
import { departmentsApi } from '@/api/departments.api';
import { positionsApi } from '@/api/positions.api';
import { employeesApi } from '@/api/employees.api';
import type { DepartmentDto, EmployeeDto, PositionDto, StaffUnitDto } from '@/types/models';
import {
  formatFullName,
  formatMoney,
  SCHEDULE_LABEL,
  STAFF_UNIT_STATUS_LABEL,
} from '@/utils/format';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { resetStaffUnitsFilters, setStaffUnitsFilters } from '@/features/filters/filtersSlice';
import { showSnackbar } from '@/features/ui/uiSlice';
import { StaffUnitFormDialog } from './staffing/StaffUnitFormDialog';
import { AssignEmployeeDialog } from './staffing/AssignEmployeeDialog';

const SALARY_MIN = 0;
const SALARY_MAX = 500000;

export function StaffingPage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const filters = useAppSelector((s) => s.filters.staffUnits);

  const [items, setItems] = useState<StaffUnitDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [positions, setPositions] = useState<PositionDto[]>([]);
  const [employees, setEmployees] = useState<EmployeeDto[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<StaffUnitDto | null>(null);
  const [assignFor, setAssignFor] = useState<StaffUnitDto | null>(null);
  const [deleting, setDeleting] = useState<StaffUnitDto | null>(null);

  const isHr = user?.role === 'HR_MANAGER';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await staffUnitsApi.list({
        q: filters.search || undefined,
        departmentId: filters.departmentId ?? undefined,
        positionId: filters.positionId ?? undefined,
        status: filters.status || undefined,
        schedule: filters.schedule || undefined,
        minSalary: filters.minSalary > SALARY_MIN ? filters.minSalary : undefined,
        maxSalary: filters.maxSalary < SALARY_MAX ? filters.maxSalary : undefined,
      });
      setItems(data);
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
    if (isHr) {
      employeesApi.list({ pageSize: 100, status: 'ACTIVE' }).then((r) => setEmployees(r.items));
    }
  }, [isHr]);

  const totalSalary = items.reduce((s, u) => s + Number(u.salary), 0);

  return (
    <Box>
      <PageHeader
        title="Штатное расписание"
        subtitle="Распределение штатных единиц по подразделениям"
        crumbs={[{ label: 'Штатное расписание' }]}
        actions={
          isHr && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              Новая штатная единица
            </Button>
          )
        }
      />

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                size="small"
                fullWidth
                label="Поиск"
                value={filters.search}
                onChange={(e) => dispatch(setStaffUnitsFilters({ search: e.target.value }))}
              />
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
                    setStaffUnitsFilters({
                      departmentId: e.target.value ? Number(e.target.value) : null,
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
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                size="small"
                fullWidth
                label="Статус"
                value={filters.status}
                onChange={(e) => dispatch(setStaffUnitsFilters({ status: e.target.value as never }))}
              >
                <MenuItem value="">Все</MenuItem>
                {Object.entries(STAFF_UNIT_STATUS_LABEL).map(([k, v]) => (
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
                label="График"
                value={filters.schedule}
                onChange={(e) => dispatch(setStaffUnitsFilters({ schedule: e.target.value as never }))}
              >
                <MenuItem value="">Все</MenuItem>
                {Object.entries(SCHEDULE_LABEL).map(([k, v]) => (
                  <MenuItem key={k} value={k}>
                    {v}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary">
                Диапазон оклада: {formatMoney(filters.minSalary)} — {formatMoney(filters.maxSalary)}
              </Typography>
              <Slider
                value={[filters.minSalary, filters.maxSalary]}
                onChange={(_, v) => {
                  const [min, max] = v as number[];
                  dispatch(setStaffUnitsFilters({ minSalary: min, maxSalary: max }));
                }}
                min={SALARY_MIN}
                max={SALARY_MAX}
                step={5000}
                valueLabelDisplay="auto"
                valueLabelFormat={(v) => `${Math.round(v / 1000)}к`}
              />
            </Grid>
            <Grid item xs={12}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip label={`Найдено: ${items.length}`} size="small" color="primary" />
                <Chip label={`ФОТ выборки: ${formatMoney(totalSalary)}`} size="small" />
                <Button
                  size="small"
                  startIcon={<RestartAltIcon />}
                  onClick={() => dispatch(resetStaffUnitsFilters())}
                >
                  Сбросить фильтры
                </Button>
              </Stack>
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
            <Typography>Извините, совпадений не обнаружено</Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Подразделение</TableCell>
                  <TableCell>Должность</TableCell>
                  <TableCell>Сотрудник</TableCell>
                  <TableCell>Оклад</TableCell>
                  <TableCell>Ставка</TableCell>
                  <TableCell>График</TableCell>
                  <TableCell>Статус</TableCell>
                  {isHr && <TableCell align="right">Действия</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((u) => (
                  <TableRow key={u.id} hover>
                    <TableCell>{u.department?.name}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {u.position?.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {u.position?.category}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {u.employee ? (
                        formatFullName(u.employee)
                      ) : (
                        <Typography variant="body2" color="text.secondary" fontStyle="italic">
                          — вакансия —
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{formatMoney(u.salary)}</TableCell>
                    <TableCell>{u.rate}</TableCell>
                    <TableCell>{SCHEDULE_LABEL[u.workSchedule]}</TableCell>
                    <TableCell>
                      <StatusChip status={u.status} variant="staff-unit" />
                    </TableCell>
                    {isHr && (
                      <TableCell align="right">
                        <Tooltip title="Назначить">
                          <IconButton size="small" onClick={() => setAssignFor(u)}>
                            <AssignmentIndIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Редактировать">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setEditing(u);
                              setFormOpen(true);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Удалить">
                          <IconButton size="small" color="error" onClick={() => setDeleting(u)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Card>

      {isHr && (
        <>
          <StaffUnitFormDialog
            open={formOpen}
            editing={editing}
            departments={departments}
            positions={positions}
            employees={employees}
            onClose={() => setFormOpen(false)}
            onSaved={() => {
              setFormOpen(false);
              dispatch(showSnackbar({ message: 'Сохранено', severity: 'success' }));
              void load();
            }}
          />
          <AssignEmployeeDialog
            unit={assignFor}
            employees={employees}
            onClose={() => setAssignFor(null)}
            onSaved={() => {
              setAssignFor(null);
              dispatch(showSnackbar({ message: 'Назначение обновлено', severity: 'success' }));
              void load();
            }}
          />
          <ConfirmDialog
            open={!!deleting}
            title="Удалить штатную единицу?"
            message="Штатная единица будет удалена."
            confirmText="Удалить"
            destructive
            onClose={() => setDeleting(null)}
            onConfirm={async () => {
              if (!deleting) return;
              await staffUnitsApi.remove(deleting.id);
              dispatch(showSnackbar({ message: 'Удалено', severity: 'info' }));
              void load();
            }}
          />
        </>
      )}
    </Box>
  );
}
