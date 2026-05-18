import { useEffect, useMemo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { loadCurrentUser } from '@/features/auth/authSlice';
import { getAuthToken } from '@/api/client';
import { buildTheme } from '@/theme/theme';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';

import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { EmployeesPage } from '@/pages/EmployeesPage';
import { EmployeeDetailPage } from '@/pages/EmployeeDetailPage';
import { DepartmentsPage } from '@/pages/DepartmentsPage';
import { PositionsPage } from '@/pages/PositionsPage';
import { StaffingPage } from '@/pages/StaffingPage';
import { LeaveRequestsPage } from '@/pages/LeaveRequestsPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { SettingsPage } from '@/pages/SettingsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export function App() {
  const dispatch = useAppDispatch();
  const mode = useAppSelector((s) => s.ui.mode);
  const theme = useMemo(() => buildTheme(mode), [mode]);

  useEffect(() => {
    if (getAuthToken()) {
      dispatch(loadCurrentUser());
    }
  }, [dispatch]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />

          <Route
            path="/employees"
            element={
              <ProtectedRoute roles={['HR_MANAGER']}>
                <EmployeesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employees/:id"
            element={
              <ProtectedRoute roles={['HR_MANAGER']}>
                <EmployeeDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/departments"
            element={
              <ProtectedRoute roles={['HR_MANAGER']}>
                <DepartmentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/positions"
            element={
              <ProtectedRoute roles={['HR_MANAGER']}>
                <PositionsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/staffing" element={<StaffingPage />} />
          <Route path="/leaves" element={<LeaveRequestsPage />} />
          <Route
            path="/reports"
            element={
              <ProtectedRoute roles={['HR_MANAGER']}>
                <ReportsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </ThemeProvider>
  );
}
