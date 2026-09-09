-- =============================================================
-- VPPT — Vendor & Procurement Performance Tracker
-- File: 03_hardware_inventory.sql
-- Purpose: hardware_categories, hardware_items, inventory,
--          inventory_transactions
-- Run after: 01_users_roles.sql
-- =============================================================

USE vppt;

-- -------------------------------------------------------------
-- Table: hardware_categories
-- Top-level grouping for IT hardware items.
-- Examples: Router, Network Switch, SFP Module, UPS, etc.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hardware_categories (
    category_id     INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    category_name   VARCHAR(100)    NOT NULL,
    description     TEXT                NULL DEFAULT NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_hw_categories     PRIMARY KEY (category_id),
    CONSTRAINT uq_category_name     UNIQUE      (category_name)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Top-level hardware item categories (e.g. Router, Switch, SFP Module).';


-- -------------------------------------------------------------
-- Table: hardware_items
-- The product catalogue. Every purchasable/stockable item is
-- defined here before it can appear on a PR/PO or inventory record.
-- unit_cost is the standard catalogue price.
-- lead_time_days is used by the inventory prediction formula.
-- safety_stock is the minimum buffer maintained at all times.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hardware_items (
    item_id             INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    category_id         INT UNSIGNED    NOT NULL,
    item_name           VARCHAR(200)    NOT NULL,
    item_code           VARCHAR(50)     NOT NULL
                        COMMENT 'Unique SKU or part number',
    brand               VARCHAR(80)         NULL DEFAULT NULL,
    model               VARCHAR(80)         NULL DEFAULT NULL,
    unit_of_measure     VARCHAR(20)     NOT NULL DEFAULT 'unit'
                        COMMENT 'pcs, meters, box, roll, etc.',
    unit_cost           DECIMAL(15,2)   NOT NULL DEFAULT 0.00
                        COMMENT 'Standard catalogue price in default currency',
    safety_stock        INT UNSIGNED    NOT NULL DEFAULT 10
                        COMMENT 'Minimum buffer; feeds reorder point formula',
    lead_time_days      TINYINT UNSIGNED NOT NULL DEFAULT 14
                        COMMENT 'Procurement lead time used in reorder point formula',
    is_active           TINYINT(1)      NOT NULL DEFAULT 1,
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
                                        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_hardware_items    PRIMARY KEY (item_id),
    CONSTRAINT uq_item_code         UNIQUE      (item_code),
    CONSTRAINT fk_items_category    FOREIGN KEY (category_id)
        REFERENCES hardware_categories (category_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    INDEX idx_items_category        (category_id),
    INDEX idx_items_active          (is_active)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Hardware product catalogue. One row per unique stockable item.';


-- -------------------------------------------------------------
-- Table: inventory
-- One row per hardware_item (1:1, enforced by UNIQUE on item_id).
-- avg_daily_consumption, reorder_point, estimated_days_remaining,
-- and risk_level are computed values cached here for performance.
-- They are recalculated by inventory.service.ts on demand or
-- on a scheduled basis.
-- last_calculated_at records when the metrics were last refreshed.
--
-- Formulas (documented here and in service layer):
--   ADC  = total_OUT_qty / days_in_window    (90-day window)
--   ROP  = ADC × lead_time_days + safety_stock
--   EDR  = current_stock / ADC               (NULL if ADC = 0)
--   Risk = CRITICAL if stock=0 OR stock<=ROP
--          WARNING  if EDR <= lead_time_days
--          NORMAL   otherwise
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory (
    inventory_id                INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    item_id                     INT UNSIGNED    NOT NULL,
    current_stock               INT UNSIGNED    NOT NULL DEFAULT 0,
    avg_daily_consumption       DECIMAL(10,4)   NOT NULL DEFAULT 0.0000
                                COMMENT 'ADC = total OUT qty / days in 90-day window',
    reorder_point               DECIMAL(10,4)   NOT NULL DEFAULT 0.0000
                                COMMENT 'ROP = ADC × lead_time_days + safety_stock',
    estimated_days_remaining    DECIMAL(10,2)       NULL DEFAULT NULL
                                COMMENT 'EDR = current_stock / ADC (NULL if ADC=0)',
    risk_level                  ENUM(
                                    'NORMAL',
                                    'WARNING',
                                    'CRITICAL'
                                )               NOT NULL DEFAULT 'NORMAL',
    last_calculated_at          DATETIME            NULL DEFAULT NULL
                                COMMENT 'When ADC/ROP/EDR were last computed',
    last_updated                TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
                                                ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_inventory         PRIMARY KEY (inventory_id),
    CONSTRAINT uq_inventory_item    UNIQUE      (item_id)
                                    COMMENT 'Enforces 1:1 with hardware_items',
    CONSTRAINT fk_inventory_item    FOREIGN KEY (item_id)
        REFERENCES hardware_items (item_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    INDEX idx_inv_risk              (risk_level),
    INDEX idx_inv_stock             (current_stock)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Current stock levels. One row per hardware_item. Computed metrics are cached here.';


-- -------------------------------------------------------------
-- Table: inventory_transactions
-- Records every stock movement: goods received (IN), consumed/issued
-- (OUT), manual adjustments (ADJUSTMENT), and returns to stock (RETURN).
-- reference_type + reference_id are a polymorphic soft-reference
-- (not an enforced FK) so a single table can reference POs, returns,
-- or manual entries without multiple nullable FK columns.
-- quantity is signed: positive for IN/RETURN, negative for OUT.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory_transactions (
    txn_id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    inventory_id    INT UNSIGNED    NOT NULL,
    txn_type        ENUM(
                        'IN',
                        'OUT',
                        'ADJUSTMENT',
                        'RETURN'
                    )               NOT NULL
                    COMMENT 'IN=received, OUT=consumed/issued, ADJUSTMENT=correction, RETURN=return to stock',
    quantity        INT             NOT NULL
                    COMMENT 'Signed: positive for IN/RETURN, negative for OUT/ADJUSTMENT',
    reference_type  VARCHAR(30)         NULL DEFAULT NULL
                    COMMENT 'Polymorphic: PO, RETURN, MANUAL, etc.',
    reference_id    INT UNSIGNED        NULL DEFAULT NULL
                    COMMENT 'ID in the referenced table (not FK enforced)',
    performed_by_id INT UNSIGNED    NOT NULL,
    txn_date        DATETIME        NOT NULL
                    COMMENT 'Business date/time of the movement',
    notes           TEXT                NULL DEFAULT NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_inv_txn           PRIMARY KEY (txn_id),
    CONSTRAINT fk_txn_inventory     FOREIGN KEY (inventory_id)
        REFERENCES inventory (inventory_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_txn_user          FOREIGN KEY (performed_by_id)
        REFERENCES users (user_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    INDEX idx_txn_inventory         (inventory_id),
    INDEX idx_txn_type              (txn_type),
    INDEX idx_txn_date              (txn_date),
    INDEX idx_txn_reference         (reference_type, reference_id),
    INDEX idx_txn_user              (performed_by_id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='All stock movements. Used as the source data for ADC calculation.';
