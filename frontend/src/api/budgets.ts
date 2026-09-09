import { api } from './client';
import { ApiResponse, PaginatedResponse, Budget } from '../types';

export const budgetsApi = {
  list: async (params?: {
    page?: number;
    limit?: number;
    departmentId?: number;
    fiscalYear?: number;
    status?: string;
  }) => {
    const res = await api.get<PaginatedResponse<Budget>>('/budgets', { params });
    return res.data;
  },

  getById: async (id: number): Promise<Budget> => {
    const res = await api.get<ApiResponse<Budget>>(`/budgets/${id}`);
    return res.data.data;
  },

  create: async (data: {
    departmentId: number;
    fiscalYear: number;
    fiscalQuarter?: number;
    budgetName: string;
    totalAmount: number;
  }): Promise<Budget> => {
    const res = await api.post<ApiResponse<Budget>>('/budgets', data);
    return res.data.data;
  },

  update: async (id: number, data: Partial<Budget>): Promise<Budget> => {
    const res = await api.patch<ApiResponse<Budget>>(`/budgets/${id}`, data);
    return res.data.data;
  },

  listTransactions: async (id: number) => {
    const res = await api.get<PaginatedResponse<any>>(`/budgets/${id}/transactions`);
    return res.data;
  },

  createTransaction: async (
    id: number,
    data: { transactionType: 'allocation' | 'encumbrance' | 'expenditure' | 'adjustment'; amount: number; description?: string; poId?: number }
  ) => {
    const res = await api.post(`/budgets/${id}/transactions`, data);
    return res.data;
  },
};
