-- =============================================================
-- VPPT — Vendor & Procurement Performance Tracker
-- File: 05_seed_budgets_alerts_inventory_txn.sql
-- Purpose: Seed budgets, budget transactions, inventory
--          consumption records (1,000+), vendor performance
--          snapshots, and initial alerts.
-- Currency: MYR (Malaysian Ringgit)
-- Run after: 04_seed_procurement.sql
-- =============================================================

USE vppt;

-- ---------------------------------------------------------------
-- BUDGETS (Annual + Q1 2026 per department, FY 2024 + FY 2025)
-- ---------------------------------------------------------------
INSERT INTO budgets
    (department_id, fiscal_year, fiscal_quarter, budget_name,
     total_amount, spent_amount, remaining_amount, status, created_by_id)
VALUES
-- FY 2024
(1, 2024, NULL, 'IT Dept Annual Budget FY2024',            850000.00,  412800.00,  437200.00, 'closed',  1),
(2, 2024, NULL, 'Procurement Dept Annual Budget FY2024',   120000.00,   89400.00,   30600.00, 'closed',  1),
(3, 2024, NULL, 'NOC Annual Budget FY2024',               1800000.00, 1456800.00,  343200.00, 'closed',  1),
(4, 2024, NULL, 'DCO Annual Budget FY2024',               3500000.00, 3187000.00,  313000.00, 'closed',  1),
(5, 2024, NULL, 'Finance Dept Annual Budget FY2024',        80000.00,   52100.00,   27900.00, 'closed',  1),
(6, 2024, NULL, 'HR Annual Budget FY2024',                  60000.00,   38200.00,   21800.00, 'closed',  1),

-- FY 2025
(1, 2025, NULL, 'IT Dept Annual Budget FY2025',            950000.00,  448000.00,  502000.00, 'active',  1),
(2, 2025, NULL, 'Procurement Dept Annual Budget FY2025',   130000.00,   97200.00,   32800.00, 'active',  1),
(3, 2025, NULL, 'NOC Annual Budget FY2025',               2000000.00, 1643400.00,  356600.00, 'active',  1),
(4, 2025, NULL, 'DCO Annual Budget FY2025',               4000000.00, 3752000.00,  248000.00, 'active',  1),
(5, 2025, NULL, 'Finance Dept Annual Budget FY2025',        90000.00,   61500.00,   28500.00, 'active',  1),
(6, 2025, NULL, 'HR Annual Budget FY2025',                  65000.00,   42800.00,   22200.00, 'active',  1),

-- FY 2026 Q1 (January–March)
(1, 2026, 1, 'IT Dept Q1 FY2026',                         250000.00,  131800.00,  118200.00, 'closed',  1),
(3, 2026, 1, 'NOC Q1 FY2026',                             550000.00,  482000.00,   68000.00, 'closed',  1),
(4, 2026, 1, 'DCO Q1 FY2026',                            1000000.00,  980000.00,   20000.00, 'closed',  1),

-- FY 2026 Q2 (April–June) — partially spent
(1, 2026, 2, 'IT Dept Q2 FY2026',                         250000.00,   88400.00,  161600.00, 'active',  1),
(3, 2026, 2, 'NOC Q2 FY2026',                             550000.00,  362800.00,  187200.00, 'active',  1),
(4, 2026, 2, 'DCO Q2 FY2026',                            1000000.00,  872000.00,  128000.00, 'active',  1),

-- FY 2026 Q3 (July–September) — just started
(3, 2026, 3, 'NOC Q3 FY2026',                             550000.00,   72000.00,  478000.00, 'active',  1),
(4, 2026, 3, 'DCO Q3 FY2026',                            1000000.00,   28000.00,  972000.00, 'active',  1);


-- ---------------------------------------------------------------
-- BUDGET TRANSACTIONS (linking major POs to budgets)
-- ---------------------------------------------------------------
INSERT INTO budget_transactions
    (budget_id, po_id, amount, transaction_type, description, recorded_by_id)
VALUES
-- FY2024 NOC budget (budget_id=3)
(3,  1,  420000.00, 'debit', 'PO-2024-0005: Carrier-grade routers',          2),
(3,  2,   68500.00, 'debit', 'PO-2024-0008: NOC switches and APs',           3),
(3,  3,    9600.00, 'debit', 'PO-2024-0011: SFP modules',                    2),
(3,  7,    5400.00, 'debit', 'PO-2024-0028: Ethernet cables',                3),
(3,  12,  21000.00, 'debit', 'PO-2024-0052: Patch panels and cabling',       2),
(3,  16,  16800.00, 'debit', 'PO-2024-0071: Fiber cables expansion',         3),
(3,  17,  56000.00, 'debit', 'PO-2024-0076: WiFi 6 APs NOC',                2),
(3,  21,  67200.00, 'debit', 'PO-2024-0095: Emergency switch replacement',   3),
(3,  22,   7200.00, 'debit', 'PO-2024-0100: Cat6A patch cables',             2),
(3,  23,  22500.00, 'debit', 'PO-2024-0104: Core router port expansion',     3),
(3,  26,  12600.00, 'debit', 'PO-2024-0119: QSFP28 100G Phase 2',           2),
(3,  27,   4800.00, 'debit', 'PO-2024-0124: Cat6 patch cables',              3),
(3,  28,  33600.00, 'debit', 'PO-2024-0129: Managed switch NOC cluster B',   2),

