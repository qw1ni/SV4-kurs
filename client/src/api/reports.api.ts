import { apiClient } from './client';

async function downloadBlob(path: string, filename: string) {
  const response = await apiClient.get(path, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export const reportsApi = {
  downloadStaffing: () =>
    downloadBlob('/reports/staffing.xlsx', `staffing_${new Date().toISOString().slice(0, 10)}.xlsx`),
  downloadEmployees: () =>
    downloadBlob('/reports/employees.xlsx', `employees_${new Date().toISOString().slice(0, 10)}.xlsx`),
  downloadPayrollPdf: () =>
    downloadBlob('/reports/payroll.pdf', `payroll_${new Date().toISOString().slice(0, 10)}.pdf`),
};
