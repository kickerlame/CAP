import { api } from './client';
import { ApiResponse, PaginatedResponse, InventoryItem, HardwareItem, RiskLevel } from '../types';

export const inventoryApi = {
  list: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    riskLevel?: RiskLevel | string;
    categoryId?: number;
  }) => {
    const res = await api.get<PaginatedResponse<InventoryItem>>('/inventory', { params });
    return res.data;
  },

  getById: async (id: number): Promise<InventoryItem> => {
    const res = await api.get<ApiResponse<InventoryItem>>(`/inventory/${id}`);
    return res.data.data;
  },

  recalculate: async (id: number): Promise<InventoryItem> => {
    const res = await api.patch<ApiResponse<InventoryItem>>(`/inventory/${id}/recalculate`);
    return res.data.data;
  },

  listHardwareItems: async (params?: { categoryId?: number; isActive?: boolean | string }) => {
    const res = await api.get<ApiResponse<HardwareItem[]>>('/inventory/hardware-items', { params });
    return res.data.data;
  },

  listCategories: async () => {
    const res = await api.get<ApiResponse<Array<{ category_id: number; category_name: string; description: string }>>>(
      '/inventory/hardware-categories'
    );
    return res.data.data;
  },

  listTransactions: async (id: number, params?: { page?: number; limit?: number }) => {
    const res = await api.get<PaginatedResponse<any>>(`/inventory/${id}/transactions`, { params });
    return res.data;
  },

  createTransaction: async (
    id: number,
    data: {
      transactionType?: 'in' | 'out' | 'adjustment' | 'IN' | 'OUT' | 'ADJUSTMENT';
      txnType?: string;
      quantity?: number;
      newStock?: number;
      notes?: string;
      referencePoId?: number;
    }
  ) => {
    const rawType = data.txnType || data.transactionType || 'IN';
    const payload = {
      txnType: rawType.toUpperCase(),
      transactionType: rawType.toUpperCase(),
      quantity: data.quantity,
      newStock: data.newStock,
      notes: data.notes,
      referenceId: data.referencePoId,
    };
    const res = await api.post(`/inventory/${id}/transactions`, payload);
    return res.data;
  },
};