-- FY2024 DCO budget (budget_id=4)
(4,  4,  185000.00, 'debit', 'PO-2024-0015: Server racks DCO expansion',     2),
(4,  6,   34000.00, 'debit', 'PO-2024-0023: UPS replacement Zone B',         3),
(4,  8,   28800.00, 'debit', 'PO-2024-0033: APs DCO floor',                  2),
(4,  9,   56000.00, 'debit', 'PO-2024-0038: Server refresh Batch 1',         3),
(4,  13, 580000.00, 'debit', 'PO-2024-0057: GPU compute servers',            2),
(4,  15, 142000.00, 'debit', 'PO-2024-0066: HCI nodes Phase 2',              3),
(4,  19,  38000.00, 'debit', 'PO-2024-0086: Rack server Batch 2',            2),
(4,  20,  17000.00, 'debit', 'PO-2024-0091: UPS batteries and PDUs',         3),
(4,  24,  30000.00, 'debit', 'PO-2024-0109: Access point upgrade',           2),
(4,  25, 112000.00, 'debit', 'PO-2024-0114: Server refresh Batch 2',         3),
(4,  29,   8800.00, 'debit', 'PO-2024-0134: UPS battery modules',            2),
(4,  30,  58000.00, 'debit', 'PO-2024-0139: Server 2U emergency',            3),

-- FY2024 IT budget (budget_id=1)
(1,  5,   12800.00, 'debit', 'PO-2024-0019: Quarterly switch replacement',   3),
(1,  11,  88000.00, 'debit', 'PO-2024-0047: PoE switches IT floor A',        2),
(1,  14,   6400.00, 'debit', 'PO-2024-0062: Patch cables and panels',        3),
(1,  18,   9600.00, 'debit', 'PO-2024-0081: SFP modules IT',                 2),

-- FY2025 NOC budget (budget_id=9)
(9,  31,  45000.00, 'debit', 'PO-2025-0003: WiFi 6 AP NOC Phase 2',         2),
(9,  33,  35800.00, 'debit', 'PO-2025-0013: Edge router replacement',        3),
(9,  36,  24000.00, 'debit', 'PO-2025-0028: QSFP28 400G transceivers',       2),
(9,  37,   6400.00, 'debit', 'PO-2025-0033: Patch cables and fiber',         3),
(9,  38,  50400.00, 'debit', 'PO-2025-0038: Core switch stack NOC',          2),
(9,  41,   9000.00, 'debit', 'PO-2025-0053: Wall-mount cabinets',            3),
(9,  43,  18000.00, 'debit', 'PO-2025-0063: Fiber optic cable Zone 5',       2),
(9,  46,  14400.00, 'debit', 'PO-2025-0078: QSFP 100G LR4 Phase 3',         3),
(9,  47,  33600.00, 'debit', 'PO-2025-0083: 10G switch IT floor B',          2),
(9,  48,   8400.00, 'debit', 'PO-2025-0088: Fiber patch cables',             3),
(9,  51,  45000.00, 'debit', 'PO-2025-0103: Emergency AP replacement',       2),
(9,  53,  15000.00, 'debit', 'PO-2025-0113: MikroTik routers branch',        3),
(9,  56,  50400.00, 'debit', 'PO-2026-0004: Core switch stack Phase 3',      2),

-- FY2025 DCO budget (budget_id=10)
(10, 34, 280000.00, 'debit', 'PO-2025-0018: GPU server ML project',          2),
(10, 35,  20400.00, 'debit', 'PO-2025-0023: PDU and power cabling',          3),
(10, 39,  22000.00, 'debit', 'PO-2025-0043: Tower server DCO lab',           2),
(10, 40,  13200.00, 'debit', 'PO-2025-0048: SFP+ and QSFP+',                3),
(10, 42,  44800.00, 'debit', 'PO-2025-0058: PoE switch refresh Phase 2',     2),
(10, 44,  95000.00, 'debit', 'PO-2025-0068: HCI node Phase 3',               3),
(10, 45,  56000.00, 'debit', 'PO-2025-0073: Rack servers Batch 3',           2),
(10, 49,  25600.00, 'debit', 'PO-2025-0093: Outdoor mesh APs perimeter',     3),
(10, 50,   6800.00, 'debit', 'PO-2025-0098: Switched PDUs Zone C',           2),
(10, 54,  84000.00, 'debit', 'PO-2025-0118: Server refresh Batch 4',         3),
(10, 55,  24000.00, 'debit', 'PO-2025-0123: UPS rack units Zone D',          2),

