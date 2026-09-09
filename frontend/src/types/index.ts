// ============================================================
// VPPT — src/types/index.ts
// Central TypeScript interfaces matching API response shapes.
// ============================================================

export interface User {
  userId: number;
  username: string;
  email: string;
  fullName: string;
  isActive: boolean;
  lastLoginAt: string | null;
  role: { roleId: number; roleName: string };
  department: { departmentId: number; deptName: string; deptCode: string } | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: {
    userId: number;
    username: string;
    email: string;
    fullName: string;
    roleId: number;
    roleName: string;
  };
}

// ─── Vendors ─────────────────────────────────────────────────
export interface Vendor {
  vendor_id: number;
  vendor_code: string;
  vendor_name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  country: string | null;
  registration_number: string | null;
  status: 'active' | 'inactive' | 'probation';
  tier?: string;
  overall_score?: number;
  is_active?: boolean;
  created_at: string;
}

export interface VendorSnapshot {
  snapshot_id: number;
  vendor_id: number;
  snapshot_date: string;
  sla_score: number;
  delivery_score: number;
  quality_score: number;
  return_score: number;
  overall_score: number;
  tier: 'Platinum' | 'Gold' | 'Silver' | 'Bronze' | 'Probation';
  weight_sla: number;
  weight_delivery: number;
  weight_quality: number;
  weight_return: number;
  po_count: number;
}

export interface VendorSLA {
  sla_id: number;
  vendor_id: number;
  contract_start_date: string;
  contract_end_date: string | null;
  delivery_lead_time_days: number;
  sla_on_time_delivery_pct: number;
  sla_defect_rate_pct: number;
  sla_fill_rate_pct: number;
  payment_terms_days: number;
  is_current: boolean;
}

export interface VendorScorecard {
  vendor_id: number;
  vendor_name: string;
  vendor_code: string;
  tier: string;
  overall_score: number;
  sla_score: number;
  delivery_score: number;
  quality_score: number;
  return_score: number;
  weight_sla: number;
  weight_delivery: number;
  weight_quality: number;
  weight_return: number;
  po_count: number;
  snapshot_date: string;
}

// ─── Procurement ─────────────────────────────────────────────
export type PRStatus = 'draft' | 'under_review' | 'dept_approved' | 'procurement_approved' | 'converted_to_po' | 'rejected' | 'cancelled';
export type POStatus = 'pending' | 'acknowledged' | 'processing' | 'shipped' | 'delivered' | 'inspected' | 'completed' | 'cancelled';

export interface PurchaseRequisition {
  pr_id: number;
  pr_number: string;
  status: PRStatus;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  total_estimated_cost: number | null;
  pr_created_at: string;
  dept_name: string;
  requested_by: string;
  notes: string | null;
  items?: PRItem[];
}

export interface PRItem {
  pri_id: number;
  pr_id: number;
  item_id: number;
  item_name: string;
  item_code: string;
  quantity_requested: number;
  estimated_unit_cost: number | null;
  justification: string | null;
}

export interface PurchaseOrder {
  po_id: number;
  po_number: string;
  status: POStatus;
  total_amount: number;
  po_created_at: string;
  completed_at: string | null;
  expected_delivery_date: string | null;
  vendor_name: string;
  dept_name: string;
  notes: string | null;
  items?: POItem[];
  stages?: StageLog[];
  delivery?: Delivery | null;
  inspection?: QualityInspection | null;
}

export interface POItem {
  poi_id: number;
  po_id: number;
  item_id: number;
  item_name: string;
  item_code: string;
  quantity_ordered: number;
  unit_price: number;
  total_price: number;
  quantity_rejected: number;
}

export interface StageLog {
  stage_log_id: number;
  po_id: number;
  stage_name: string;
  entered_at: string;
  exited_at: string | null;
  duration_hours: number | null;
  notes: string | null;
}

export interface Delivery {
  delivery_id: number;
  po_id: number;
  expected_date: string | null;
  actual_date: string | null;
  is_on_time: number | null;
  courier: string | null;
  tracking_number: string | null;
  received_by_id: number | null;
}

export interface QualityInspection {
  inspection_id: number;
  po_id: number;
  inspection_date: string;
  total_units_checked: number;
  units_passed: number;
  units_rejected: number;
  defect_rate_pct: number;
  outcome: 'accepted' | 'partially_accepted' | 'rejected';
  notes: string | null;
}

