'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.test') });

const request        = require('supertest');
const app            = require('../src/app');
const { authHeader } = require('./helpers/auth');
const { db } = require('./helpers/db');

afterAll(async () => { await db.end(); });

const BASE = '/api/v1/analytics';

// Helper to check a response is a successful array response
const expectDataArray = (res) => {
  expect(res.status).toBe(200);
  expect(res.body.success).toBe(true);
  expect(Array.isArray(res.body.data)).toBe(true);
};

// =============================================================
// GET /analytics/kpis
// =============================================================
describe('GET /analytics/kpis', () => {
  it('returns all KPI metrics', async () => {
    const res = await request(app)
      .get(`${BASE}/kpis`)
      .set(await authHeader('manager'));
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('openPRs');
    expect(res.body.data).toHaveProperty('openPOs');
    expect(res.body.data).toHaveProperty('criticalStockItems');
    expect(res.body.data).toHaveProperty('avgCycleDays');
    expect(res.body.data).toHaveProperty('avgBudgetUtilPct');
    expect(res.body.data).toHaveProperty('onTimeDeliveryPct');
    expect(res.body.data).toHaveProperty('unresolvedAlerts');
    // All values should be numeric or null
    expect(typeof res.body.data.openPRs).toBe('number');
    expect(typeof res.body.data.openPOs).toBe('number');
    expect(typeof res.body.data.criticalStockItems).toBe('number');
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get(`${BASE}/kpis`);
    expect(res.status).toBe(401);
  });
});

// =============================================================
// GET /analytics/vendor-scorecards
// =============================================================
describe('GET /analytics/vendor-scorecards', () => {
  it('returns vendor scorecard data', async () => {
    const res = await request(app)
      .get(`${BASE}/vendor-scorecards`)
      .set(await authHeader('manager'));
    expectDataArray(res);
    if (res.body.data.length > 0) {
      expect(res.body.data[0]).toHaveProperty('vendor_name');
      expect(res.body.data[0]).toHaveProperty('overall_score');
    }
  });

  it('filters by tier=Platinum', async () => {
    const res = await request(app)
      .get(`${BASE}/vendor-scorecards?tier=Platinum`)
      .set(await authHeader('manager'));
    expect(res.status).toBe(200);
    res.body.data.forEach((v) => expect(v.tier).toBe('Platinum'));
  });

  it('filters by status=active', async () => {
    const res = await request(app)
      .get(`${BASE}/vendor-scorecards?status=active`)
      .set(await authHeader('manager'));
    expect(res.status).toBe(200);
    res.body.data.forEach((v) => expect(v.vendor_status).toBe('active'));
  });
});

// =============================================================
// GET /analytics/delivery-performance
// =============================================================
describe('GET /analytics/delivery-performance', () => {
  it('returns delivery performance data with summary', async () => {
    const res = await request(app)
      .get(`${BASE}/delivery-performance`)
      .set(await authHeader('manager'));
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('summary');
    expect(res.body.data).toHaveProperty('rows');
    expect(res.body.data.summary).toHaveProperty('total');
    expect(res.body.data.summary).toHaveProperty('onTimePct');
  });

  it('filters by vendorId', async () => {
    const res = await request(app)
      .get(`${BASE}/delivery-performance?vendorId=1`)
      .set(await authHeader('manager'));
    expect(res.status).toBe(200);
    res.body.data.rows.forEach((r) => expect(r.vendor_id).toBe(1));
  });

  it('filters by date range', async () => {
    const res = await request(app)
      .get(`${BASE}/delivery-performance?dateFrom=2024-01-01&dateTo=2024-12-31`)
      .set(await authHeader('manager'));
    expect(res.status).toBe(200);
    // All deliveries should be within the 2024 date range
    res.body.data.rows.forEach((r) => {
      if (r.actual_date) {
        expect(r.actual_date >= '2024-01-01').toBe(true);
        expect(r.actual_date <= '2024-12-31').toBe(true);
      }
    });
  });
});

// =============================================================
// GET /analytics/defect-heatmap
// =============================================================
describe('GET /analytics/defect-heatmap', () => {
  it('returns defect heatmap data by vendor × category', async () => {
    const res = await request(app)
      .get(`${BASE}/defect-heatmap`)
      .set(await authHeader('manager'));
    expectDataArray(res);
    if (res.body.data.length > 0) {
      const row = res.body.data[0];
      expect(row).toHaveProperty('vendor_name');
      expect(row).toHaveProperty('category_name');
      expect(row).toHaveProperty('defect_rate_pct');
    }
  });
});

