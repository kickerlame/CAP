-- =============================================================
-- VPPT — Vendor & Procurement Performance Tracker
-- File: 02_seed_vendors.sql
-- Purpose: Seed 35 vendors, SLA contracts, and initial
--          performance snapshots
-- Currency: MYR (Malaysian Ringgit)
-- Run after: 01_seed_users_roles.sql
-- =============================================================

USE vppt;

-- -------------------------------------------------------------
-- Vendors (35 fictional Malaysian IT hardware suppliers)
-- -------------------------------------------------------------
INSERT INTO vendors (vendor_name, vendor_code, contact_person, email, phone, address, status, tier, overall_score) VALUES
('TechBridge Solutions Sdn Bhd',    'VND-001', 'Hafizuddin Kamal',    'sales@techbridge.my',       '+603-2145-8800', 'Menara TechBridge, Jalan Ampang, 50450 Kuala Lumpur',                  'active',   'Platinum', 94.20),
('NetAxis Malaysia Sdn Bhd',        'VND-002', 'Wong Siew Ling',      'procurement@netaxis.my',    '+603-8888-3311', 'Lot 15, Cyberjaya Technology Park, 63000 Cyberjaya, Selangor',         'active',   'Platinum', 91.80),
('Synergy Telecom Supplies Bhd',    'VND-003', 'Rajendran Nair',      'orders@synergytelecom.my',  '+604-6612-5500', 'Bayan Lepas Industrial Zone, 11900 Penang',                            'active',   'Gold',     88.50),
('DataCore Systems Sdn Bhd',        'VND-004', 'Nurul Huda Ibrahim',  'supply@datacore.my',        '+603-5192-7700', 'Shah Alam Technology Centre, 40150 Shah Alam, Selangor',              'active',   'Gold',     85.30),
('Meridian Network Components',     'VND-005', 'Tan Ah Kow',          'sales@meridiannetwork.my',  '+607-3356-8899', 'Iskandar Malaysia Digital Hub, 81300 Skudai, Johor',                  'active',   'Gold',     82.10),
('PrimeTech Hardware Sdn Bhd',      'VND-006', 'Azlan Mohd Noor',     'info@primetech.my',         '+603-6143-2200', 'Kompleks Teknologi Prima, Jalan Duta, 50480 Kuala Lumpur',            'active',   'Silver',   78.90),
('ConnectAll Enterprise Sdn Bhd',   'VND-007', 'Priya Subramaniam',   'connect@connectall.my',     '+605-5291-4433', 'Perak Technology Park, 31400 Taiping, Perak',                         'active',   'Silver',   76.40),
('Vortex ICT Solutions Bhd',        'VND-008', 'Mohd Haziq Ramli',    'orders@vortexict.my',       '+603-9075-6622', 'Taman Teknologi Malaysia, 57000 Kuala Lumpur',                        'active',   'Silver',   74.20),
('InfraLink Sdn Bhd',               'VND-009', 'Lee Chong Wai',       'infralink@procurement.my',  '+603-2282-1100', 'KL Sentral Office Tower, 50470 Kuala Lumpur',                         'active',   'Silver',   72.50),
('DigitalEdge Components Sdn Bhd',  'VND-010', 'Salmah Binti Zain',   'sales@digitaledge.my',      '+604-6530-9988', 'Kulim Hi-Tech Park, 09000 Kulim, Kedah',                              'active',   'Probation',56.80),
('ApexNet Systems Sdn Bhd',         'VND-011', 'Vinod Krishnamurthy', 'apex@apexnet.my',           '+603-8921-7754', 'Putrajaya Technology Hub, 62000 Putrajaya',                           'active',   'Platinum', 92.60),
('FiberVision Sdn Bhd',             'VND-012', 'Fauziah Ahmad',       'fibre@fibervision.my',      '+607-2244-5566', 'Johor Bahru Tech City, 80300 Johor Bahru, Johor',                     'active',   'Gold',     86.70),
('TowerLink Malaysia Sdn Bhd',      'VND-013', 'Lim Boon Huat',       'procurement@towerlink.my',  '+603-4148-3300', 'Petaling Jaya Tech Park, 46150 PJ, Selangor',                         'active',   'Gold',     83.40),
('SafeRack Server Solutions',       'VND-014', 'Abdul Razak Husin',   'sales@saferack.my',         '+605-8731-2200', 'Ipoh Tech Corridor, 31400 Ipoh, Perak',                               'active',   'Silver',   77.30),
('OmniConnect Sdn Bhd',             'VND-015', 'Chew Mei San',        'omni@omniconnect.my',       '+603-3165-8877', 'Ara Damansara Business Park, 47301 PJ, Selangor',                     'active',   'Silver',   75.10),
('SwiftNet Hardware Bhd',           'VND-016', 'Khairul Anuar',       'swift@swiftnet.my',         '+604-3987-5500', 'Alor Setar Digital Park, 05100 Alor Setar, Kedah',                    'active',   'Silver',   73.60),
('QuantumFiber Sdn Bhd',            'VND-017', 'Suraya Hamid',        'fiber@quantumfiber.my',     '+603-8842-1199', 'Cyberjaya Enterprise Hub, 63000 Cyberjaya, Selangor',                 'active',   'Gold',     87.90),
('Pinnacle Tech Supply Sdn Bhd',    'VND-018', 'Gopal Krishna',       'pinnacle@ptssb.my',         '+603-2187-4400', 'Mid Valley City Tower, 59200 Kuala Lumpur',                           'active',   'Probation',58.30),
('LinkStar Enterprise',             'VND-019', 'Norzatul Aini',       'linkstar@lsent.my',         '+609-7651-3300', 'Kuantan Technology Park, 25200 Kuantan, Pahang',                      'active',   'Silver',   71.20),
('TeleCore Distributors Sdn Bhd',   'VND-020', 'Chan Kok Leong',      'telecore@tcd.my',           '+603-5511-7744', 'Subang Jaya IT Boulevard, 47500 Subang Jaya, Selangor',               'active',   'Gold',     84.90),
('BrightPath ICT Sdn Bhd',         'VND-021', 'Mazlinda Ramli',      'bright@brightpath.my',      '+607-8871-2200', 'Kota Tinggi Tech Zone, 81900 Kota Tinggi, Johor',                     'active',   'Silver',   70.80),
('StellarNet Components Bhd',       'VND-022', 'Param Kumaran',       'stellar@stellarnet.my',     '$+604-7720-5544', 'Georgetown Business Hub, 10050 Penang',                               'active',   'Probation',54.20),
('ProNet Malaysia Sdn Bhd',         'VND-023', 'Roslinda Jaafar',     'pronet@pnm.my',             '+603-6277-8833', 'Kepong Industrial Park, 52100 Kuala Lumpur',                          'active',   'Gold',     80.60),
('UltraLink Supply Sdn Bhd',        'VND-024', 'Suresh Balakrishnan', 'ultra@ultralink.my',        '+603-5191-6622', 'USJ Techno Park, 47600 Subang Jaya, Selangor',                        'active',   'Silver',   76.90),
('MatrixNet Solutions Sdn Bhd',     'VND-025', 'Hasrul Hisham',       'matrix@matrixnet.my',       '+604-9982-4411', 'Sungai Petani Tech Park, 08000 Sg Petani, Kedah',                     'active',   'Silver',   74.80),
('EcoTech Hardware Sdn Bhd',        'VND-026', 'Jennifer Tan',        'eco@ecotech.my',            '+607-5543-2200', 'Pasir Gudang Industrial Area, 81700 Pasir Gudang, Johor',             'active',   'Probation',57.40),
('NextGen Network Sdn Bhd',         'VND-027', 'Mohd Faris Zulkifli', 'nextgen@ngnetsb.my',        '+603-2148-9900', 'KLCC Office Suites, 50088 Kuala Lumpur',                              'active',   'Gold',     81.50),
('HighSpeed Telco Supply Bhd',      'VND-028', 'Kavitha Nair',        'highspeed@hstsb.my',        '+603-6258-3344', 'Mont Kiara Business Park, 50480 Kuala Lumpur',                        'active',   'Silver',   77.80),
('CoreNet Supplies Sdn Bhd',        'VND-029', 'Shahril Nizam',       'core@corenet.my',           '+604-4412-9900', 'Butterworth Industrial Estate, 13700 Butterworth, Penang',           'active',   'Silver',   72.30),
('TechGate Sdn Bhd',                'VND-030', 'Ong Chee Wah',        'techgate@tgsb.my',          '+607-2238-5511', 'Tampoi Industrial Zone, 81200 Johor Bahru, Johor',                   'active',   'Probation',53.10),
('NetworkPlus Malaysia Sdn Bhd',    'VND-031', 'Hamidah Mohd Salleh', 'netplus@networkplus.my',    '+603-9281-7766', 'Cheras Business Centre, 56100 Kuala Lumpur',                          'active',   'Gold',     83.70),
('InfraTech Supply Sdn Bhd',        'VND-032', 'Jeevan Pillai',       'infra@infratech.my',        '+605-3120-8844', 'Teluk Intan Industrial Park, 36000 Teluk Intan, Perak',               'active',   'Silver',   76.10),
('SpeedLink Components Sdn Bhd',    'VND-033', 'Fatimah Zaharah',     'speed@speedlink.my',        '+603-8736-2211', 'Kajang Tech Park, 43000 Kajang, Selangor',                            'active',   'Silver',   73.90),
('PowerCore Network Sdn Bhd',       'VND-034', 'David Lim Ah Seng',   'power@powercore.my',        '+604-5562-3300', 'Bayan Baru Tech Hub, 11950 Penang',                                   'active',   'Gold',     85.80),
('ClearPath ICT Solutions Bhd',     'VND-035', 'Aizat Mohd Aziz',     'clearpath@cpisb.my',        '+603-7784-9988', 'Damansara Utama Business Park, 47400 PJ, Selangor',                  'inactive', 'Unrated',  NULL);


