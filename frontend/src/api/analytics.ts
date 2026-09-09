import { api } from './client';
import {
  ApiResponse,
  PaginatedResponse,
  KPIs,
  VendorScorecard,
  DeliveryPerformance,
  DefectHeatmapItem,
  CycleTimePoint,
  BottleneckStage,
  InventoryStatus,
  BudgetUtilization,
  ProcurementPipelineItem,
  Alert,
} from '../types';

export const analyticsApi = {
  getKPIs: async (): Promise<KPIs> => {
    const res = await api.get<ApiResponse<KPIs>>('/analytics/kpis');
    return res.data.data;
  },

  getVendorScorecards: async (params?: { tier?: string }): Promise<VendorScorecard[]> => {
    const res = await api.get<ApiResponse<VendorScorecard[]>>('/analytics/vendor-scorecards', { params });
    return res.data.data;
  },

  getDeliveryPerformance: async (): Promise<DeliveryPerformance[]> => {
    const res = await api.get<ApiResponse<DeliveryPerformance[]>>('/analytics/delivery-performance');
    return res.data.data;
  },

  getDefectHeatmap: async (): Promise<DefectHeatmapItem[]> => {
    const res = await api.get<ApiResponse<DefectHeatmapItem[]>>('/analytics/defect-heatmap');
    return res.data.data;
  },

  getCycleTime: async (params?: { months?: number }): Promise<CycleTimePoint[]> => {
    const res = await api.get<ApiResponse<CycleTimePoint[]>>('/analytics/po-cycle-time', { params });
    return res.data.data;
  },

  getBottlenecks: async (): Promise<BottleneckStage[]> => {
    const res = await api.get<ApiResponse<BottleneckStage[]>>('/analytics/bottleneck');
    return res.data.data;
  },

  getInventoryStatus: async (params?: { riskLevel?: string }): Promise<InventoryStatus[]> => {
    const res = await api.get<ApiResponse<InventoryStatus[]>>('/analytics/inventory-status', { params });
    return res.data.data;
  },

  getBudgetUtilization: async (params?: { fiscalYear?: number }): Promise<BudgetUtilization[]> => {
    const res = await api.get<ApiResponse<BudgetUtilization[]>>('/analytics/budget-utilization', { params });
    return res.data.data;
  },

  getProcurementPipeline: async (): Promise<ProcurementPipelineItem[]> => {
    const res = await api.get<ApiResponse<ProcurementPipelineItem[]>>('/analytics/procurement-pipeline');
    return res.data.data;
  },

  getAlerts: async (params?: { isRead?: boolean | string; severity?: string; page?: number; limit?: number }) => {
    const res = await api.get<PaginatedResponse<Alert>>('/analytics/alerts', { params });
    return res.data;
  },

  acknowledgeAlert: async (id: number): Promise<Alert> => {
    const res = await api.patch<ApiResponse<Alert>>(`/analytics/alerts/${id}/read`);
    return res.data.data;
  },
};
