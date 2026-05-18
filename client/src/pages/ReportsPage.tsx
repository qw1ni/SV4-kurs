import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  Typography,
  Avatar,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import TableViewIcon from '@mui/icons-material/TableView';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import PeopleIcon from '@mui/icons-material/People';
import { PageHeader } from '@/components/common/PageHeader';
import { reportsApi } from '@/api/reports.api';
import { useAppDispatch } from '@/app/hooks';
import { showSnackbar } from '@/features/ui/uiSlice';

interface ReportCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  format: string;
  action: () => Promise<void>;
}

function ReportCard({ title, description, icon, color, format, action }: ReportCardProps) {
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();

  const handle = async () => {
    setLoading(true);
    try {
      await action();
      dispatch(showSnackbar({ message: 'Отчёт сформирован', severity: 'success' }));
    } catch {
      dispatch(showSnackbar({ message: 'Не удалось сформировать отчёт', severity: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <Avatar sx={{ bgcolor: `${color}20`, color, width: 56, height: 56 }} variant="rounded">
            {icon}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              {description}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Typography variant="caption" sx={{ bgcolor: 'action.hover', px: 1, py: 0.25, borderRadius: 0.5 }}>
                {format}
              </Typography>
            </Stack>
          </Box>
        </Stack>
        <Box sx={{ mt: 2 }}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handle}
            disabled={loading}
          >
            {loading ? 'Формируется…' : 'Скачать'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

export function ReportsPage() {
  return (
    <Box>
      <PageHeader
        title="Отчёты"
        subtitle="Формирование документов по штатному расписанию"
        crumbs={[{ label: 'Отчёты' }]}
      />

      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} md={4}>
          <ReportCard
            title="Штатное расписание"
            description="Полный отчёт по штатным единицам с фильтрацией по подразделениям, должностям и окладам"
            icon={<TableViewIcon />}
            color="#2e7d32"
            format="XLSX"
            action={reportsApi.downloadStaffing}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <ReportCard
            title="Список сотрудников"
            description="Полный реестр сотрудников с контактной информацией, должностями и подразделениями"
            icon={<PeopleIcon />}
            color="#1976d2"
            format="XLSX"
            action={reportsApi.downloadEmployees}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <ReportCard
            title="Фонд оплаты труда"
            description="Сводный отчёт по ФОТ в разрезе подразделений на текущую дату"
            icon={<PictureAsPdfIcon />}
            color="#d32f2f"
            format="PDF"
            action={reportsApi.downloadPayrollPdf}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
