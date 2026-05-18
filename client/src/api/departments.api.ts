import { apiClient } from './client';
import type { DepartmentDto } from '@/types/models';

export const departmentsApi = {
  async list(q?: string) {
    const { data } = await apiClient.get<DepartmentDto[]>('/departments', { params: { q } });
    return data;
  },
  async tree() {
    const { data } = await apiClient.get<DepartmentDto[]>('/departments/tree');
    return data;
  },
  async get(id: number) {
    const { data } = await apiClient.get<DepartmentDto>(`/departments/${id}`);
    return data;
  },
  async create(input: Partial<DepartmentDto>) {
    const { data } = await apiClient.post<DepartmentDto>('/departments', input);
    return data;
  },
  async update(id: number, input: Partial<DepartmentDto>) {
    const { data } = await apiClient.put<DepartmentDto>(`/departments/${id}`, input);
    return data;
  },
  async remove(id: number) {
    await apiClient.delete(`/departments/${id}`);
  },
};
