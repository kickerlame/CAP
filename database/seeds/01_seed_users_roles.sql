-- =============================================================
-- VPPT — Vendor & Procurement Performance Tracker
-- File: 01_seed_users_roles.sql
-- Purpose: Seed roles, departments, and users
-- Currency: MYR (Malaysian Ringgit)
-- Run after: All schema files (00–07)
-- =============================================================

USE vppt;

-- -------------------------------------------------------------
-- Roles (5 defined roles)
-- permissions JSON controls what the backend middleware allows.
-- -------------------------------------------------------------
INSERT INTO roles (role_name, description, permissions) VALUES
('admin',
 'Full system access including settings, user management, and audit logs.',
 '{
   "manage_users": true,
   "manage_settings": true,
   "view_audit_logs": true,
   "manage_vendors": true,
   "manage_procurement": true,
   "manage_inventory": true,
   "manage_budgets": true,
   "view_analytics": true,
   "view_reports": true,
   "manage_alerts": true
 }'),
('procurement_officer',
 'Manages PR, PO, vendor selection, and procurement records.',
 '{
   "manage_users": false,
   "manage_settings": false,
   "view_audit_logs": false,
   "manage_vendors": true,
   "manage_procurement": true,
   "manage_inventory": false,
   "manage_budgets": false,
   "view_analytics": false,
   "view_reports": true,
   "manage_alerts": false
 }'),
('inventory_officer',
 'Manages inventory stock, consumption records, and stock alerts.',
 '{
   "manage_users": false,
   "manage_settings": false,
   "view_audit_logs": false,
   "manage_vendors": false,
   "manage_procurement": false,
   "manage_inventory": true,
   "manage_budgets": false,
   "view_analytics": false,
   "view_reports": true,
   "manage_alerts": true
 }'),
('manager',
 'View-only access to dashboards, analytics, reports, and vendor performance.',
 '{
   "manage_users": false,
   "manage_settings": false,
   "view_audit_logs": false,
   "manage_vendors": false,
   "manage_procurement": false,
   "manage_inventory": false,
   "manage_budgets": false,
   "view_analytics": true,
   "view_reports": true,
   "manage_alerts": false
 }'),
('requester',
 'Creates and monitors own procurement requests.',
 '{
   "manage_users": false,
   "manage_settings": false,
   "view_audit_logs": false,
   "manage_vendors": false,
   "manage_procurement": false,
   "manage_inventory": false,
   "manage_budgets": false,
   "view_analytics": false,
   "view_reports": false,
   "manage_alerts": false
 }');


-- -------------------------------------------------------------
-- Departments (8 departments)
-- head_user_id set to NULL initially; updated after users seeded.
-- -------------------------------------------------------------
INSERT INTO departments (dept_name, dept_code, head_user_id, is_active) VALUES
('Information Technology',   'IT',    NULL, 1),
('Procurement',              'PROC',  NULL, 1),
('Network Operations',       'NOC',   NULL, 1),
('Data Centre Operations',   'DCO',   NULL, 1),
('Finance',                  'FIN',   NULL, 1),
('Human Resources',          'HR',    NULL, 1),
('Customer Operations',      'COPS',  NULL, 1),
('Executive Management',     'EXEC',  NULL, 1);


-- -------------------------------------------------------------
-- Users
-- Passwords are bcrypt hashes of the values shown in comments.
-- All hashes below are for the placeholder password: "Password@123"
-- (Replace with real hashes before any production use.)
-- bcrypt rounds: 12
-- -------------------------------------------------------------
INSERT INTO users (role_id, department_id, username, email, password_hash, full_name, is_active) VALUES
-- Admin (role_id=1)
(1, 8, 'admin.sys',      'admin@vppt.my',            '$2b$12$rvn7VhEVTX0O1AR.X.anAexfy/1ZGtMXOMmgm8K4/j/xEqO7jhq8y', 'System Administrator',     1),

-- Procurement Officers (role_id=2)
(2, 2, 'procmgr',        'procmgr@vppt.my',          '$2b$12$rvn7VhEVTX0O1AR.X.anAexfy/1ZGtMXOMmgm8K4/j/xEqO7jhq8y', 'Procurement Manager',     1),
(2, 2, 'amirah.hassan',  'amirah.hassan@vppt.my',    '$2b$12$rvn7VhEVTX0O1AR.X.anAexfy/1ZGtMXOMmgm8K4/j/xEqO7jhq8y', 'Amirah Hassan',            1),
(2, 2, 'farid.othman',   'farid.othman@vppt.my',     '$2b$12$rvn7VhEVTX0O1AR.X.anAexfy/1ZGtMXOMmgm8K4/j/xEqO7jhq8y', 'Farid Othman',             1),
(2, 2, 'siti.rahimah',   'siti.rahimah@vppt.my',     '$2b$12$rvn7VhEVTX0O1AR.X.anAexfy/1ZGtMXOMmgm8K4/j/xEqO7jhq8y', 'Siti Rahimah Zainal',      1),