// ─── Inventory ────────────────────────────────────────────────
export type RiskLevel = 'normal' | 'warning' | 'critical' | 'out_of_stock';

export interface InventoryItem {
  inventory_id: number;
  item_id: number;
  item_name: string;
  item_code: string;
  category_name: string;
  current_stock: number;
  unit_of_measure: string;
  reorder_point: number;
  lead_time_days: number;
  avg_daily_consumption: number | null;
  days_remaining: number | null;
  estimated_days_remaining?: number | null;
  risk_level: RiskLevel;
  last_transaction_date: string | null;
}

export interface InventoryStatus {
  inventory_id: number;
  item_name: string;
  item_code: string;
  category_name: string;
  current_stock: number;
  reorder_point: number;
  avg_daily_consumption: number | null;
  days_remaining: number | null;
  estimated_days_remaining?: number | null;
  risk_level: RiskLevel;
  unit_value: number | null;
  stock_value: number | null;
}

export interface HardwareItem {
  item_id: number;
  item_name: string;
  item_code: string;
  category_id: number;
  category_name: string;
  unit_of_measure: string;
  unit_cost: number | null;
  is_active: boolean;
}

// ─── Budgets ──────────────────────────────────────────────────
export interface Budget {
  budget_id: number;
  department_id: number;
  dept_name: string;
  fiscal_year: number;
  fiscal_quarter: number | null;
  budget_name: string;
  total_amount: number;
  spent_amount: number;
  remaining_amount: number;
  status: 'active' | 'closed' | 'draft';
  created_at: string;
}

export interface BudgetUtilization {
  budget_id: number;
  budget_name: string;
  dept_name: string;
  fiscal_year: number;
  fiscal_quarter: number | null;
  total_amount: number;
  spent_amount: number;
  remaining_amount: number;
  utilization_pct: number;
  status: string;
}

// ─── Analytics ────────────────────────────────────────────────
export interface KPIs {
  openPRs?: number;
  openPOs?: number;
  criticalStockItems?: number;
  avgCycleDays?: string | number;
  avgBudgetUtilPct?: string | number;
  onTimeDeliveryPct?: string | number;
  unresolvedAlerts?: number;
  totalVendors?: number;
  activeVendors?: number;
  onTimeDeliveryRate?: number;
  avgCycleTimeDays?: number;
  totalSpend?: number;
  avgBudgetUtilization?: number;
  openRequisitions?: number;
}

export interface DeliveryPerformance {
  vendor_id: number;
  vendor_name: string;
  total_deliveries: number;
  on_time: number;
  late: number;
  on_time_rate: number;
}

export interface DefectHeatmapItem {
  vendor_id: number;
  vendor_name: string;
  category_id?: number;
  category_name: string;
  total_inspections?: number;
  avg_defect_rate?: number | string;
  inspection_count?: number;
  total_units_checked?: number | string;
  total_units_rejected?: number | string;
  defect_rate_pct?: number | string;
}

export interface CycleTimePoint {
  period: string;
  avg_cycle_days: number | string;
  po_count: number;
}

export interface BottleneckStage {
  stage_name: string;
  avg_duration_hours: number | string;
  max_duration_hours: number | string;
  min_duration_hours?: number | string;
  occurrence_count?: number;
  transaction_count?: number;
  delayed_count?: number | string;
  delay_pct?: number | string;
}

export interface ProcurementPipelineItem {
  pr_id?: number;
  pr_number?: string;
  pr_status?: PRStatus | string;
  priority?: string;
  po_id: number | null;
  po_number: string | null;
  vendor_id?: number | null;
  vendor_name: string | null;
  status?: POStatus;
  po_status?: POStatus | string | null;
  total_amount: number | null;
  po_created_at: string | null;
  completed_at?: string | null;
  expected_delivery_date?: string | null;
  days_in_current_stage?: number | null;
  days_since_po_created?: number | null;
}

// ─── Alerts ───────────────────────────────────────────────────
export type AlertType = 'critical_stock' | 'reorder_required' | 'sla_failure' | 'budget_exceeded' | 'procurement_delay' | 'high_defect_rate';
export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface Alert {
  alert_id: number;
  alert_type: AlertType;
  severity: AlertSeverity;
  entity_type: string;
  entity_id: number | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

// ─── Pagination ───────────────────────────────────────────────
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: { total: number; page: number; limit: number };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}
