import { apiClient } from './client';
import type { LeaveRequestDto } from '@/types/models';

export const leavesApi = {
  async list(params: { status?: string; type?: string; employeeId?: number } = {}) {
    const { data } = await apiClient.get<LeaveRequestDto[]>('/leave-requests', { params });
    return data;
  },
  async create(input: {
    employeeId?: number;
    type: string;
    startDate: string;
    endDate: string;
    reason?: string;
  }) {
    const { data } = await apiClient.post<LeaveRequestDto>('/leave-requests', input);
    return data;
  },
  async decide(id: number, status: 'APPROVED' | 'REJECTED', decision?: string) {
    const { data } = await apiClient.post<LeaveRequestDto>(`/leave-requests/${id}/decision`, {
      status,
      decision,
    });
    return data;
  },
  async cancel(id: number) {
    const { data } = await apiClient.post<LeaveRequestDto>(`/leave-requests/${id}/cancel`, {});
    return data;
  },
};