-- Inventory Officers (role_id=3)
(3, 1, 'hafiz.rosli',    'hafiz.rosli@vppt.my',      '$2b$12$rvn7VhEVTX0O1AR.X.anAexfy/1ZGtMXOMmgm8K4/j/xEqO7jhq8y', 'Hafiz Rosli',              1),
(3, 4, 'nurul.ain',      'nurul.ain@vppt.my',        '$2b$12$rvn7VhEVTX0O1AR.X.anAexfy/1ZGtMXOMmgm8K4/j/xEqO7jhq8y', 'Nurul Ain Mahdzir',        1),

-- Managers (role_id=4)
(4, 8, 'datuk.rashid',   'rashid.ibrahim@vppt.my',   '$2b$12$rvn7VhEVTX0O1AR.X.anAexfy/1ZGtMXOMmgm8K4/j/xEqO7jhq8y', 'Datuk Rashid Ibrahim',     1),
(4, 2, 'yusof.bakar',    'yusof.bakar@vppt.my',      '$2b$12$rvn7VhEVTX0O1AR.X.anAexfy/1ZGtMXOMmgm8K4/j/xEqO7jhq8y', 'Yusof Abdul Bakar',        1),
(4, 1, 'lim.weilin',     'lim.weilin@vppt.my',       '$2b$12$rvn7VhEVTX0O1AR.X.anAexfy/1ZGtMXOMmgm8K4/j/xEqO7jhq8y', 'Lim Wei Lin',              1),

-- Requesters (role_id=5)
(5, 1, 'rajan.pillai',   'rajan.pillai@vppt.my',     '$2b$12$rvn7VhEVTX0O1AR.X.anAexfy/1ZGtMXOMmgm8K4/j/xEqO7jhq8y', 'Rajan Pillai',             1),
(5, 3, 'zainab.malik',   'zainab.malik@vppt.my',     '$2b$12$rvn7VhEVTX0O1AR.X.anAexfy/1ZGtMXOMmgm8K4/j/xEqO7jhq8y', 'Zainab Malik',             1),
(5, 3, 'chen.jiaming',   'chen.jiaming@vppt.my',     '$2b$12$rvn7VhEVTX0O1AR.X.anAexfy/1ZGtMXOMmgm8K4/j/xEqO7jhq8y', 'Chen Jia Ming',            1),
(5, 4, 'norzahra.ali',   'norzahra.ali@vppt.my',     '$2b$12$rvn7VhEVTX0O1AR.X.anAexfy/1ZGtMXOMmgm8K4/j/xEqO7jhq8y', 'Nor Zahra Ali',            1),
(5, 4, 'kumar.selvam',   'kumar.selvam@vppt.my',     '$2b$12$rvn7VhEVTX0O1AR.X.anAexfy/1ZGtMXOMmgm8K4/j/xEqO7jhq8y', 'Kumar Selvam',             1),
(5, 5, 'mazlan.yunus',   'mazlan.yunus@vppt.my',     '$2b$12$rvn7VhEVTX0O1AR.X.anAexfy/1ZGtMXOMmgm8K4/j/xEqO7jhq8y', 'Mazlan Yunus',             1);

-- Update department heads now that users exist
-- IT dept head: Lim Wei Lin (user 9)
-- Procurement dept head: Amirah Hassan (user 2)
-- NOC dept head: Chen Jia Ming (user 12)
-- DCO dept head: Nurul Ain (user 6)
-- Finance dept head: Mazlan Yunus (user 15)
-- Executive dept head: Datuk Rashid Ibrahim (user 7)
UPDATE departments SET head_user_id = 9  WHERE dept_code = 'IT';
UPDATE departments SET head_user_id = 2  WHERE dept_code = 'PROC';
UPDATE departments SET head_user_id = 12 WHERE dept_code = 'NOC';
UPDATE departments SET head_user_id = 6  WHERE dept_code = 'DCO';
UPDATE departments SET head_user_id = 15 WHERE dept_code = 'FIN';
UPDATE departments SET head_user_id = 7  WHERE dept_code = 'EXEC';


-- -------------------------------------------------------------
-- System Settings (default values)
-- -------------------------------------------------------------
INSERT INTO system_settings (setting_key, setting_value, description, updated_by_id) VALUES
('vendor_score_weights',
 '{"sla": 0.40, "delivery": 0.30, "quality": 0.20, "return": 0.10}',
 'Vendor performance scorecard weights. Values must sum to 1.00. Configurable by admin.',
 1),
('default_currency',
 '"MYR"',
 'ISO 4217 currency code used across the application.',
 1),
('adc_window_days',
 '90',
 'Number of days used in the Average Daily Consumption rolling window.',
 1),
('bottleneck_delay_threshold_hours',
 '48',
 'Hours per procurement stage above which a transaction is counted as delayed in bottleneck analysis.',
 1),
('reorder_safety_buffer_pct',
 '10',
 'Additional buffer percentage applied on top of the base safety stock quantity.',
 1),
('vendor_score_window_months',
 '12',
 'Number of months of PO history used when calculating vendor performance scores.',
 1);
