-- =============================================================
-- VPPT — Vendor & Procurement Performance Tracker
-- File: 06_analytics_support.sql
-- Purpose: alerts, audit_logs, system_settings
-- Run after: 01_users_roles.sql
-- =============================================================

USE vppt;

-- -------------------------------------------------------------
-- Table: alerts
-- System-generated alert records. Created by alert.service.ts
-- when database conditions cross defined thresholds.
-- entity_type + entity_id form a soft polymorphic reference
-- (not enforced as FK) so one table covers all entity types.
-- is_read tracks acknowledgement; resolved_at tracks resolution.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alerts (
    alert_id    INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    alert_type  ENUM(
                    'critical_stock',
                    'reorder_required',
                    'stock_depletion',
                    'procurement_delay',
                    'sla_failure',
                    'budget_exceeded',
                    'high_defect_rate'
                )               NOT NULL,
    severity    ENUM(
                    'info',
                    'warning',
                    'critical'
                )               NOT NULL DEFAULT 'warning',
    entity_type VARCHAR(50)         NULL DEFAULT NULL
                COMMENT 'The table/entity that triggered the alert, e.g. inventory, vendor',
    entity_id   INT UNSIGNED        NULL DEFAULT NULL
                COMMENT 'Primary key of the affected record',
    message     TEXT            NOT NULL
                COMMENT 'Human-readable description of the alert condition',
    is_read     TINYINT(1)      NOT NULL DEFAULT 0,
    read_by_id  INT UNSIGNED        NULL DEFAULT NULL,
    read_at     DATETIME            NULL DEFAULT NULL,
    resolved_at DATETIME            NULL DEFAULT NULL
                COMMENT 'When the underlying condition was corrected',
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_alerts            PRIMARY KEY  (alert_id),
    CONSTRAINT fk_alert_reader      FOREIGN KEY  (read_by_id)
        REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE SET NULL,

    INDEX idx_alert_type            (alert_type),
    INDEX idx_alert_severity        (severity),
    INDEX idx_alert_entity          (entity_type, entity_id),
    INDEX idx_alert_is_read         (is_read),
    INDEX idx_alert_resolved        (resolved_at),
    INDEX idx_alert_created_at      (created_at)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='System-generated alerts. Polymorphic entity_type/entity_id covers all source tables.';


-- -------------------------------------------------------------
-- Table: audit_logs
-- Full audit trail of all significant user actions.
-- Uses BIGINT PK because this table grows rapidly.
-- old_values/new_values are JSON snapshots captured by the
-- service layer before and after the change.
-- user_id is nullable to support system-generated audit entries.
-- ip_address supports both IPv4 (15 chars) and IPv6 (39 chars).
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    log_id      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id     INT UNSIGNED        NULL DEFAULT NULL
                COMMENT 'NULL for system-generated entries',
    action      VARCHAR(80)     NOT NULL
                COMMENT 'e.g. CREATE_PR, APPROVE_PO, UPDATE_VENDOR, LOGIN',
    entity_type VARCHAR(50)         NULL DEFAULT NULL
                COMMENT 'Table/domain affected, e.g. purchase_requisitions',
    entity_id   INT UNSIGNED        NULL DEFAULT NULL
                COMMENT 'PK of the affected record',
    old_values  JSON                NULL DEFAULT NULL
                COMMENT 'Snapshot of the record before the change',
    new_values  JSON                NULL DEFAULT NULL
                COMMENT 'Snapshot of the record after the change',
    ip_address  VARCHAR(45)         NULL DEFAULT NULL
                COMMENT 'IPv4 or IPv6 address of the requester',
    user_agent  TEXT                NULL DEFAULT NULL,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_audit_logs        PRIMARY KEY  (log_id),
    CONSTRAINT fk_audit_user        FOREIGN KEY  (user_id)
        REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE SET NULL,

    INDEX idx_audit_user            (user_id),
    INDEX idx_audit_action          (action),
    INDEX idx_audit_entity          (entity_type, entity_id),
    INDEX idx_audit_created_at      (created_at)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Full action audit trail. BIGINT PK for high row volume.';


-- -------------------------------------------------------------
-- Table: system_settings
-- Key-value store for administrator-configurable parameters.
-- setting_value is JSON for flexibility (scalars, objects, arrays).
--
-- Pre-defined keys used by the application:
--   vendor_score_weights      → { "sla":0.40, "delivery":0.30,
--                                 "quality":0.20, "return":0.10 }
--   default_currency          → "PHP"
--   adc_window_days           → 90
--   bottleneck_delay_threshold_hours → 48
--   reorder_safety_buffer_pct → 10
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS system_settings (
    setting_id      INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    setting_key     VARCHAR(80)     NOT NULL,
    setting_value   JSON            NOT NULL,
    description     TEXT                NULL DEFAULT NULL,
    updated_by_id   INT UNSIGNED        NULL DEFAULT NULL,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
                                    ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_settings          PRIMARY KEY  (setting_id),
    CONSTRAINT uq_setting_key       UNIQUE       (setting_key),
    CONSTRAINT fk_settings_user     FOREIGN KEY  (updated_by_id)
        REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Configurable system parameters. Vendor score weights read from here at runtime.';


-- ---------------------------------------------------------------
-- Seed default system_settings (application defaults)
-- These rows are expected to exist before the backend starts.
-- The seed data scripts (Phase 3) will INSERT these if not present.
-- Listed here as documentation of the expected keys.
-- ---------------------------------------------------------------
-- INSERT IGNORE INTO system_settings (setting_key, setting_value, description)
-- VALUES
--   ('vendor_score_weights',
--    '{"sla": 0.40, "delivery": 0.30, "quality": 0.20, "return": 0.10}',
--    'Vendor performance scorecard weights. Must sum to 1.00.'),
--   ('default_currency',
--    '"MYR"',
--    'ISO 4217 currency code used across the application.'),
--   ('adc_window_days',
--    '90',
--    'Number of days used in the Average Daily Consumption rolling window.'),
--   ('bottleneck_delay_threshold_hours',
--    '48',
--    'Hours per stage above which a transaction is counted as delayed.'),
--   ('reorder_safety_buffer_pct',
--    '10',
--    'Additional buffer percentage applied on top of calculated safety stock.');
