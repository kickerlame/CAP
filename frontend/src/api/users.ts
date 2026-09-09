import { api } from './client';
import { ApiResponse, PaginatedResponse, User } from '../types';

export interface Department {
  department_id: number;
  dept_name: string;
  dept_code: string;
}

export interface Role {
  role_id: number;
  role_name: string;
  description: string;
}

export const usersApi = {
  list: async (params?: { page?: number; limit?: number; search?: string; roleId?: number; deptId?: number }) => {
    const res = await api.get<PaginatedResponse<User>>('/users', { params });
    return res.data;
  },

  getById: async (id: number): Promise<User> => {
    const res = await api.get<ApiResponse<User>>(`/users/${id}`);
    return res.data.data;
  },

  getDepartments: async (): Promise<Department[]> => {
    const res = await api.get<ApiResponse<Department[]>>('/users/departments/list');
    return res.data.data;
  },

  getRoles: async (): Promise<Role[]> => {
    const res = await api.get<ApiResponse<Role[]>>('/users/roles/list');
    return res.data.data;
  },
};
