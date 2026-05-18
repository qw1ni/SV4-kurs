import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import BadgeIcon from '@mui/icons-material/Badge';
import PaidIcon from '@mui/icons-material/Paid';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PageHeader } from '@/components/common/PageHeader';
import { staffUnitsApi } from '@/api/staff-units.api';
import type { StaffingSummary } from '@/types/models';
import { EMPLOYEE_STATUS_LABEL, formatMoney } from '@/utils/format';
import { useAppSelector } from '@/app/hooks';

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#2e7d32',
  VACATION: '#0288d1',
  SICK_LEAVE: '#ed6c02',
  DISMISSED: '#9e9e9e',
};

function StatCard({
  icon,
  label,
  value,
  hint,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  color: string;
}) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box
            sx={{
              width: 52,
              height: 52,
              bgcolor: `${color}20`,
              color,
              borderRadius: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700 }} noWrap>
              {value}
            </Typography>
            {hint && (
              <Typography variant="caption" color="text.secondary">
                {hint}
              </Typography>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const { user } = useAppSelector((s) => s.auth);
  const [summary, setSummary] = useState<StaffingSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    staffUnitsApi
      .summary()
      .then(setSummary)
      .finally(() => setLoading(false));
  }, []);

  const fillRate = summary && summary.totalUnits > 0
    ? Math.round((summary.occupied / summary.totalUnits) * 100)
    : 0;

  return (
    <Box>
      <PageHeader
        title={`Здравствуйте, ${user?.employee?.firstName ?? ''}!`}
        subtitle={
          user?.role === 'HR_MANAGER'
            ? 'Сводка по штатному расписанию организации'
            : 'Сводка по вашему подразделению'
        }
      />

      {loading || !summary ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={<WorkOutlineIcon />}
                label="Всего штатных единиц"
                value={summary.totalUnits.toString()}
                color="#1976d2"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={<PeopleIcon />}
                label="Занято"
                value={summary.occupied.toString()}
                hint={`${fillRate}% укомплектованности`}
                color="#2e7d32"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={<BadgeIcon />}
                label="Вакансий"
                value={summary.vacant.toString()}
                color="#ed6c02"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={<PaidIcon />}
                label="Фонд оплаты труда"
                value={formatMoney(summary.totalPayroll)}
                hint="Текущий месяц"
                color="#7c4dff"
              />
            </Grid>
          </Grid>

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Укомплектованность штата
              </Typography>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={fillRate}
                    sx={{ height: 12, borderRadius: 1 }}
                  />
                </Box>
                <Typography variant="h6" sx={{ minWidth: 56, textAlign: 'right' }}>
                  {fillRate}%
                </Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                {summary.occupied} из {summary.totalUnits} штатных единиц укомплектовано
              </Typography>
            </CardContent>
          </Card>

          <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={7}>
              <Card sx={{ height: 380 }}>
                <CardContent sx={{ height: '100%' }}>
                  <Typography variant="h6" gutterBottom>
                    ФОТ по подразделениям
                  </Typography>
                  <ResponsiveContainer width="100%" height="88%">
                    <BarChart
                      data={summary.byDepartment.slice(0, 10)}
                      layout="vertical"
                      margin={{ left: 0, right: 16, top: 8, bottom: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tickFormatter={(v) => `${Math.round(v / 1000)}к`} />
                      <YAxis
                        type="category"
                        dataKey="departmentName"
                        width={170}
                        tick={{ fontSize: 12 }}
                      />
                      <ChartTooltip
                        formatter={(v: number) => formatMoney(v)}
                        labelStyle={{ color: '#000' }}
                      />
                      <Bar dataKey="totalSalary" fill="#1976d2" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={5}>
              <Card sx={{ height: 380 }}>
                <CardContent sx={{ height: '100%' }}>
                  <Typography variant="h6" gutterBottom>
                    Распределение сотрудников
                  </Typography>
                  <ResponsiveContainer width="100%" height="88%">
                    <PieChart>
                      <Pie
                        data={summary.employeesByStatus.map((s) => ({
                          name: EMPLOYEE_STATUS_LABEL[s.status] ?? s.status,
                          value: s.count,
                          status: s.status,
                        }))}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={90}
                        label
                      >
                        {summary.employeesByStatus.map((s) => (
                          <Cell key={s.status} fill={STATUS_COLORS[s.status] ?? '#888'} />
                        ))}
                      </Pie>
                      <ChartTooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}
