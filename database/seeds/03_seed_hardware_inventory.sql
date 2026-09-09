-- =============================================================
-- VPPT — Vendor & Procurement Performance Tracker
-- File: 03_seed_hardware_inventory.sql
-- Purpose: Seed hardware categories, hardware items (100+ items),
--          and inventory records with initial stock levels.
-- Currency: MYR (Malaysian Ringgit)
-- Run after: 02_seed_vendors.sql
-- =============================================================

USE vppt;

-- -------------------------------------------------------------
-- Hardware Categories (12 categories)
-- -------------------------------------------------------------
INSERT INTO hardware_categories (category_name, description) VALUES
('Router',              'Layer 3 network routing devices for WAN/LAN connectivity'),
('Network Switch',      'Layer 2/3 switching devices for local area network segments'),
('Fiber Optic Cable',   'Single-mode and multi-mode optical fiber cabling'),
('SFP Module',          'Small Form-factor Pluggable optical transceivers'),
('Server Rack',         'Rack enclosures and accessories for data centre equipment'),
('Server',              'Physical rack and blade server hardware'),
('UPS Unit',            'Uninterruptible Power Supply units for power protection'),
('Access Point',        'Wireless 802.11 access points for WLAN infrastructure'),
('Network Transceiver', 'QSFP, QSFP+, and QSFP28 high-speed transceivers'),
('Patch Panel',         'Structured cabling patch panels for cable management'),
('Ethernet Cable',      'Cat5e, Cat6, and Cat6A copper patch and bulk cables'),
('PDU',                 'Power Distribution Units for rack and data centre power management');


-- -------------------------------------------------------------
-- Hardware Items (100 items across 12 categories)
-- Prices in MYR
-- -------------------------------------------------------------
INSERT INTO hardware_items
    (category_id, item_name, item_code, brand, model, unit_of_measure, unit_cost, safety_stock, lead_time_days)
VALUES
-- ----------------------------------------------------------------
-- Category 1: Routers
-- ----------------------------------------------------------------
(1, 'Enterprise Core Router 10G',          'RTR-ENT-001', 'Cisco',       'ISR 4451-X',        'unit',  22500.00, 2, 21),
(1, 'Enterprise Edge Router Dual WAN',     'RTR-ENT-002', 'Cisco',       'ASR 1001-X',        'unit',  35800.00, 2, 21),
(1, 'SMB Gigabit Router 8-Port',           'RTR-SMB-001', 'MikroTik',    'CCR2004-1G-12S+2XS','unit',   4200.00, 5, 14),
(1, 'SOHO Broadband Router WiFi 6',        'RTR-SOH-001', 'Ubiquiti',    'UniFi Dream Machine','unit',  1850.00, 10, 14),
(1, 'Data Centre Core Router 100G',        'RTR-DC-001',  'Juniper',     'MX204',             'unit',  98000.00, 1, 30),
(1, 'Branch Office Router 4G LTE',        'RTR-BR-001',  'Draytek',     'Vigor 2927Lac',     'unit',   2100.00, 5, 14),
(1, 'Carrier-Grade Router',               'RTR-CG-001',  'Huawei',      'NE40E-X3',          'unit', 185000.00, 1, 45),
(1, 'Load Balancer Router 2WAN',          'RTR-LB-001',  'Peplink',     'Balance 310X',      'unit',   6800.00, 3, 21),

-- ----------------------------------------------------------------
-- Category 2: Network Switches
-- ----------------------------------------------------------------
(2, '24-Port Gigabit Managed Switch',      'SWT-GIG-001', 'Cisco',       'SG350-28',          'unit',   3200.00, 5, 14),
(2, '48-Port Gigabit PoE+ Managed Switch', 'SWT-POE-001', 'Cisco',       'SG350P-48',         'unit',   5600.00, 3, 14),
(2, '24-Port 10G SFP+ Managed Switch',    'SWT-10G-001', 'Juniper',     'EX2300-24P',        'unit',  12500.00, 3, 21),
(2, '48-Port 10G Core Switch Stack',      'SWT-COR-001', 'Cisco',       'Catalyst 9300-48P', 'unit',  28000.00, 2, 21),
(2, '8-Port Gigabit Desktop Switch',      'SWT-DSK-001', 'TP-Link',     'TL-SG108E',         'unit',    320.00, 20, 7),
(2, '16-Port Gigabit Unmanaged Switch',   'SWT-UMG-001', 'Netgear',     'GS316',             'unit',    680.00, 10, 7),
(2, '48-Port Data Centre Leaf Switch',    'SWT-LEAF-001','Arista',      '7050CX3-32S',       'unit',  45000.00, 2, 30),
(2, '24-Port PoE Gigabit Layer 2 Switch', 'SWT-L2P-001', 'HP',          'HPE 1920S-24G-PoE+','unit',   2800.00, 5, 14),

