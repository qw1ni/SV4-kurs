import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { AvatarUploader } from '@/components/common/AvatarUploader';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import HomeIcon from '@mui/icons-material/Home';
import CakeIcon from '@mui/icons-material/Cake';

import { PageHeader } from '@/components/common/PageHeader';
import { StatusChip } from '@/components/common/StatusChip';
import { employeesApi } from '@/api/employees.api';
import type { EmployeeDto } from '@/types/models';
import {
  DOCUMENT_TYPE_LABEL,
  formatDate,
  formatFullName,
  formatMoney,
  LEAVE_TYPE_LABEL,
  SCHEDULE_LABEL,
} from '@/utils/format';
import { EmployeeFormDialog } from './employees/EmployeeFormDialog';
import { DocumentFormDialog } from './employees/DocumentFormDialog';
import { useAppDispatch } from '@/app/hooks';
import { showSnackbar } from '@/features/ui/uiSlice';

export function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [employee, setEmployee] = useState<EmployeeDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [docOpen, setDocOpen] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await employeesApi.get(Number(id));
      setEmployee(data);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!employee) return null;

  return (
    <Box>
      <PageHeader
        title={formatFullName(employee)}
        crumbs={[{ label: 'Сотрудники', to: '/employees' }, { label: formatFullName(employee) }]}
        actions={
          <Stack direction="row" spacing={1}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/employees')}>
              К списку
            </Button>
            <Button variant="contained" startIcon={<EditIcon />} onClick={() => setEditOpen(true)}>
              Редактировать
            </Button>
          </Stack>
        }
      />

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <AvatarUploader
                  employee={employee}
                  size={120}
                  onChange={(photoUrl) =>
                    setEmployee((prev) => (prev ? { ...prev, photoUrl } : prev))
                  }
                />
              </Box>
              <Typography variant="h6">{formatFullName(employee)}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                ID #{employee.id}
              </Typography>
              <Stack direction="row" justifyContent="center" spacing={1} sx={{ mb: 2 }}>
                <StatusChip status={employee.status} variant="employee" />
                {employee.gender && (
                  <Typography variant="caption" color="text.secondary">
                    {employee.gender === 'MALE' ? '♂ Мужской' : '♀ Женский'}
                  </Typography>
                )}
              </Stack>
              <Divider sx={{ my: 2 }} />
              <List dense>
                {employee.personalEmail && (
                  <ListItem disablePadding>
                    <EmailIcon fontSize="small" sx={{ mr: 1.5, color: 'text.secondary' }} />
                    <ListItemText primary={employee.personalEmail} />
                  </ListItem>
                )}
                {employee.phone && (
                  <ListItem disablePadding>
                    <PhoneIcon fontSize="small" sx={{ mr: 1.5, color: 'text.secondary' }} />
                    <ListItemText primary={employee.phone} />
                  </ListItem>
                )}
                {employee.address && (
                  <ListItem disablePadding>
                    <HomeIcon fontSize="small" sx={{ mr: 1.5, color: 'text.secondary' }} />
                    <ListItemText primary={employee.address} />
                  </ListItem>
                )}
                {employee.birthDate && (
                  <ListItem disablePadding>
                    <CakeIcon fontSize="small" sx={{ mr: 1.5, color: 'text.secondary' }} />
                    <ListItemText primary={formatDate(employee.birthDate)} />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Tab label="Кадровая информация" />
              <Tab label={`Документы (${employee.documents?.length ?? 0})`} />
              <Tab label={`Заявки (${employee.leaveRequests?.length ?? 0})`} />
            </Tabs>
            <CardContent>
              {tab === 0 && (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Дата приёма
                    </Typography>
                    <Typography>{formatDate(employee.hireDate)}</Typography>
                  </Grid>
                  {employee.dismissalDate && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                        Дата увольнения
                      </Typography>
                      <Typography>{formatDate(employee.dismissalDate)}</Typography>
                    </Grid>
                  )}
                  {employee.staffUnits?.map((unit) => (
                    <Grid item xs={12} key={unit.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Box>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                {unit.position?.title}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {unit.department?.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                График: {SCHEDULE_LABEL[unit.workSchedule]} · Ставка: {unit.rate}
                              </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                              <Typography variant="h6" color="primary.main">
                                {formatMoney(unit.salary)}
                              </Typography>
                              <StatusChip status={unit.status} variant="staff-unit" />
                            </Box>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                  {(!employee.staffUnits || employee.staffUnits.length === 0) && (
                    <Grid item xs={12}>
                      <Typography color="text.secondary">
                        Сотрудник не назначен ни на одну штатную единицу
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              )}

              {tab === 1 && (
                <>
                  <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
                    <Button variant="outlined" size="small" onClick={() => setDocOpen(true)}>
                      Добавить документ
                    </Button>
                  </Stack>
                  {employee.documents && employee.documents.length > 0 ? (
                    <List>
                      {employee.documents.map((doc) => (
                        <ListItem
                          key={doc.id}
                          divider
                          secondaryAction={
                            <IconButton
                              edge="end"
                              color="error"
                              onClick={async () => {
                                await employeesApi.removeDocument(employee.id, doc.id);
                                dispatch(showSnackbar({ message: 'Документ удалён', severity: 'info' }));
                                void load();
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          }
                        >
                          <ListItemText
                            primary={`${DOCUMENT_TYPE_LABEL[doc.type]}: ${doc.number}`}
                            secondary={
                              doc.issueDate
                                ? `Выдан ${formatDate(doc.issueDate)}${doc.issuedBy ? ', ' + doc.issuedBy : ''}`
                                : doc.issuedBy ?? '—'
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography color="text.secondary">Документы не загружены</Typography>
                  )}
                </>
              )}

              {tab === 2 && (
                <>
                  {employee.leaveRequests && employee.leaveRequests.length > 0 ? (
                    <List>
                      {employee.leaveRequests.map((lr) => (
                        <ListItem key={lr.id} divider>
                          <ListItemText
                            primary={`${LEAVE_TYPE_LABEL[lr.type]}: ${formatDate(lr.startDate)} — ${formatDate(lr.endDate)}`}
                            secondary={lr.reason ?? '—'}
                          />
                          <StatusChip status={lr.status} variant="leave" />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography color="text.secondary">Заявок не подавалось</Typography>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <EmployeeFormDialog
        open={editOpen}
        employee={employee}
        onClose={() => setEditOpen(false)}
        onSaved={() => {
          setEditOpen(false);
          dispatch(showSnackbar({ message: 'Сотрудник обновлён', severity: 'success' }));
          void load();
        }}
      />

      <DocumentFormDialog
        open={docOpen}
        employeeId={employee.id}
        onClose={() => setDocOpen(false)}
        onSaved={() => {
          setDocOpen(false);
          dispatch(showSnackbar({ message: 'Документ добавлен', severity: 'success' }));
          void load();
        }}
      />
    </Box>
  );
}
