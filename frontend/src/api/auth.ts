import { api } from './client';
import { ApiResponse, AuthTokens, User } from '../types';

export const authApi = {
  login: async (credentials: {
    identifier?: string;
    username?: string;
    email?: string;
    password: string;
  }): Promise<AuthTokens> => {
    const identifier = credentials.identifier || credentials.username || credentials.email || '';
    const res = await api.post<ApiResponse<AuthTokens>>('/auth/login', {
      identifier,
      password: credentials.password,
    });
    return res.data.data;
  },

  refresh: async (refreshToken: string): Promise<{ accessToken: string }> => {
    const res = await api.post<ApiResponse<{ accessToken: string }>>('/auth/refresh', { refreshToken });
    return res.data.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  getMe: async (): Promise<User> => {
    const res = await api.get<ApiResponse<User>>('/auth/me');
    return res.data.data;
  },
};