-- ----------------------------------------------------------------
-- Category 3: Fiber Optic Cable
-- ----------------------------------------------------------------
(3, 'Single-Mode Fiber OS2 9/125 1m',     'FOC-SM-001',  'CommScope',   'OS2 Patch LC-LC',   'pcs',     35.00, 100, 7),
(3, 'Multi-Mode Fiber OM3 50/125 1m',     'FOC-MM-001',  'CommScope',   'OM3 Patch LC-LC',   'pcs',     28.00, 100, 7),
(3, 'Outdoor Armored SM Fiber 12-Core',   'FOC-OA-001',  'Prysmian',    'ADSS-12SM',         'meter',   18.50, 500, 14),
(3, 'Indoor Distribution Fiber 6-Core',   'FOC-ID-001',  'Belden',      'FiberExpress 6C',   'meter',   12.00, 300, 14),
(3, 'Pre-Terminated MPO Trunk 24F 10m',   'FOC-MPO-001', 'Corning',     'MTP-24F OS2 10m',   'pcs',    420.00, 20, 14),
(3, 'SC-LC Duplex SM Fiber Patch 3m',     'FOC-SCL-001', 'Panduit',     'SC-LC OS2 3m',      'pcs',     22.00, 200, 7),

-- ----------------------------------------------------------------
-- Category 4: SFP Modules
-- ----------------------------------------------------------------
(4, 'SFP+ 10G SR Multi-Mode 300m',        'SFP-10GSR-001','Cisco',      'SFP-10G-SR',        'unit',    480.00, 30, 14),
(4, 'SFP+ 10G LR Single-Mode 10km',       'SFP-10GLR-001','Cisco',      'SFP-10G-LR',        'unit',    720.00, 20, 14),
(4, 'SFP 1G SX Multi-Mode 550m',          'SFP-1GSX-001', 'Cisco',      'GLC-SX-MMD',        'unit',    280.00, 30, 14),
(4, 'SFP 1G LX Single-Mode 10km',         'SFP-1GLX-001', 'Cisco',      'GLC-LH-SMD',        'unit',    350.00, 20, 14),
(4, 'QSFP+ 40G SR4 Multi-Mode',           'QSFP-40G-001', 'Arista',     'QSFP-40G-SR4',      'unit',   1200.00, 10, 21),
(4, 'QSFP28 100G LR4 Single-Mode',        'QSFP-100G-001','Juniper',    'QSFP-100G-LR4',     'unit',   3800.00, 5, 21),
(4, 'SFP+ 10G BiDi TX1270/RX1330',        'SFP-BIDI-001', 'Finisar',    'FTLX1475D3BCL',     'unit',    680.00, 15, 14),

-- ----------------------------------------------------------------
-- Category 5: Server Racks
-- ----------------------------------------------------------------
(5, '42U Server Rack 800x1000mm',          'RCK-42U-001', 'APC',         'NetShelter SX 42U', 'unit',   6500.00, 3, 21),
(5, '24U Wall-Mount Server Cabinet',       'RCK-24U-001', 'Schneider',   'SRWF1024WF',        'unit',   2800.00, 5, 14),
(5, '47U Open Frame Rack',                 'RCK-47U-001', 'Rittal',      'TS IT 47U',         'unit',   4200.00, 2, 21),
(5, 'Rack Shelf 1U Fixed 450mm',           'RCK-SHF-001', 'Generic',     'RS-1U-450',         'unit',    180.00, 20, 7),
(5, 'Blanking Panel 1U Kit (10pcs)',       'RCK-BLK-001', 'APC',         'AR8136BLK',         'kit',     120.00, 30, 7),
(5, 'Cable Management 2U Horizontal',     'RCK-CBM-001', 'Panduit',     'WMPF2E',            'unit',    580.00, 10, 14),

