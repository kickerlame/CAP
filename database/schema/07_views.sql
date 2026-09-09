-- =============================================================
-- VPPT — Vendor & Procurement Performance Tracker
-- File: 07_views.sql
-- Purpose: Analytical MySQL views for dashboard, reports, and
--          analytics endpoints. Views compute nothing permanently —
--          they are live queries executed on demand.
-- Run after: 01–06 schema files.
-- =============================================================

USE vppt;

-- -------------------------------------------------------------
-- View: v_vendor_latest_snapshot
-- Returns the most recent performance snapshot per vendor.
-- Used by: vendor list page, vendor scorecard card.
-- -------------------------------------------------------------
CREATE OR REPLACE VIEW v_vendor_latest_snapshot AS
SELECT
    v.vendor_id,
    v.vendor_name,
    v.vendor_code,
    v.status        AS vendor_status,
    v.tier,
    v.overall_score,
    vps.snapshot_id,
    vps.snapshot_date,
    vps.sla_score,
    vps.delivery_score,
    vps.quality_score,
    vps.return_score,
    vps.weight_sla,
    vps.weight_delivery,
    vps.weight_quality,
    vps.weight_return,
    vps.po_count
FROM vendors v
LEFT JOIN vendor_performance_snapshots vps
    ON vps.snapshot_id = (
        SELECT snapshot_id
        FROM vendor_performance_snapshots
        WHERE vendor_id = v.vendor_id
        ORDER BY snapshot_date DESC
        LIMIT 1
    )
WHERE v.deleted_at IS NULL;


-- -------------------------------------------------------------
-- View: v_po_cycle_time
-- Computes total cycle time per PO (po_created_at → completed_at)
-- and per-stage durations from procurement_stage_logs.
-- Used by: procurement cycle time chart, bottleneck analysis.
-- -------------------------------------------------------------
CREATE OR REPLACE VIEW v_po_cycle_time AS
SELECT
    po.po_id,
    po.po_number,
    po.vendor_id,
    v.vendor_name,
    po.department_id,
    d.dept_name,
    po.status,
    po.po_created_at,
    po.completed_at,
    ROUND(
        TIMESTAMPDIFF(SECOND, po.po_created_at, po.completed_at) / 3600,
        2
    ) AS total_cycle_hours,
    ROUND(
        TIMESTAMPDIFF(SECOND, po.po_created_at, po.completed_at) / 86400,
        2
    ) AS total_cycle_days
FROM purchase_orders po
JOIN vendors v     ON po.vendor_id     = v.vendor_id
JOIN departments d ON po.department_id = d.department_id
WHERE po.status = 'completed'
  AND po.completed_at IS NOT NULL;


-- -------------------------------------------------------------
-- View: v_delivery_performance
-- One row per delivery with on-time flag and vendor info.
-- Used by: On-Time Delivery Rate chart (stacked bar by vendor).
-- -------------------------------------------------------------
CREATE OR REPLACE VIEW v_delivery_performance AS
SELECT
    del.delivery_id,
    po.po_id,
    po.po_number,
    po.vendor_id,
    v.vendor_name,
    po.department_id,
    d.dept_name,
    del.expected_date,
    del.actual_date,
    del.is_on_time,
    DATEDIFF(del.actual_date, del.expected_date) AS days_variance
FROM deliveries del
JOIN purchase_orders po ON del.po_id      = po.po_id
JOIN vendors v          ON po.vendor_id   = v.vendor_id
JOIN departments d      ON po.department_id = d.department_id
WHERE del.actual_date IS NOT NULL;


-- -------------------------------------------------------------
-- View: v_defect_heatmap
-- Aggregates defect rate by vendor × hardware category.
-- Used by: Defect/Return Rate heat map visualization.
-- -------------------------------------------------------------
CREATE OR REPLACE VIEW v_defect_heatmap AS
SELECT
    po.vendor_id,
    v.vendor_name,
    hi.category_id,
    hc.category_name,
    COUNT(DISTINCT qi.inspection_id)            AS inspection_count,
    SUM(qi.total_units_checked)                 AS total_units_checked,
    SUM(qi.units_rejected)                      AS total_units_rejected,
    ROUND(
        SUM(qi.units_rejected) /
        NULLIF(SUM(qi.total_units_checked), 0) * 100,
        2
    )                                           AS defect_rate_pct