-- FY2025 IT budget (budget_id=7)
(7,  32,  19200.00, 'debit', 'PO-2025-0008: 10G switches IT Dept',           3),
(7,  42,  44800.00, 'debit', 'PO-2025-0058: PoE switch refresh (IT share)',   2),
(7,  52,  19200.00, 'debit', 'PO-2025-0108: 24-Port switch batch IT',        3),
(7,  57,   9000.00, 'debit', 'PO-2026-0009: Cat6A cable and patch panel',    2);


-- ---------------------------------------------------------------
-- INVENTORY TRANSACTIONS (1,000+ consumption records)
-- Covers IN (goods received), OUT (consumption), and some
-- ADJUSTMENT records spread from Jan 2024 to Aug 2026.
-- Truncated here to key IN records (from POs) plus
-- systematic OUT records for ADC calculation.
-- ---------------------------------------------------------------

-- IN transactions from completed POs (goods received)
INSERT INTO inventory_transactions
    (inventory_id, txn_type, quantity, reference_type, reference_id, performed_by_id, txn_date, notes)
VALUES
-- Routers received
(1,  'IN',  2, 'PO', 1,  5, '2024-01-17 11:00:00', 'PO-2024-0005: Carrier-grade router receipt'),
(1,  'IN',  2, 'PO', 23, 5, '2024-09-16 11:00:00', 'PO-2024-0104: Core router port expansion'),
(3,  'IN',  4, 'PO', 5,  5, '2024-03-01 11:00:00', 'PO-2024-0019: SMB switches'),
(4,  'IN', 12, 'PO', 7,  5, '2024-04-05 11:00:00', 'PO-2024-0028: SOHO routers'),
-- Switches received
(9,  'IN',  8, 'PO', 2,  6, '2024-02-10 11:00:00', 'PO-2024-0008: 24-port managed switches'),
(9,  'IN',  4, 'PO', 5,  6, '2024-03-01 11:00:00', 'PO-2024-0019: Additional switches'),
(10, 'IN',  8, 'PO', 11, 6, '2024-05-25 11:00:00', 'PO-2024-0047: PoE switches IT floor A'),
(10, 'IN',  8, 'PO', 42, 6, '2025-06-30 11:00:00', 'PO-2025-0058: PoE switch refresh'),
(11, 'IN',  8, 'PO', 47, 6, '2025-09-08 11:00:00', 'PO-2025-0083: 10G managed switches'),
(12, 'IN',  2, 'PO', 38, 6, '2025-05-07 11:00:00', 'PO-2025-0038: Core switch stack'),
-- SFP modules received
(23, 'IN', 10, 'PO', 3,  5, '2024-02-23 11:00:00', 'PO-2024-0011: SFP+ SR'),
(24, 'IN', 10, 'PO', 3,  5, '2024-02-23 11:00:00', 'PO-2024-0011: SFP+ LR'),
(25, 'IN', 10, 'PO', 18, 5, '2024-02-26 11:00:00', 'PO-2024-0081: SFP 1G modules'),
-- QSFP transceivers received
(54, 'IN',  2, 'PO', 10, 6, '2024-05-09 11:00:00', 'PO-2024-0042: QSFP+ SR4'),
(55, 'IN',  3, 'PO', 10, 6, '2024-05-09 11:00:00', 'PO-2024-0042: QSFP28 LR4'),
(57, 'IN',  4, 'PO', 10, 6, '2024-05-09 11:00:00', 'PO-2024-0042: QSFP+ 40G LR4'),
(56, 'IN',  3, 'PO', 36, 6, '2025-04-10 11:00:00', 'PO-2025-0028: QSFP28 400G'),
(55, 'IN',  4, 'PO', 46, 6, '2025-08-26 11:00:00', 'PO-2025-0078: QSFP 100G LR4'),
-- Server racks received
(30, 'IN', 20, 'PO', 4,  6, '2024-01-30 11:00:00', 'PO-2024-0015: 42U server racks'),
(31, 'IN',  9, 'PO', 4,  6, '2024-01-30 11:00:00', 'PO-2024-0015: 24U wall-mount cabinets'),
-- Servers received
(36, 'IN',  1, 'PO', 9,  6, '2024-03-19 11:00:00', 'PO-2024-0038: Rack server 1U'),
(38, 'IN',  2, 'PO', 13, 6, '2024-06-26 11:00:00', 'PO-2024-0057: GPU compute servers'),
(38, 'IN',  1, 'PO', 34, 6, '2025-03-28 11:00:00', 'PO-2025-0018: GPU server ML'),
(37, 'IN',  1, 'PO', 30, 6, '2024-12-22 11:00:00', 'PO-2024-0139: Server 2U replacement'),
(39, 'IN',  1, 'PO', 19, 6, '2024-07-24 11:00:00', 'PO-2024-0086: Tower server'),
(41, 'IN',  1, 'PO', 44, 6, '2025-07-30 11:00:00', 'PO-2025-0068: HCI node Phase 3'),
-- UPS received
(42, 'IN',  5, 'PO', 6,  5, '2024-03-30 11:00:00', 'PO-2024-0023: UPS 1500VA'),
(43, 'IN',  2, 'PO', 6,  5, '2024-03-30 11:00:00', 'PO-2024-0023: UPS 3000VA'),
(47, 'IN', 10, 'PO', 20, 5, '2024-08-08 11:00:00', 'PO-2024-0091: UPS battery modules'),
(44, 'IN',  4, 'PO', 55, 5, '2026-01-03 11:00:00', 'PO-2025-0123: UPS rack 3000VA'),
-- Access points received
(48, 'IN',  8, 'PO', 2,  6, '2024-02-10 11:00:00', 'PO-2024-0008: Indoor WiFi 6 APs'),
(48, 'IN', 10, 'PO', 17, 6, '2024-07-11 11:00:00', 'PO-2024-0076: WiFi 6 AP NOC'),
(48, 'IN', 12, 'PO', 31, 6, '2025-01-29 11:00:00', 'PO-2025-0003: WiFi 6 AP Phase 2'),
(50, 'IN', 20, 'PO', 17, 6, '2024-07-11 11:00:00', 'PO-2024-0076: UniFi APs'),
(50, 'IN', 12, 'PO', 51, 6, '2025-10-31 11:00:00', 'PO-2025-0103: Emergency AP replacement'),
(52, 'IN',  8, 'PO', 49, 6, '2025-10-10 11:00:00', 'PO-2025-0093: Outdoor mesh APs'),
-- Patch panels received
(59, 'IN', 15, 'PO', 12, 6, '2024-02-19 11:00:00', 'PO-2024-0052: 24-port Cat6 panels'),
-- Ethernet cables received
(64, 'IN', 100, 'PO', 7,  5, '2024-04-05 11:00:00', 'PO-2024-0028: Cat6 1m cables'),
(65, 'IN',  80, 'PO', 7,  5, '2024-04-05 11:00:00', 'PO-2024-0028: Cat6 2m cables'),
(70, 'IN', 120, 'PO', 7,  5, '2024-04-05 11:00:00', 'PO-2024-0028: Cat5e 2m cables'),
(67, 'IN', 100, 'PO', 12, 6, '2024-02-19 11:00:00', 'PO-2024-0052: Cat6A cables'),
-- Fiber optic cables received
(17, 'IN', 200, 'PO', 16, 5, '2024-06-28 11:00:00', 'PO-2024-0071: Fiber OS2 patch cables'),
(19, 'IN', 500, 'PO', 43, 5, '2025-07-16 11:00:00', 'PO-2025-0063: Armored SM fiber cable'),
-- PDUs received
(72, 'IN',  8, 'PO', 35, 5, '2025-03-27 11:00:00', 'PO-2025-0023: Basic PDU units'),
(75, 'IN',  8, 'PO', 50, 5, '2025-10-24 11:00:00', 'PO-2025-0098: Switched PDUs');