-- ----------------------------------------------------------------
-- Category 6: Servers
-- ----------------------------------------------------------------
(6, 'Rack Server 1U Dual Xeon 64GB',       'SRV-1U-001',  'Dell',        'PowerEdge R650',    'unit',  38000.00, 2, 30),
(6, 'Rack Server 2U Dual Xeon 128GB',      'SRV-2U-001',  'Dell',        'PowerEdge R750',    'unit',  58000.00, 2, 30),
(6, 'Blade Chassis 10-slot',              'SRV-BLD-001', 'HP',          'ProLiant BL465c',   'unit',  95000.00, 1, 45),
(6, 'Tower Server Xeon 32GB',             'SRV-TWR-001', 'HP',          'ProLiant ML350 G10','unit',  22000.00, 2, 30),
(6, 'GPU Compute Server 4xA100',          'SRV-GPU-001', 'Supermicro',  'SYS-420GP-TNR',     'unit', 280000.00, 1, 60),
(6, 'Hyper-Converged Node 2.5TB NVMe',    'SRV-HCI-001', 'Nutanix',     'NX-3155G-G8',       'unit', 145000.00, 1, 60),

-- ----------------------------------------------------------------
-- Category 7: UPS Units
-- ----------------------------------------------------------------
(7, 'UPS Tower 1500VA 900W',              'UPS-1K5-001', 'APC',         'Smart-UPS 1500VA',  'unit',   3200.00, 5, 14),
(7, 'UPS Tower 3000VA 2700W',             'UPS-3K-001',  'APC',         'Smart-UPS 3000VA',  'unit',   6800.00, 3, 14),
(7, 'UPS Rack 2U 3000VA Online',          'UPS-R3K-001', 'Eaton',       '9PX3000RT',         'unit',   8500.00, 3, 21),
(7, 'UPS 10kVA 3-Phase Online',           'UPS-10K-001', 'APC',         'Symmetra 10kVA',    'unit',  42000.00, 1, 30),
(7, 'UPS 20kVA Online Double-Conversion', 'UPS-20K-001', 'Schneider',   'Galaxy VS 20kVA',   'unit',  88000.00, 1, 45),
(7, 'UPS Battery Module Extension',       'UPS-BAT-001', 'APC',         'SURT192XLBP',       'unit',   2400.00, 10, 14),

-- ----------------------------------------------------------------
-- Category 8: Access Points
-- ----------------------------------------------------------------
(8, 'Indoor WiFi 6 AP 802.11ax 4x4',     'WAP-W6I-001', 'Cisco',       'Aironet 9120AX',    'unit',   2800.00, 10, 14),
(8, 'Outdoor WiFi 6 AP Weatherproof',    'WAP-W6O-001', 'Cisco',       'Catalyst 9124AXD',  'unit',   4500.00, 5, 14),
(8, 'Indoor WiFi 6 AP UniFi Ceiling',    'WAP-UFI-001', 'Ubiquiti',    'UniFi U6-Pro',      'unit',   1200.00, 15, 7),
(8, 'High-Density AP WiFi 6 Stadium',    'WAP-HDA-001', 'Aruba',       'AP-575',            'unit',   6200.00, 3, 21),
(8, 'Outdoor Mesh AP WiFi 6E',           'WAP-MSH-001', 'Aruba',       'AP-577EX',          'unit',   7800.00, 3, 21),
(8, 'Indoor WiFi 5 AP 802.11ac Wave2',   'WAP-W5I-001', 'Ruckus',      'R510',              'unit',   1850.00, 10, 14),

