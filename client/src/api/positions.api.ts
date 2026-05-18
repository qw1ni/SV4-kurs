import { apiClient } from './client';
import type { PositionDto, SalaryRecordDto } from '@/types/models';

export const positionsApi = {
  async list(q?: string, category?: string) {
    const { data } = await apiClient.get<PositionDto[]>('/positions', {
      params: { q, category },
    });
    return data;
  },
  async get(id: number) {
    const { data } = await apiClient.get<PositionDto>(`/positions/${id}`);
    return data;
  },
  async create(input: Partial<PositionDto>) {
    const { data } = await apiClient.post<PositionDto>('/positions', input);
    return data;
  },
  async update(id: number, input: Partial<PositionDto>) {
    const { data } = await apiClient.put<PositionDto>(`/positions/${id}`, input);
    return data;
  },
  async remove(id: number) {
    await apiClient.delete(`/positions/${id}`);
  },
  async addSalary(positionId: number, input: Partial<SalaryRecordDto> & { baseSalary: number; effectiveFrom: string }) {
    const { data } = await apiClient.post<SalaryRecordDto>(`/positions/${positionId}/salary`, input);
    return data;
  },
};
