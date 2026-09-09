-- =============================================================
-- VPPT — Vendor & Procurement Performance Tracker
-- File: 02_departments_vendors.sql
-- Purpose: vendors, vendor_sla_contracts, vendor_performance_snapshots
-- Run after: 01_users_roles.sql
-- =============================================================

USE vppt;

-- -------------------------------------------------------------
-- Table: vendors
-- Master record for each supplier. tier and overall_score are
-- cached denormalizations from the latest vendor_performance_snapshot.
-- They are updated by the application service after each recalculation.
-- deleted_at enables soft-delete.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vendors (
    vendor_id       INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    vendor_name     VARCHAR(150)    NOT NULL,
    vendor_code     VARCHAR(30)     NOT NULL,
    contact_person  VARCHAR(100)        NULL DEFAULT NULL,
    email           VARCHAR(255)        NULL DEFAULT NULL,
    phone           VARCHAR(30)         NULL DEFAULT NULL,
    address         TEXT                NULL DEFAULT NULL,
    status          ENUM(
                        'active',
                        'inactive',
                        'probation'
                    )               NOT NULL DEFAULT 'active',
    tier            ENUM(
                        'Platinum',
                        'Gold',
                        'Silver',
                        'Probation',
                        'Unrated'
                    )               NOT NULL DEFAULT 'Unrated'
                    COMMENT 'Cached from latest performance snapshot',
    overall_score   DECIMAL(5,2)        NULL DEFAULT NULL
                    COMMENT 'Cached from latest performance snapshot (0–100)',
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
                                    ON UPDATE CURRENT_TIMESTAMP,
    deleted_at      DATETIME            NULL DEFAULT NULL,

    CONSTRAINT pk_vendors           PRIMARY KEY (vendor_id),
    CONSTRAINT uq_vendor_code       UNIQUE      (vendor_code),

    INDEX idx_vendors_status        (status),
    INDEX idx_vendors_tier          (tier),
    INDEX idx_vendors_deleted       (deleted_at)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Vendor master table. tier/overall_score are cached from snapshots.';


-- -------------------------------------------------------------
-- Table: vendor_sla_contracts
-- SLA terms for each vendor. Only one row per vendor should have
-- is_current = 1 at any time (enforced at application level).
-- When a new contract is added, the old one is set is_current = 0.
-- contract_end_date NULL = open-ended contract.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vendor_sla_contracts (
    contract_id                 INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    vendor_id                   INT UNSIGNED    NOT NULL,
    delivery_lead_time_days     TINYINT UNSIGNED NOT NULL DEFAULT 14
                                COMMENT 'Expected delivery window in calendar days',
    sla_compliance_target_pct   DECIMAL(5,2)    NOT NULL DEFAULT 95.00
                                COMMENT 'Target SLA compliance percentage (0–100)',
    quality_threshold_pct       DECIMAL(5,2)    NOT NULL DEFAULT 98.00
                                COMMENT 'Maximum acceptable defect rate percentage',
    max_return_rate_pct         DECIMAL(5,2)    NOT NULL DEFAULT 2.00
                                COMMENT 'Maximum acceptable return rate percentage',
    contract_start_date         DATE            NOT NULL,
    contract_end_date           DATE                NULL DEFAULT NULL,
    is_current                  TINYINT(1)      NOT NULL DEFAULT 1
                                COMMENT '1 = active contract; only one per vendor',
    created_at                  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_vendor_sla        PRIMARY KEY (contract_id),
    CONSTRAINT fk_sla_vendor        FOREIGN KEY (vendor_id)
        REFERENCES vendors (vendor_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    INDEX idx_sla_vendor            (vendor_id),
    INDEX idx_sla_current           (vendor_id, is_current)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='SLA terms per vendor. Only one is_current=1 row per vendor at a time.';


-- -------------------------------------------------------------
-- Table: vendor_performance_snapshots
-- Every time a vendor score is recalculated, a new row is inserted.
-- The weight columns record exactly which weights were in effect at
-- calculation time, making the score fully auditable.
-- vendor_id + snapshot_date is UNIQUE to prevent duplicate same-day
-- recalculations overwriting history.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vendor_performance_snapshots (
    snapshot_id     INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    vendor_id       INT UNSIGNED    NOT NULL,
    snapshot_date   DATE            NOT NULL,

    -- Sub-scores (0–100 each)
    sla_score       DECIMAL(5,2)    NOT NULL COMMENT 'SLA compliance sub-score',
    delivery_score  DECIMAL(5,2)    NOT NULL COMMENT 'On-time delivery sub-score',
    quality_score   DECIMAL(5,2)    NOT NULL COMMENT 'Quality / defect sub-score',
    return_score    DECIMAL(5,2)    NOT NULL COMMENT 'Return rate sub-score',

    -- Composite
    overall_score   DECIMAL(5,2)    NOT NULL COMMENT 'Weighted overall score (0–100)',
    tier            ENUM(
                        'Platinum',
                        'Gold',
                        'Silver',
                        'Probation'
                    )               NOT NULL,

    -- Weights in effect at calculation time (must sum to 1.00)
    weight_sla      DECIMAL(4,2)    NOT NULL DEFAULT 0.40,
    weight_delivery DECIMAL(4,2)    NOT NULL DEFAULT 0.30,
    weight_quality  DECIMAL(4,2)    NOT NULL DEFAULT 0.20,
    weight_return   DECIMAL(4,2)    NOT NULL DEFAULT 0.10,

    -- Context
    po_count        INT UNSIGNED    NOT NULL DEFAULT 0
                    COMMENT 'Number of POs used in this scoring window',
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_vp_snapshots      PRIMARY KEY (snapshot_id),
    CONSTRAINT uq_snapshot_date     UNIQUE      (vendor_id, snapshot_date),
    CONSTRAINT fk_snapshot_vendor   FOREIGN KEY (vendor_id)
        REFERENCES vendors (vendor_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    INDEX idx_snap_vendor           (vendor_id),
    INDEX idx_snap_date             (snapshot_date),
    INDEX idx_snap_tier             (tier)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Historical vendor performance scores. One row per vendor per calculation date.';