-- ----------------------------------------------------------------
-- Category 9: Network Transceivers (QSFP variants)
-- ----------------------------------------------------------------
(9, 'QSFP28 100G SR4 OM4 Multi-Mode',    'TRX-100SR-001','Cisco',      'QSFP-100G-SR4-S',   'unit',   2200.00, 10, 21),
(9, 'QSFP28 100G LR4 10km SM',           'TRX-100LR-001','Arista',     'QSFP-100G-LR4',     'unit',   4500.00, 5, 21),
(9, 'QSFP-DD 400G DR4 Single-Mode',      'TRX-400G-001', 'Lumentum',   'QSFP-DD 400G-DR4',  'unit',  12000.00, 3, 30),
(9, 'QSFP+ 40G LR4 SM 10km',            'TRX-40LR-001', 'Finisar',    'FTL4C1QE1C',        'unit',   2800.00, 8, 21),
(9, 'QSFP+ 40G BIDI 20km SM',           'TRX-40BD-001', 'Avago',      'AFCT-5765APZLG',    'unit',   3200.00, 5, 21),

-- ----------------------------------------------------------------
-- Category 10: Patch Panels
-- ----------------------------------------------------------------
(10, '24-Port Cat6 Patch Panel 1U',       'PPL-C6-001',   'Panduit',    'CP24WBLY',          'unit',    450.00, 20, 7),
(10, '48-Port Cat6A Patch Panel 2U',      'PPL-C6A-001',  'Belden',     'MDVO48WH',          'unit',    920.00, 10, 7),
(10, '24-Port LC Duplex Fiber Panel',     'PPL-FBR-001',  'Corning',    'CCH-01U',           'unit',    680.00, 10, 14),
(10, '48-Port Angled Cat6 Patch Panel',   'PPL-ANG-001',  'CommScope',  'M2000',             'unit',   1100.00, 8, 14),
(10, '24-Port Keystone Blank Panel',      'PPL-BLK-001',  'Leviton',    '41CB2-24T',         'unit',    380.00, 15, 7),

-- ----------------------------------------------------------------
-- Category 11: Ethernet Cables
-- ----------------------------------------------------------------
(11, 'Cat6 UTP Patch Cable 1m Blue',      'CAB-C6-1M',    'Belden',     '7964A',             'pcs',      18.00, 200, 7),
(11, 'Cat6 UTP Patch Cable 2m Blue',      'CAB-C6-2M',    'Belden',     '7964A 2m',          'pcs',      22.00, 200, 7),
(11, 'Cat6 UTP Patch Cable 5m Grey',      'CAB-C6-5M',    'Belden',     '7964A 5m',          'pcs',      35.00, 100, 7),
(11, 'Cat6A STP Patch Cable 1m',          'CAB-C6A-1M',   'Panduit',    'UTPSP1MBUY',        'pcs',      42.00, 100, 7),
(11, 'Cat6A STP Patch Cable 3m',          'CAB-C6A-3M',   'Panduit',    'UTPSP3MBUY',        'pcs',      55.00, 100, 7),
(11, 'Cat6 Solid Core Bulk Cable 305m',   'CAB-C6-BLK',   'Belden',     '7964A 305m',        'roll',   1800.00, 10, 14),
(11, 'Cat5e UTP Patch Cable 2m Blue',     'CAB-C5E-2M',   'Nexans',     'LANmark-5 2m',      'pcs',      12.00, 300, 7),
(11, 'Cat5e Solid Core Bulk Cable 305m',  'CAB-C5E-BLK',  'Nexans',     'LANmark-5 305m',    'roll',   1200.00, 10, 14),

-- ----------------------------------------------------------------
-- Category 12: PDUs
-- ----------------------------------------------------------------
(12, 'Basic PDU 1U 8-Outlet 16A',         'PDU-BSC-001',  'APC',        'AP9559',            'unit',    680.00, 10, 14),
(12, 'Metered PDU 1U 8-Outlet 16A',       'PDU-MTR-001',  'APC',        'AP8858',            'unit',   1200.00, 8, 14),
(12, 'Switched PDU 1U 8-Outlet 16A',      'PDU-SWT-001',  'APC',        'AP7920B',           'unit',   2800.00, 5, 21),
(12, 'Intelligent PDU 0U 24-Outlet',      'PDU-INT-001',  'Raritan',    'PX3-5190R',         'unit',   5500.00, 3, 21),
(12, 'Rack PDU 2U 3-Phase 32A 12-Out',    'PDU-3PH-001',  'Schneider',  'APDU9960',          'unit',   8200.00, 2, 30);


