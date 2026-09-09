'use strict';
const svc = require('./analytics.service');

const vendorScorecards    = async (req, res, next) => { try { res.json({ success: true, data: await svc.vendorScorecards(req.query) }); } catch (e) { next(e); } };
const deliveryPerformance = async (req, res, next) => { try { res.json({ success: true, data: await svc.deliveryPerformance(req.query) }); } catch (e) { next(e); } };
const defectHeatmap       = async (req, res, next) => { try { res.json({ success: true, data: await svc.defectHeatmap(req.query) }); } catch (e) { next(e); } };
const poCycleTime         = async (req, res, next) => { try { res.json({ success: true, data: await svc.poCycleTime(req.query) }); } catch (e) { next(e); } };
const bottleneck          = async (req, res, next) => { try { res.json({ success: true, data: await svc.bottleneck() }); } catch (e) { next(e); } };
const inventoryStatus     = async (req, res, next) => { try { res.json({ success: true, data: await svc.inventoryStatus(req.query) }); } catch (e) { next(e); } };
const budgetUtilization   = async (req, res, next) => { try { res.json({ success: true, data: await svc.budgetUtilization(req.query) }); } catch (e) { next(e); } };
const pipeline            = async (req, res, next) => { try { res.json({ success: true, data: await svc.procurementPipeline(req.query) }); } catch (e) { next(e); } };
const kpis                = async (req, res, next) => { try { res.json({ success: true, data: await svc.kpis() }); } catch (e) { next(e); } };
const alerts              = async (req, res, next) => { try { const r = await svc.listAlerts(req.query); res.json({ success: true, data: r.rows, meta: { total: r.total } }); } catch (e) { next(e); } };
const ackAlert            = async (req, res, next) => { try { await svc.markAlertRead(+req.params.id, req.user.userId); res.json({ success: true, message: 'Alert marked as read.' }); } catch (e) { next(e); } };

module.exports = { vendorScorecards, deliveryPerformance, defectHeatmap, poCycleTime, bottleneck, inventoryStatus, budgetUtilization, pipeline, kpis, alerts, ackAlert };