// =============================================================
// GET /analytics/po-cycle-time
// =============================================================
describe('GET /analytics/po-cycle-time', () => {
  it('returns PO cycle time data with average summary', async () => {
    const res = await request(app)
      .get(`${BASE}/po-cycle-time`)
      .set(await authHeader('manager'));
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('summary');
    expect(res.body.data.summary).toHaveProperty('avgCycleDays');
    expect(res.body.data).toHaveProperty('rows');
    if (res.body.data.rows.length > 0) {
      expect(res.body.data.rows[0]).toHaveProperty('total_cycle_days');
    }
  });
});

// =============================================================
// GET /analytics/bottleneck
// =============================================================
describe('GET /analytics/bottleneck', () => {
  it('returns bottleneck summary by stage', async () => {
    const res = await request(app)
      .get(`${BASE}/bottleneck`)
      .set(await authHeader('manager'));
    expectDataArray(res);
    if (res.body.data.length > 0) {
      const stage = res.body.data[0];
      expect(stage).toHaveProperty('stage_name');
      expect(stage).toHaveProperty('avg_duration_hours');
      expect(stage).toHaveProperty('delay_pct');
      expect(stage).toHaveProperty('delayed_count');
    }
  });
});

// =============================================================
// GET /analytics/inventory-status
// =============================================================
describe('GET /analytics/inventory-status', () => {
  it('returns inventory status from view', async () => {
    const res = await request(app)
      .get(`${BASE}/inventory-status`)
      .set(await authHeader('manager'));
    expectDataArray(res);
    if (res.body.data.length > 0) {
      const item = res.body.data[0];
      expect(item).toHaveProperty('current_stock');
      expect(item).toHaveProperty('risk_level');
      expect(item).toHaveProperty('stock_value');
    }
  });

  it('filters by riskLevel', async () => {
    const res = await request(app)
      .get(`${BASE}/inventory-status?riskLevel=CRITICAL`)
      .set(await authHeader('manager'));
    expect(res.status).toBe(200);
    res.body.data.forEach((i) => expect(i.risk_level).toBe('CRITICAL'));
  });
});

// =============================================================
// GET /analytics/budget-utilization
// =============================================================
describe('GET /analytics/budget-utilization', () => {
  it('returns budget utilization from view', async () => {
    const res = await request(app)
      .get(`${BASE}/budget-utilization`)
      .set(await authHeader('manager'));
    expectDataArray(res);
    if (res.body.data.length > 0) {
      expect(res.body.data[0]).toHaveProperty('utilization_pct');
    }
  });
});

// =============================================================
// GET /analytics/procurement-pipeline
// =============================================================
describe('GET /analytics/procurement-pipeline', () => {
  it('returns live procurement pipeline data', async () => {
    const res = await request(app)
      .get(`${BASE}/procurement-pipeline`)
      .set(await authHeader('manager'));
    expectDataArray(res);
    if (res.body.data.length > 0) {
      expect(res.body.data[0]).toHaveProperty('pr_number');
      expect(res.body.data[0]).toHaveProperty('pr_status');
    }
  });
});

// =============================================================
// GET /analytics/alerts
// =============================================================
describe('GET /analytics/alerts', () => {
  it('returns unresolved alerts', async () => {
    const res = await request(app)
      .get(`${BASE}/alerts`)
      .set(await authHeader('admin'));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('filters by severity=critical', async () => {
    const res = await request(app)
      .get(`${BASE}/alerts?severity=critical`)
      .set(await authHeader('admin'));
    expect(res.status).toBe(200);
    res.body.data.forEach((a) => expect(a.severity).toBe('critical'));
  });
});

// =============================================================
// PATCH /analytics/alerts/:id/read
// =============================================================
describe('PATCH /analytics/alerts/:id/read', () => {
  it('marks an alert as read', async () => {
    // Get first unread alert
    const listRes = await request(app)
      .get(`${BASE}/alerts?isRead=false`)
      .set(await authHeader('admin'));

    if (listRes.body.data.length === 0) {
      // No unread alerts — skip
      return;
    }
    const alertId = listRes.body.data[0].alert_id;

    const res = await request(app)
      .patch(`${BASE}/alerts/${alertId}/read`)
      .set(await authHeader('admin'));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