-- ---------------------------------------------------------------
-- OUT transactions (consumption records — 1,000+ rows)
-- Generated using pure INSERT...SELECT with recursive CTE
-- (MySQL 8.0+). No DELIMITER or stored procedures needed.
-- ---------------------------------------------------------------

-- Generate a numbers CTE helper table (0..364 = 365 days)
-- then use it to insert all consumption rows as pure SQL.

-- FY 2024 daily cable consumption (weekdays only, skipping Sat=7 Sun=1)
-- Cat6 1m (inv=64) 3/day, Cat6 2m (inv=65) 2/day, Cat5e 2m (inv=70) 4/day,
-- Cat6A 1m (inv=67) 2/day, Cat6A 3m (inv=68) 1/day, Cat6 5m (inv=66) 1/day
INSERT INTO inventory_transactions
    (inventory_id, txn_type, quantity, reference_type, performed_by_id, txn_date, notes)
WITH RECURSIVE nums AS (
    SELECT 0 AS n UNION ALL SELECT n + 1 FROM nums WHERE n < 364
),
dates AS (
    SELECT n, DATE_ADD('2024-01-01', INTERVAL n DAY) AS d FROM nums
    WHERE DAYOFWEEK(DATE_ADD('2024-01-01', INTERVAL n DAY)) NOT IN (1, 7)
)
SELECT 64, 'OUT', -3, 'MANUAL', 5, TIMESTAMP(d, '09:00:00'), 'Daily cable issuance to IT/NOC teams' FROM dates
UNION ALL SELECT 65, 'OUT', -2, 'MANUAL', 5, TIMESTAMP(d, '09:30:00'), 'Daily cable issuance' FROM dates
UNION ALL SELECT 70, 'OUT', -4, 'MANUAL', 5, TIMESTAMP(d, '10:00:00'), 'Daily cable issuance' FROM dates
UNION ALL SELECT 67, 'OUT', -2, 'MANUAL', 5, TIMESTAMP(d, '10:30:00'), 'Cat6A cable issuance' FROM dates
UNION ALL SELECT 68, 'OUT', -1, 'MANUAL', 5, TIMESTAMP(d, '09:00:00'), 'Cat6A 3m cable issuance' FROM dates
UNION ALL SELECT 66, 'OUT', -1, 'MANUAL', 5, TIMESTAMP(d, '09:15:00'), 'Cat6 5m cable issuance' FROM dates;

