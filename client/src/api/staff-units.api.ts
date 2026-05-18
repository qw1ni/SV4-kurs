import { apiClient } from './client';
import type { StaffUnitDto, StaffingSummary } from '@/types/models';

export interface StaffUnitsQuery {
  departmentId?: number;
  positionId?: number;
  status?: string;
  schedule?: string;
  minSalary?: number;
  maxSalary?: number;
  q?: string;
}

export const staffUnitsApi = {
  async list(q: StaffUnitsQuery = {}) {
    const { data } = await apiClient.get<StaffUnitDto[]>('/staff-units', { params: q });
    return data;
  },
  async summary() {
    const { data } = await apiClient.get<StaffingSummary>('/staff-units/summary');
    return data;
  },
  async create(input: Partial<StaffUnitDto>) {
    const { data } = await apiClient.post<StaffUnitDto>('/staff-units', input);
    return data;
  },
  async update(id: number, input: Partial<StaffUnitDto>) {
    const { data } = await apiClient.put<StaffUnitDto>(`/staff-units/${id}`, input);
    return data;
  },
  async remove(id: number) {
    await apiClient.delete(`/staff-units/${id}`);
  },
  async assign(id: number, employeeId: number | null) {
    const { data } = await apiClient.post<StaffUnitDto>(`/staff-units/${id}/assign`, { employeeId });
    return data;
  },
};