-- -------------------------------------------------------------
-- Vendor SLA Contracts (one active contract per vendor)
-- Contracts started between Jan 2023 and Jan 2025
-- Platinum/Gold vendors: tighter SLA targets
-- Silver/Probation vendors: more relaxed targets
-- -------------------------------------------------------------
INSERT INTO vendor_sla_contracts
    (vendor_id, delivery_lead_time_days, sla_compliance_target_pct,
     quality_threshold_pct, max_return_rate_pct, contract_start_date, contract_end_date, is_current)
VALUES
-- Platinum vendors (VND-001, 002, 011) — strict SLAs
(1,  10, 97.00, 99.00, 1.50, '2024-01-15', NULL, 1),
(2,  10, 97.00, 99.00, 1.50, '2024-02-01', NULL, 1),
(11, 10, 97.00, 99.00, 1.50, '2024-01-10', NULL, 1),

-- Gold vendors — standard SLAs
(3,  14, 95.00, 98.00, 2.00, '2024-03-01', NULL, 1),
(4,  14, 95.00, 98.00, 2.00, '2024-01-20', NULL, 1),
(5,  14, 95.00, 98.00, 2.00, '2024-02-15', NULL, 1),
(12, 14, 95.00, 98.00, 2.00, '2024-01-05', NULL, 1),
(13, 14, 95.00, 98.00, 2.00, '2024-03-10', NULL, 1),
(17, 12, 96.00, 98.50, 1.80, '2024-02-20', NULL, 1),
(20, 14, 95.00, 98.00, 2.00, '2024-01-25', NULL, 1),
(23, 14, 95.00, 98.00, 2.00, '2024-04-01', NULL, 1),
(27, 14, 95.00, 98.00, 2.00, '2024-02-10', NULL, 1),
(31, 14, 95.00, 98.00, 2.00, '2024-03-15', NULL, 1),
(34, 14, 95.00, 98.00, 2.00, '2024-01-30', NULL, 1),