-- FY 2024 periodic items
INSERT INTO inventory_transactions
    (inventory_id, txn_type, quantity, reference_type, performed_by_id, txn_date, notes)
WITH RECURSIVE nums AS (
    SELECT 0 AS n UNION ALL SELECT n + 1 FROM nums WHERE n < 364
)
-- SFP+ 10G SR (inv=23) every 10 days
SELECT 23, 'OUT', -1, 'MANUAL', 6, TIMESTAMP(DATE_ADD('2024-01-01', INTERVAL n DAY), '14:00:00'), 'SFP module installed in switch port'
FROM nums WHERE MOD(n, 10) = 0
UNION ALL
-- SFP 1G SX (inv=25) every 7 days
SELECT 25, 'OUT', -1, 'MANUAL', 6, TIMESTAMP(DATE_ADD('2024-01-01', INTERVAL n DAY), '14:30:00'), 'SFP 1G installed'
FROM nums WHERE MOD(n, 7) = 0
UNION ALL
-- Fiber OS2 patch 1m (inv=17) every 4 days
SELECT 17, 'OUT', -2, 'MANUAL', 5, TIMESTAMP(DATE_ADD('2024-01-01', INTERVAL n DAY), '11:00:00'), 'Fiber patch used in NOC rack'
FROM nums WHERE MOD(n, 4) = 0
UNION ALL
-- OM3 fiber patch (inv=18) every 4 days
SELECT 18, 'OUT', -2, 'MANUAL', 5, TIMESTAMP(DATE_ADD('2024-01-01', INTERVAL n DAY), '11:30:00'), 'OM3 fiber patch used in rack'
FROM nums WHERE MOD(n, 4) = 0
UNION ALL
-- Outdoor armored fiber (inv=19) every 7 days
SELECT 19, 'OUT', -10, 'MANUAL', 5, TIMESTAMP(DATE_ADD('2024-01-01', INTERVAL n DAY), '13:00:00'), 'Outdoor fiber cable run installed'
FROM nums WHERE MOD(n, 7) = 0
UNION ALL
-- UPS battery modules (inv=47) every 30 days
SELECT 47, 'OUT', -1, 'MANUAL', 5, TIMESTAMP(DATE_ADD('2024-01-01', INTERVAL n DAY), '15:00:00'), 'UPS battery module replaced'
FROM nums WHERE MOD(n, 30) = 0
UNION ALL
-- 24-Port Cat6 Patch Panel (inv=59) every 30 days
SELECT 59, 'OUT', -1, 'MANUAL', 6, TIMESTAMP(DATE_ADD('2024-01-01', INTERVAL n DAY), '14:00:00'), 'Patch panel installed in rack'
FROM nums WHERE MOD(n, 30) = 0
UNION ALL
-- Indoor WiFi 6 AP (inv=48) every 14 days
SELECT 48, 'OUT', -1, 'MANUAL', 6, TIMESTAMP(DATE_ADD('2024-01-01', INTERVAL n DAY), '13:30:00'), 'AP deployed to production floor'
FROM nums WHERE MOD(n, 14) = 0
UNION ALL
-- 24-port Gigabit switch (inv=9) every 21 days
SELECT 9,  'OUT', -1, 'MANUAL', 6, TIMESTAMP(DATE_ADD('2024-01-01', INTERVAL n DAY), '09:00:00'), 'Switch deployed in rack'
FROM nums WHERE MOD(n, 21) = 0
UNION ALL
-- PoE+ switch (inv=10) every 28 days
SELECT 10, 'OUT', -1, 'MANUAL', 6, TIMESTAMP(DATE_ADD('2024-01-01', INTERVAL n DAY), '10:00:00'), 'PoE switch deployed'
FROM nums WHERE MOD(n, 28) = 0
UNION ALL
-- Bulk Cat6 roll (inv=69) every 60 days (skip day 0)
SELECT 69, 'OUT', -1, 'MANUAL', 5, TIMESTAMP(DATE_ADD('2024-01-01', INTERVAL n DAY), '08:00:00'), 'Bulk Cat6 roll used for structured cabling'
FROM nums WHERE MOD(n, 60) = 0 AND n > 0
UNION ALL
-- PDU Basic (inv=72) every 30 days (skip day 0)
SELECT 72, 'OUT', -1, 'MANUAL', 5, TIMESTAMP(DATE_ADD('2024-01-01', INTERVAL n DAY), '14:00:00'), 'PDU installed in rack'
FROM nums WHERE MOD(n, 30) = 0 AND n > 0;

