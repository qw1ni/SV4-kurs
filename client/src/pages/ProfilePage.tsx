import { useCallback, useEffect, useState } from 'react';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
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
import { useAppSelector } from '@/app/hooks';

export function ProfilePage() {
  const { user } = useAppSelector((s) => s.auth);
  const [profile, setProfile] = useState<EmployeeDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await employeesApi.myProfile();
      setProfile(data);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

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

  if (!profile) {
    return (
      <Box>
        <PageHeader title="Мой профиль" crumbs={[{ label: 'Профиль' }]} />
        <Card>
          <CardContent>
            <Typography>Карточка сотрудника не привязана к этой учётной записи.</Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Мой профиль"
        subtitle="Личная информация и история"
        crumbs={[{ label: 'Профиль' }]}
      />

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar
                sx={{
                  width: 96,
                  height: 96,
                  fontSize: 32,
                  mx: 'auto',
                  mb: 2,
                  bgcolor: 'primary.main',
                }}
              >
                {profile.firstName.charAt(0)}
                {profile.lastName.charAt(0)}
              </Avatar>
              <Typography variant="h6">{formatFullName(profile)}</Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.email}
              </Typography>
              <Stack direction="row" justifyContent="center" sx={{ mt: 1.5 }}>
                <StatusChip status={profile.status} variant="employee" />
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Stack alignItems="flex-start" spacing={0.75}>
                {profile.phone && <Typography variant="body2">📞 {profile.phone}</Typography>}
                {profile.personalEmail && <Typography variant="body2">✉ {profile.personalEmail}</Typography>}
                {profile.address && <Typography variant="body2">🏠 {profile.address}</Typography>}
                {profile.birthDate && (
                  <Typography variant="body2">🎂 {formatDate(profile.birthDate)}</Typography>
                )}
                <Typography variant="body2">
                  📅 Дата приёма: {formatDate(profile.hireDate)}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
              <Tab label="Моя позиция" />
              <Tab label={`Документы (${profile.documents?.length ?? 0})`} />
              <Tab label={`Заявки (${profile.leaveRequests?.length ?? 0})`} />
            </Tabs>
            <CardContent>
              {tab === 0 && (
                <>
                  {profile.staffUnits && profile.staffUnits.length > 0 ? (
                    profile.staffUnits.map((u) => (
                      <Card variant="outlined" sx={{ mb: 2 }} key={u.id}>
                        <CardContent>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {u.position?.title}
                          </Typography>
                          <Typography color="text.secondary" gutterBottom>
                            {u.department?.name}
                          </Typography>
                          <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={6} sm={3}>
                              <Typography variant="caption" color="text.secondary">Оклад</Typography>
                              <Typography>{formatMoney(u.salary)}</Typography>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                              <Typography variant="caption" color="text.secondary">Ставка</Typography>
                              <Typography>{u.rate}</Typography>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                              <Typography variant="caption" color="text.secondary">График</Typography>
                              <Typography>{SCHEDULE_LABEL[u.workSchedule]}</Typography>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                              <Typography variant="caption" color="text.secondary">Статус</Typography>
                              <Box sx={{ mt: 0.5 }}>
                                <StatusChip status={u.status} variant="staff-unit" />
                              </Box>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Typography color="text.secondary">Вы не назначены ни на одну штатную единицу</Typography>
                  )}
                </>
              )}
              {tab === 1 && (
                <List>
                  {profile.documents && profile.documents.length > 0 ? (
                    profile.documents.map((d) => (
                      <ListItem key={d.id} divider>
                        <ListItemText
                          primary={`${DOCUMENT_TYPE_LABEL[d.type]}: ${d.number}`}
                          secondary={d.issueDate ? `Выдан ${formatDate(d.issueDate)}` : '—'}
                        />
                      </ListItem>
                    ))
                  ) : (
                    <Typography color="text.secondary">Документы отсутствуют</Typography>
                  )}
                </List>
              )}
              {tab === 2 && (
                <List>
                  {profile.leaveRequests && profile.leaveRequests.length > 0 ? (
                    profile.leaveRequests.map((lr) => (
                      <ListItem key={lr.id} divider>
                        <ListItemText
                          primary={`${LEAVE_TYPE_LABEL[lr.type]}: ${formatDate(lr.startDate)} — ${formatDate(lr.endDate)}`}
                          secondary={lr.reason ?? '—'}
                        />
                        <StatusChip status={lr.status} variant="leave" />
                      </ListItem>
                    ))
                  ) : (
                    <Typography color="text.secondary">Заявок не было</Typography>
                  )}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
