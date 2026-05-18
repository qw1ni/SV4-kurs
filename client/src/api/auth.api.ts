import { apiClient } from './client';
import type { UserDto, UserRole } from '@/types/models';

export interface LoginResponse {
  token: string;
  user: UserDto;
}

export const authApi = {
  async login(email: string, password: string) {
    const { data } = await apiClient.post<LoginResponse>('/auth/login', { email, password });
    return data;
  },

  async register(input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    role?: UserRole;
  }) {
    const { data } = await apiClient.post<LoginResponse>('/auth/register', input);
    return data;
  },

  async me() {
    const { data } = await apiClient.get<UserDto>('/auth/me');
    return data;
  },

  async changePassword(currentPassword: string, newPassword: string) {
    await apiClient.post('/auth/change-password', { currentPassword, newPassword });
  },
};