-- -------------------------------------------------------------
-- Inventory Records (one per hardware item, with realistic stock)
-- Computed values (ADC, ROP, EDR) will be recalculated by the
-- service when seed data is loaded. Initial values shown here
-- are estimates to make the initial dashboard meaningful.
-- -------------------------------------------------------------
INSERT INTO inventory
    (item_id, current_stock, avg_daily_consumption, reorder_point,
     estimated_days_remaining, risk_level, last_calculated_at)
VALUES
-- Routers (items 1–8)
(1,  6,   0.0274, 2.5754,  219.0, 'NORMAL',   NOW()),
(2,  4,   0.0137, 1.2877,  292.0, 'NORMAL',   NOW()),
(3,  18,  0.0822, 2.1508,  219.0, 'NORMAL',   NOW()),
(4,  32,  0.2055, 3.8770,  155.7, 'NORMAL',   NOW()),
(5,  2,   0.0068, 1.2032,  294.1, 'NORMAL',   NOW()),
(6,  24,  0.1370, 2.9180,  175.2, 'NORMAL',   NOW()),
(7,  1,   0.0034, 1.1530,  294.1, 'NORMAL',   NOW()),
(8,  12,  0.0548, 2.1508,  219.0, 'NORMAL',   NOW()),

-- Network Switches (items 9–16)
(9,  25,  0.3425, 9.7925,   73.0, 'NORMAL',   NOW()),
(10, 15,  0.2192, 5.0888,   68.4, 'WARNING',  NOW()),
(11, 10,  0.1370, 3.8770,   73.0, 'WARNING',  NOW()),
(12, 6,   0.0822, 2.7254,   73.0, 'NORMAL',   NOW()),
(13, 85,  0.9589, 16.7123,  88.6, 'NORMAL',   NOW()),
(14, 40,  0.4110, 7.9310,   97.3, 'NORMAL',   NOW()),
(15, 3,   0.0411, 2.2330,   73.0, 'WARNING',  NOW()),
(16, 22,  0.2740, 6.3940,   80.3, 'NORMAL',   NOW()),

-- Fiber Optic Cables (items 17–22)
(17, 320, 3.5616, 97.8192,  89.8, 'NORMAL',   NOW()),
(18, 280, 2.8493, 79.8001,  98.3, 'NORMAL',   NOW()),
(19, 850, 8.2192, 172.5888, 103.4,'NORMAL',   NOW()),
(20, 620, 5.4795, 104.9930, 113.1,'NORMAL',   NOW()),
(21, 48,  0.5479, 11.7058,   87.6,'NORMAL',   NOW()),
(22, 180, 2.1918, 49.3126,   82.1,'NORMAL',   NOW()),

-- SFP Modules (items 23–29)
(23, 55,  0.6575, 19.8050,   83.7,'NORMAL',   NOW()),
(24, 38,  0.4110, 13.1540,   92.5,'NORMAL',   NOW()),
(25, 72,  0.8767, 28.2010,   82.1,'NORMAL',   NOW()),
(26, 44,  0.5479, 18.0558,   80.3,'NORMAL',   NOW()),
(27, 12,  0.1644, 5.7500,    73.0,'WARNING',  NOW()),
(28, 6,   0.0822, 3.2760,    73.0,'WARNING',  NOW()),
(29, 28,  0.3288, 9.9032,    85.2,'NORMAL',   NOW()),

-- Server Racks (items 30–35)
(30, 8,   0.0685, 2.4385,   116.8,'NORMAL',   NOW()),
(31, 14,  0.0959, 2.0097,   145.9,'NORMAL',   NOW()),
(32, 5,   0.0411, 1.8631,   121.7,'NORMAL',   NOW()),
(33, 60,  0.4110, 8.8310,   145.9,'NORMAL',   NOW()),
(34, 100, 0.8219, 15.8590,  121.7,'NORMAL',   NOW()),
(35, 32,  0.2740, 5.7580,   116.8,'NORMAL',   NOW()),

