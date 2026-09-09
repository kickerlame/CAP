import { api } from './client';
import { ApiResponse, PaginatedResponse, Vendor, VendorSnapshot, VendorSLA } from '../types';

export const vendorsApi = {
  list: async (params?: { page?: number; limit?: number; search?: string; status?: string; tier?: string; isActive?: boolean | string }) => {
    const res = await api.get<PaginatedResponse<Vendor>>('/vendors', { params });
    return res.data;
  },

  getById: async (id: number): Promise<Vendor> => {
    const res = await api.get<ApiResponse<Vendor>>(`/vendors/${id}`);
    return res.data.data;
  },

  create: async (data: Partial<Vendor>): Promise<Vendor> => {
    const res = await api.post<ApiResponse<Vendor>>('/vendors', data);
    return res.data.data;
  },

  update: async (id: number, data: Partial<Vendor>): Promise<Vendor> => {
    const res = await api.patch<ApiResponse<Vendor>>(`/vendors/${id}`, data);
    return res.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/vendors/${id}`);
  },

  getSnapshots: async (id: number, limit?: number): Promise<VendorSnapshot[]> => {
    const res = await api.get<ApiResponse<VendorSnapshot[]>>(`/vendors/${id}/snapshots`, {
      params: { limit },
    });
    return res.data.data;
  },

  recalculateScore: async (id: number): Promise<VendorSnapshot> => {
    const res = await api.post<ApiResponse<VendorSnapshot>>(`/vendors/${id}/snapshots`);
    return res.data.data;
  },

  getSLA: async (id: number): Promise<VendorSLA> => {
    const res = await api.get<ApiResponse<VendorSLA>>(`/vendors/${id}/sla`);
    return res.data.data;
  },

  saveSLA: async (id: number, data: Partial<VendorSLA>): Promise<VendorSLA> => {
    const res = await api.post<ApiResponse<VendorSLA>>(`/vendors/${id}/sla`, data);
    return res.data.data;
  },
};