-- Silver vendors — relaxed SLAs
(6,  21, 92.00, 96.00, 3.00, '2023-07-01', NULL, 1),
(7,  21, 92.00, 96.00, 3.00, '2023-08-01', NULL, 1),
(8,  21, 92.00, 96.00, 3.00, '2023-09-01', NULL, 1),
(9,  21, 92.00, 96.00, 3.00, '2023-06-01', NULL, 1),
(14, 21, 92.00, 96.00, 3.00, '2023-10-01', NULL, 1),
(15, 21, 92.00, 96.00, 3.00, '2023-11-01', NULL, 1),
(16, 21, 92.00, 96.00, 3.00, '2023-07-15', NULL, 1),
(19, 28, 90.00, 95.00, 3.50, '2023-05-01', NULL, 1),
(21, 28, 90.00, 95.00, 3.50, '2023-08-15', NULL, 1),
(24, 21, 92.00, 96.00, 3.00, '2023-09-15', NULL, 1),
(25, 21, 92.00, 96.00, 3.00, '2023-10-15', NULL, 1),
(28, 21, 92.00, 96.00, 3.00, '2023-11-15', NULL, 1),
(29, 21, 92.00, 96.00, 3.00, '2023-06-15', NULL, 1),
(32, 21, 92.00, 96.00, 3.00, '2023-07-20', NULL, 1),
(33, 21, 92.00, 96.00, 3.00, '2023-08-20', NULL, 1),

-- Probation vendors — minimal SLAs, underperforming
(10, 30, 88.00, 93.00, 5.00, '2023-01-01', '2025-12-31', 1),
(18, 30, 88.00, 93.00, 5.00, '2023-03-01', '2025-12-31', 1),
(22, 30, 88.00, 93.00, 5.00, '2023-02-01', '2025-12-31', 1),
(26, 30, 88.00, 93.00, 5.00, '2023-04-01', '2025-12-31', 1),
(30, 30, 88.00, 93.00, 5.00, '2023-01-15', '2025-12-31', 1),

-- Inactive vendor
(35, 21, 90.00, 95.00, 3.00, '2023-01-01', '2024-06-30', 0);