-- Servers (items 36–41)
(36, 4,   0.0548, 2.6508,    73.0,'WARNING',  NOW()),
(37, 3,   0.0411, 2.2330,    73.0,'WARNING',  NOW()),
(38, 1,   0.0137, 1.6233,    73.0,'CRITICAL', NOW()),
(39, 5,   0.0685, 2.0550,    73.0,'WARNING',  NOW()),
(40, 1,   0.0068, 1.3040,   147.1,'NORMAL',   NOW()),
(41, 1,   0.0068, 1.3040,   147.1,'NORMAL',   NOW()),

-- UPS Units (items 42–47)
(42, 18,  0.1644, 3.3016,   109.5,'NORMAL',   NOW()),
(43, 10,  0.0959, 2.4257,   104.3,'NORMAL',   NOW()),
(44, 8,   0.0822, 2.5266,    97.3,'NORMAL',   NOW()),
(45, 3,   0.0274, 1.7220,   109.5,'WARNING',  NOW()),
(46, 1,   0.0137, 1.6163,    73.0,'CRITICAL', NOW()),
(47, 28,  0.2740, 4.9660,   102.2,'NORMAL',   NOW()),

-- Access Points (items 48–53)
(48, 35,  0.4110, 6.7540,    85.2,'NORMAL',   NOW()),
(49, 18,  0.1918, 3.6938,    93.8,'NORMAL',   NOW()),
(50, 68,  0.9589, 16.7123,   70.9,'NORMAL',   NOW()),
(51, 8,   0.0959, 3.0097,    83.4,'WARNING',  NOW()),
(52, 6,   0.0822, 2.7254,    73.0,'WARNING',  NOW()),
(53, 42,  0.5753, 9.7031,    73.0,'NORMAL',   NOW()),

-- Network Transceivers (items 54–58)
(54, 22,  0.2466, 7.3970,    89.2,'NORMAL',   NOW()),
(55, 14,  0.1644, 5.4708,    85.2,'NORMAL',   NOW()),
(56, 4,   0.0411, 2.2330,    97.3,'WARNING',  NOW()),
(57, 18,  0.2192, 6.5936,    82.1,'NORMAL',   NOW()),
(58, 12,  0.1370, 4.3770,    87.6,'NORMAL',   NOW()),

-- Patch Panels (items 59–63)
(59, 45,  0.5479, 11.7058,   82.1,'NORMAL',   NOW()),
(60, 22,  0.2740, 6.3940,    80.3,'NORMAL',   NOW()),
(61, 18,  0.2192, 5.0888,    82.1,'NORMAL',   NOW()),
(62, 16,  0.2055, 4.8770,    77.9,'NORMAL',   NOW()),
(63, 30,  0.4110, 8.8310,    73.0,'NORMAL',   NOW()),

-- Ethernet Cables (items 64–71)
(64, 450, 5.4795, 45.3565,   82.1,'NORMAL',   NOW()),
(65, 380, 4.6575, 38.0025,   81.6,'NORMAL',   NOW()),
(66, 220, 2.7397, 24.1779,   80.3,'NORMAL',   NOW()),
(67, 280, 3.2877, 28.0139,   85.2,'NORMAL',   NOW()),
(68, 200, 2.4658, 21.2606,   81.1,'NORMAL',   NOW()),
(69, 22,  0.2192, 3.5344,   100.4,'NORMAL',   NOW()),
(70, 520, 6.8493, 50.9451,   75.9,'NORMAL',   NOW()),
(71, 18,  0.1918, 2.8438,    93.8,'NORMAL',   NOW()),

-- PDUs (items 72–76)
(72, 22,  0.2192, 3.7228,   100.4,'NORMAL',   NOW()),
(73, 16,  0.1644, 2.9252,    97.3,'NORMAL',   NOW()),
(74, 10,  0.0959, 2.4257,   104.3,'NORMAL',   NOW()),
(75, 6,   0.0548, 2.1508,   109.5,'NORMAL',   NOW()),
(76, 4,   0.0274, 1.6220,   145.9,'NORMAL',   NOW());
