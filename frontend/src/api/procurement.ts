import { api } from './client';
import {
  ApiResponse,
  PaginatedResponse,
  PurchaseRequisition,
  PurchaseOrder,
  StageLog,
  PRStatus,
  POStatus,
} from '../types';

export const procurementApi = {
  // Requisitions
  listRequisitions: async (params?: {
    page?: number;
    limit?: number;
    status?: PRStatus | string;
    priority?: string;
    departmentId?: number;
  }) => {
    const res = await api.get<PaginatedResponse<PurchaseRequisition>>('/procurement/requisitions', { params });
    return res.data;
  },

  getRequisition: async (id: number): Promise<PurchaseRequisition> => {
    const res = await api.get<ApiResponse<PurchaseRequisition>>(`/procurement/requisitions/${id}`);
    return res.data.data;
  },

  createRequisition: async (data: {
    departmentId: number;
    priority?: string;
    notes?: string;
    items: Array<{ itemId: number; quantityRequested: number; estimatedUnitCost?: number; justification?: string }>;
  }): Promise<PurchaseRequisition> => {
    const res = await api.post<ApiResponse<PurchaseRequisition>>('/procurement/requisitions', data);
    return res.data.data;
  },

  updateRequisitionStatus: async (
    id: number,
    status: PRStatus,
    rejectionReason?: string
  ): Promise<PurchaseRequisition> => {
    const res = await api.patch<ApiResponse<PurchaseRequisition>>(`/procurement/requisitions/${id}/status`, {
      status,
      rejectionReason,
    });
    return res.data.data;
  },

  // Purchase Orders
  listOrders: async (params?: {
    page?: number;
    limit?: number;
    status?: POStatus | string;
    vendorId?: number;
    departmentId?: number;
  }) => {
    const res = await api.get<PaginatedResponse<PurchaseOrder>>('/procurement/orders', { params });
    return res.data;
  },

  getOrder: async (id: number): Promise<PurchaseOrder> => {
    const res = await api.get<ApiResponse<PurchaseOrder>>(`/procurement/orders/${id}`);
    return res.data.data;
  },

  createOrder: async (data: {
    vendorId: number;
    prId?: number;
    departmentId: number;
    expectedDeliveryDate?: string;
    notes?: string;
    items: Array<{ itemId: number; quantityOrdered: number; unitPrice: number }>;
  }): Promise<PurchaseOrder> => {
    const res = await api.post<ApiResponse<PurchaseOrder>>('/procurement/orders', data);
    return res.data.data;
  },

  updateOrderStatus: async (id: number, status: POStatus): Promise<PurchaseOrder> => {
    const res = await api.patch<ApiResponse<PurchaseOrder>>(`/procurement/orders/${id}/status`, { status });
    return res.data.data;
  },

  getOrderStages: async (id: number): Promise<StageLog[]> => {
    const res = await api.get<ApiResponse<StageLog[]>>(`/procurement/orders/${id}/stages`);
    return res.data.data;
  },

  recordDelivery: async (id: number, data: { actualDate: string; courier?: string; trackingNumber?: string }) => {
    const res = await api.post(`/procurement/orders/${id}/delivery`, data);
    return res.data;
  },

  recordInspection: async (
    id: number,
    data: { unitsPassed: number; unitsRejected: number; outcome: string; notes?: string }
  ) => {
    const res = await api.post(`/procurement/orders/${id}/inspection`, data);
    return res.data;
  },

  recordReturn: async (id: number, data: { itemId: number; quantityReturned: number; returnReason: string }) => {
    const res = await api.post(`/procurement/orders/${id}/returns`, data);
    return res.data;
  },
};