-- FY 2025 daily cable consumption (weekdays only)
INSERT INTO inventory_transactions
    (inventory_id, txn_type, quantity, reference_type, performed_by_id, txn_date, notes)
WITH RECURSIVE nums AS (
    SELECT 0 AS n UNION ALL SELECT n + 1 FROM nums WHERE n < 364
),
dates AS (
    SELECT n, DATE_ADD('2025-01-01', INTERVAL n DAY) AS d FROM nums
    WHERE DAYOFWEEK(DATE_ADD('2025-01-01', INTERVAL n DAY)) NOT IN (1, 7)
)
SELECT 64, 'OUT', -3, 'MANUAL', 5, TIMESTAMP(d, '09:00:00'), 'Daily cable issuance 2025' FROM dates
UNION ALL SELECT 65, 'OUT', -2, 'MANUAL', 5, TIMESTAMP(d, '09:00:00'), 'Daily cable issuance 2025' FROM dates
UNION ALL SELECT 70, 'OUT', -4, 'MANUAL', 5, TIMESTAMP(d, '09:00:00'), 'Daily cable issuance 2025' FROM dates
UNION ALL SELECT 67, 'OUT', -2, 'MANUAL', 5, TIMESTAMP(d, '09:00:00'), 'Cat6A issuance 2025' FROM dates
UNION ALL SELECT 68, 'OUT', -1, 'MANUAL', 5, TIMESTAMP(d, '09:00:00'), 'Cat6A 3m issuance 2025' FROM dates
UNION ALL SELECT 66, 'OUT', -1, 'MANUAL', 5, TIMESTAMP(d, '09:00:00'), 'Cat6 5m issuance 2025' FROM dates;

-- FY 2025 periodic items
INSERT INTO inventory_transactions
    (inventory_id, txn_type, quantity, reference_type, performed_by_id, txn_date, notes)
WITH RECURSIVE nums AS (
    SELECT 0 AS n UNION ALL SELECT n + 1 FROM nums WHERE n < 364
)
SELECT 23, 'OUT', -1, 'MANUAL', 6, TIMESTAMP(DATE_ADD('2025-01-01', INTERVAL n DAY), '09:00:00'), 'SFP module installed 2025'
FROM nums WHERE MOD(n, 10) = 0
UNION ALL
SELECT 25, 'OUT', -1, 'MANUAL', 6, TIMESTAMP(DATE_ADD('2025-01-01', INTERVAL n DAY), '09:00:00'), 'SFP 1G installed 2025'
FROM nums WHERE MOD(n, 7) = 0;


-- ---------------------------------------------------------------
-- VENDOR PERFORMANCE SNAPSHOTS
-- One per vendor per quarter for FY2024 + FY2025.
-- Weights from system_settings: sla=0.40, delivery=0.30,
-- quality=0.20, return=0.10
-- ---------------------------------------------------------------
INSERT INTO vendor_performance_snapshots
    (vendor_id, snapshot_date, sla_score, delivery_score, quality_score, return_score,
     overall_score, tier, weight_sla, weight_delivery, weight_quality, weight_return, po_count)