FROM quality_inspections qi
JOIN purchase_orders po         ON qi.po_id        = po.po_id
JOIN purchase_order_items poi   ON poi.po_id        = po.po_id
JOIN hardware_items hi          ON poi.item_id      = hi.item_id
JOIN hardware_categories hc     ON hi.category_id  = hc.category_id
JOIN vendors v                  ON po.vendor_id     = v.vendor_id
GROUP BY
    po.vendor_id,
    v.vendor_name,
    hi.category_id,
    hc.category_name;


-- -------------------------------------------------------------
-- View: v_inventory_status
-- Current stock, computed risk metrics, and item details.
-- Used by: Inventory page, inventory report, critical stock KPI.
-- -------------------------------------------------------------
CREATE OR REPLACE VIEW v_inventory_status AS
SELECT
    inv.inventory_id,
    hi.item_id,
    hi.item_code,
    hi.item_name,
    hi.brand,
    hi.model,
    hc.category_id,
    hc.category_name,
    inv.current_stock,
    hi.safety_stock,
    hi.lead_time_days,
    inv.avg_daily_consumption       AS adc,
    inv.reorder_point,
    inv.estimated_days_remaining    AS days_remaining,
    inv.risk_level,
    inv.last_calculated_at,
    hi.unit_cost,
    ROUND(inv.current_stock * hi.unit_cost, 2) AS stock_value
FROM inventory inv
JOIN hardware_items hi      ON inv.item_id     = hi.item_id
JOIN hardware_categories hc ON hi.category_id  = hc.category_id
WHERE hi.is_active = 1;


-- -------------------------------------------------------------
-- View: v_budget_utilization
-- Budget spend vs. allocation per department per period.
-- Used by: Budget page, Spend vs Budget chart, budget report.
-- -------------------------------------------------------------
CREATE OR REPLACE VIEW v_budget_utilization AS
SELECT
    b.budget_id,
    b.budget_name,
    b.department_id,
    d.dept_name,
    b.fiscal_year,
    b.fiscal_quarter,
    b.total_amount,
    b.spent_amount,
    b.remaining_amount,
    ROUND(b.spent_amount / NULLIF(b.total_amount, 0) * 100, 2) AS utilization_pct,
    b.status
FROM budgets b
JOIN departments d ON b.department_id = d.department_id;


-- -------------------------------------------------------------
-- View: v_procurement_pipeline
-- Current state of all active PRs and POs in the system.
-- Used by: Procurement page, open PRs KPI, report.
-- -------------------------------------------------------------
CREATE OR REPLACE VIEW v_procurement_pipeline AS
SELECT
    pr.pr_id,
    pr.pr_number,
    pr.status           AS pr_status,
    pr.priority,
    pr.pr_created_at,
    pr.department_id,
    d.dept_name,
    u.full_name         AS requested_by,
    po.po_id,
    po.po_number,
    po.status           AS po_status,
    po.vendor_id,
    v.vendor_name,
    po.total_amount,
    po.po_created_at,
    po.completed_at,
    ROUND(
        TIMESTAMPDIFF(SECOND, po.po_created_at, NOW()) / 86400,
        1
    )                   AS days_since_po_created
FROM purchase_requisitions pr
JOIN departments d  ON pr.department_id  = d.department_id
JOIN users u        ON pr.requested_by_id = u.user_id
LEFT JOIN purchase_orders po ON po.pr_id = pr.pr_id
LEFT JOIN vendors v          ON po.vendor_id = v.vendor_id
WHERE pr.status NOT IN ('cancelled');


-- -------------------------------------------------------------
-- View: v_bottleneck_summary
-- Pre-aggregated stage durations across all completed POs.
-- Used by: Bottleneck analysis page (base query; filtered further
-- in the service layer using WHERE clauses on top of this view).
-- -------------------------------------------------------------
CREATE OR REPLACE VIEW v_bottleneck_summary AS
SELECT
    psl.stage_name,
    COUNT(*)                                AS transaction_count,
    ROUND(AVG(psl.duration_hours), 2)       AS avg_duration_hours,
    ROUND(MAX(psl.duration_hours), 2)       AS max_duration_hours,
    ROUND(MIN(psl.duration_hours), 2)       AS min_duration_hours,
    SUM(CASE
        WHEN psl.duration_hours > 48 THEN 1
        ELSE 0
    END)                                    AS delayed_count,
    ROUND(
        SUM(CASE WHEN psl.duration_hours > 48 THEN 1 ELSE 0 END)
        / NULLIF(COUNT(*), 0) * 100,
        2
    )                                       AS delay_pct
FROM procurement_stage_logs psl
WHERE psl.duration_hours IS NOT NULL
GROUP BY psl.stage_name;
