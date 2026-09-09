-- =============================================================
-- VPPT — Vendor & Procurement Performance Tracker
-- File: 05_budgets.sql
-- Purpose: budgets, budget_transactions
-- Run after: 01_users_roles.sql, 04_procurement.sql
-- =============================================================

USE vppt;

-- -------------------------------------------------------------
-- Table: budgets
-- Tracks allocated budget per department per fiscal period.
-- fiscal_quarter NULL = annual budget (full year).
-- spent_amount and remaining_amount are updated by the
-- budget.service.ts whenever a budget_transaction is inserted.
-- This avoids expensive SUM() on budget_transactions in every query.
-- remaining_amount = total_amount - spent_amount
--
-- A single department can have multiple budget records:
--   - One annual + four quarterly, or just annual.
--   - Multiple fiscal years of history.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS budgets (
    budget_id       INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    department_id   INT UNSIGNED    NOT NULL,
    fiscal_year     YEAR            NOT NULL
                    COMMENT 'MySQL YEAR type (4-digit)',
    fiscal_quarter  TINYINT UNSIGNED    NULL DEFAULT NULL
                    COMMENT '1–4 for quarterly budgets; NULL for annual budget',
    budget_name     VARCHAR(100)    NOT NULL
                    COMMENT 'Descriptive label, e.g. "IT Dept Annual 2025"',
    total_amount    DECIMAL(15,2)   NOT NULL DEFAULT 0.00
                    COMMENT 'Allocated budget amount in default currency',
    spent_amount    DECIMAL(15,2)   NOT NULL DEFAULT 0.00
                    COMMENT 'Running total debited; maintained by budget.service.ts',
    remaining_amount DECIMAL(15,2)  NOT NULL DEFAULT 0.00
                    COMMENT 'total_amount - spent_amount; maintained by service',
    status          ENUM(
                        'active',
                        'closed',
                        'suspended'
                    )               NOT NULL DEFAULT 'active',
    created_by_id   INT UNSIGNED    NOT NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
                                    ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_budgets           PRIMARY KEY  (budget_id),
    CONSTRAINT fk_budget_dept       FOREIGN KEY  (department_id)
        REFERENCES departments (department_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_budget_creator    FOREIGN KEY  (created_by_id)
        REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    INDEX idx_budget_dept           (department_id),
    INDEX idx_budget_fiscal_year    (fiscal_year),
    INDEX idx_budget_status         (status)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Budget allocations per department per fiscal period.';


-- -------------------------------------------------------------
-- Table: budget_transactions
-- Every debit/credit/adjustment against a budget is recorded here.
-- po_id links the spend to the originating Purchase Order.
-- po_id is nullable for manual adjustments or credits not linked
-- to a specific PO.
-- transaction_type:
--   debit       = spend recorded when PO is completed
--   credit      = refund from vendor return
--   adjustment  = manual correction by admin
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS budget_transactions (
    bt_id               INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    budget_id           INT UNSIGNED    NOT NULL,
    po_id               INT UNSIGNED        NULL DEFAULT NULL
                        COMMENT 'Source PO; NULL for manual adjustments',
    amount              DECIMAL(15,2)   NOT NULL
                        COMMENT 'Amount of the transaction (always positive)',
    transaction_type    ENUM(
                            'debit',
                            'credit',
                            'adjustment'
                        )               NOT NULL DEFAULT 'debit',
    description         TEXT                NULL DEFAULT NULL,
    recorded_by_id      INT UNSIGNED    NOT NULL,
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_budget_txn        PRIMARY KEY  (bt_id),
    CONSTRAINT fk_bt_budget         FOREIGN KEY  (budget_id)
        REFERENCES budgets (budget_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_bt_po             FOREIGN KEY  (po_id)
        REFERENCES purchase_orders (po_id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_bt_recorder       FOREIGN KEY  (recorded_by_id)
        REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    INDEX idx_bt_budget             (budget_id),
    INDEX idx_bt_po                 (po_id),
    INDEX idx_bt_type               (transaction_type),
    INDEX idx_bt_created_at         (created_at)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Individual spend/credit/adjustment records against a budget.';