VALUES
-- VND-001 TechBridge (Platinum)
(1,  '2024-03-31',  96.00, 94.00, 97.00, 98.00,  95.60, 'Platinum', 0.40, 0.30, 0.20, 0.10, 4),
(1,  '2024-06-30',  97.00, 95.00, 97.00, 98.00,  96.50, 'Platinum', 0.40, 0.30, 0.20, 0.10, 3),
(1,  '2024-09-30',  96.50, 95.50, 98.00, 98.00,  96.55, 'Platinum', 0.40, 0.30, 0.20, 0.10, 3),
(1,  '2024-12-31',  95.00, 94.00, 97.00, 97.00,  95.20, 'Platinum', 0.40, 0.30, 0.20, 0.10, 4),
(1,  '2025-03-31',  96.00, 95.00, 98.00, 98.00,  96.40, 'Platinum', 0.40, 0.30, 0.20, 0.10, 3),
(1,  '2025-06-30',  95.50, 94.50, 97.00, 98.00,  95.65, 'Platinum', 0.40, 0.30, 0.20, 0.10, 4),
(1,  '2025-09-30',  95.00, 94.00, 97.00, 98.00,  95.20, 'Platinum', 0.40, 0.30, 0.20, 0.10, 3),
(1,  '2025-12-31',  94.00, 93.00, 96.00, 97.00,  94.00, 'Platinum', 0.40, 0.30, 0.20, 0.10, 4),

-- VND-002 NetAxis (Platinum)
(2,  '2024-03-31',  93.00, 91.00, 96.00, 97.00,  93.30, 'Platinum', 0.40, 0.30, 0.20, 0.10, 3),
(2,  '2024-06-30',  94.00, 92.00, 96.00, 97.00,  94.10, 'Platinum', 0.40, 0.30, 0.20, 0.10, 4),
(2,  '2024-09-30',  95.00, 93.00, 97.00, 98.00,  94.80, 'Platinum', 0.40, 0.30, 0.20, 0.10, 3),
(2,  '2024-12-31',  92.00, 91.00, 96.00, 97.00,  92.80, 'Platinum', 0.40, 0.30, 0.20, 0.10, 4),
(2,  '2025-03-31',  93.00, 91.00, 96.00, 97.00,  93.30, 'Platinum', 0.40, 0.30, 0.20, 0.10, 3),
(2,  '2025-06-30',  94.00, 92.00, 97.00, 97.00,  94.20, 'Platinum', 0.40, 0.30, 0.20, 0.10, 5),
(2,  '2025-09-30',  92.50, 91.50, 96.00, 97.00,  93.05, 'Platinum', 0.40, 0.30, 0.20, 0.10, 4),
(2,  '2025-12-31',  91.00, 90.00, 95.00, 96.00,  91.60, 'Platinum', 0.40, 0.30, 0.20, 0.10, 3),

-- VND-006 PrimeTech (Silver)
(6,  '2024-03-31',  80.00, 76.00, 85.00, 88.00,  80.60, 'Silver',   0.40, 0.30, 0.20, 0.10, 2),
(6,  '2024-06-30',  79.00, 77.00, 84.00, 87.00,  80.00, 'Silver',   0.40, 0.30, 0.20, 0.10, 3),
(6,  '2024-09-30',  78.00, 76.00, 84.00, 86.00,  79.00, 'Silver',   0.40, 0.30, 0.20, 0.10, 2),
(6,  '2024-12-31',  77.00, 75.00, 83.00, 85.00,  78.00, 'Silver',   0.40, 0.30, 0.20, 0.10, 3),
(6,  '2025-03-31',  76.00, 74.00, 82.00, 85.00,  77.20, 'Silver',   0.40, 0.30, 0.20, 0.10, 2),
(6,  '2025-06-30',  77.00, 75.00, 83.00, 85.00,  78.00, 'Silver',   0.40, 0.30, 0.20, 0.10, 3),
(6,  '2025-09-30',  78.00, 76.00, 84.00, 86.00,  79.00, 'Silver',   0.40, 0.30, 0.20, 0.10, 2),
(6,  '2025-12-31',  79.00, 77.00, 84.00, 87.00,  80.00, 'Silver',   0.40, 0.30, 0.20, 0.10, 3),

-- VND-010 DigitalEdge (Probation)
(10, '2024-03-31',  60.00, 55.00, 65.00, 72.00,  60.70, 'Probation',0.40, 0.30, 0.20, 0.10, 1),
(10, '2024-06-30',  58.00, 53.00, 64.00, 70.00,  58.70, 'Probation',0.40, 0.30, 0.20, 0.10, 2),
(10, '2024-09-30',  57.00, 52.00, 63.00, 69.00,  57.60, 'Probation',0.40, 0.30, 0.20, 0.10, 1),
(10, '2024-12-31',  55.00, 50.00, 62.00, 68.00,  56.00, 'Probation',0.40, 0.30, 0.20, 0.10, 2),
(10, '2025-03-31',  54.00, 49.00, 61.00, 67.00,  54.80, 'Probation',0.40, 0.30, 0.20, 0.10, 1),
(10, '2025-06-30',  55.00, 50.00, 62.00, 68.00,  56.00, 'Probation',0.40, 0.30, 0.20, 0.10, 2),
(10, '2025-09-30',  56.00, 51.00, 62.00, 68.00,  56.80, 'Probation',0.40, 0.30, 0.20, 0.10, 1),
(10, '2025-12-31',  57.00, 52.00, 63.00, 69.00,  57.60, 'Probation',0.40, 0.30, 0.20, 0.10, 2);


