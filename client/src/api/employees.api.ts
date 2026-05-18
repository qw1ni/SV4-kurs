import { apiClient } from './client';
import type { EmployeeDto, EmployeeDocumentDto, PaginatedEmployees } from '@/types/models';

export interface EmployeesQuery {
  q?: string;
  status?: string;
  departmentId?: number;
  positionId?: number;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export const employeesApi = {
  async list(q: EmployeesQuery = {}) {
    const { data } = await apiClient.get<PaginatedEmployees>('/employees', { params: q });
    return data;
  },
  async get(id: number) {
    const { data } = await apiClient.get<EmployeeDto>(`/employees/${id}`);
    return data;
  },
  async myProfile() {
    const { data } = await apiClient.get<EmployeeDto>('/employees/me/profile');
    return data;
  },
  async create(input: Partial<EmployeeDto>) {
    const { data } = await apiClient.post<EmployeeDto>('/employees', input);
    return data;
  },
  async update(id: number, input: Partial<EmployeeDto>) {
    const { data } = await apiClient.put<EmployeeDto>(`/employees/${id}`, input);
    return data;
  },
  async remove(id: number) {
    await apiClient.delete(`/employees/${id}`);
  },
  async addDocument(employeeId: number, input: Partial<EmployeeDocumentDto>) {
    const { data } = await apiClient.post<EmployeeDocumentDto>(
      `/employees/${employeeId}/documents`,
      input
    );
    return data;
  },
  async removeDocument(employeeId: number, docId: number) {
    await apiClient.delete(`/employees/${employeeId}/documents/${docId}`);
  },
};