-- ---------------------------------------------------------------
-- ALERTS (initial set — generated from DB conditions)
-- ---------------------------------------------------------------
INSERT INTO alerts (alert_type, severity, entity_type, entity_id, message, is_read, created_at)
VALUES
('critical_stock',      'critical', 'inventory', 38, 'Blade Chassis stock is CRITICAL (1 unit). Current stock equals or is below reorder point. Immediate procurement action required.',               0, NOW()),
('critical_stock',      'critical', 'inventory', 46, 'UPS 20kVA stock is CRITICAL (1 unit). Stock level at minimum. Procurement required before next planned maintenance window.',                    0, NOW()),
('reorder_required',    'warning',  'inventory', 10, 'PoE+ Switch stock (15 units) has reached reorder point (5.09 units). Recommend raising a PR to avoid service disruption.',                     0, NOW()),
('reorder_required',    'warning',  'inventory', 11, '10G SFP+ Managed Switch stock (10 units) at reorder point. Lead time is 21 days — initiate PR now.',                                          0, NOW()),
('reorder_required',    'warning',  'inventory', 15, 'Data Centre Leaf Switch stock (3 units) has reached reorder threshold. Only 3 units remaining with 30-day lead time.',                         0, NOW()),
('reorder_required',    'warning',  'inventory', 27, 'QSFP+ 40G SR4 stock (12 units) approaching reorder point. Estimated 73 days remaining with current consumption rate.',                         0, NOW()),
('reorder_required',    'warning',  'inventory', 28, 'QSFP28 100G LR4 stock (6 units) at reorder point. High-value item with 21-day lead time — raise PR promptly.',                                0, NOW()),
('reorder_required',    'warning',  'inventory', 36, 'Rack Server 1U stock (4 units) approaching reorder threshold. 30-day lead time requires early PR submission.',                                 0, NOW()),
('reorder_required',    'warning',  'inventory', 37, 'Rack Server 2U stock (3 units) at reorder point. 30-day lead time — initiate procurement immediately.',                                        0, NOW()),
('reorder_required',    'warning',  'inventory', 39, 'Tower Server stock (5 units) at reorder threshold. Raise PR with 30-day lead time buffer.',                                                    0, NOW()),
('reorder_required',    'warning',  'inventory', 45, 'UPS 10kVA stock (3 units) approaching reorder point. 30-day lead time — submit PR soon.',                                                     0, NOW()),
('reorder_required',    'warning',  'inventory', 51, 'High-Density Stadium AP stock (8 units) at reorder point with 21-day lead time.',                                                             0, NOW()),
('reorder_required',    'warning',  'inventory', 52, 'Outdoor Mesh AP stock (6 units) at reorder threshold. Only 6 units remain with 21-day lead time.',                                            0, NOW()),
('reorder_required',    'warning',  'inventory', 56, 'QSFP-DD 400G transceiver stock (4 units) at reorder point. High-value item — submit PR.',                                                     0, NOW()),
('sla_failure',         'warning',  'vendor',    10, 'Vendor DigitalEdge Components is in Probation tier with overall score 56.80. SLA compliance consistently below target. Review contract.',     0, NOW()),
('sla_failure',         'warning',  'vendor',    18, 'Vendor Pinnacle Tech Supply is in Probation tier (score 58.30). On-time delivery has been chronically below SLA target.',                     0, NOW()),
('sla_failure',         'warning',  'vendor',    22, 'Vendor StellarNet Components is in Probation tier (score 54.20). Quality defect rate exceeds acceptable threshold.',                          0, NOW()),
('sla_failure',         'warning',  'vendor',    30, 'Vendor TechGate Sdn Bhd is in Probation tier (score 53.10). Delivery delays and high return rate noted across last 4 POs.',                  0, NOW()),
('budget_exceeded',     'warning',  'budget',    20, 'DCO Q3 FY2026 budget is at 97.2% utilization (MYR 980,000 of MYR 1,000,000 used). Only MYR 20,000 remaining. Review before new POs.',       0, NOW()),
('procurement_delay',   'info',     'purchase_orders', 59, 'PO-2026-0014 (Carrier-grade router) has been in SHIPPED status for more than 10 days without delivery confirmation.', 0, NOW()),
('high_defect_rate',    'warning',  'vendor',    6,  'PrimeTech Hardware recorded defect rate of 50% on PO-2024-0038 (1 of 2 servers rejected). Investigate quality control process.', 0, NOW());
