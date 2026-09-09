'use strict';
const svc = require('./procurement.service');

// PRs
const listPRs    = async (req, res, next) => { try { const r = await svc.listPRs(req.query); res.json({ success: true, data: r.rows, meta: { total: r.total } }); } catch (e) { next(e); } };
const getPR      = async (req, res, next) => { try { res.json({ success: true, data: await svc.getPR(+req.params.id) }); } catch (e) { next(e); } };
const createPR   = async (req, res, next) => { try { const data = await svc.createPR({ ...req.body, requestedById: req.user.userId }); res.status(201).json({ success: true, data }); } catch (e) { next(e); } };
const advancePR  = async (req, res, next) => { try { const data = await svc.advancePRStatus(+req.params.id, req.body.status, req.user.userId, req.body); res.json({ success: true, data }); } catch (e) { next(e); } };

// POs
const listPOs    = async (req, res, next) => { try { const r = await svc.listPOs(req.query); res.json({ success: true, data: r.rows, meta: { total: r.total } }); } catch (e) { next(e); } };
const getPO      = async (req, res, next) => { try { res.json({ success: true, data: await svc.getPO(+req.params.id) }); } catch (e) { next(e); } };
const createPO   = async (req, res, next) => { try { const data = await svc.createPO({ ...req.body, createdById: req.user.userId }); res.status(201).json({ success: true, data }); } catch (e) { next(e); } };
const advancePO  = async (req, res, next) => { try { const data = await svc.advancePOStatus(+req.params.id, req.body.status, req.user.userId, req.body.notes); res.json({ success: true, data }); } catch (e) { next(e); } };
const delivery   = async (req, res, next) => { try { const data = await svc.recordDelivery(+req.params.id, req.body, req.user.userId); res.json({ success: true, data }); } catch (e) { next(e); } };
const inspection = async (req, res, next) => { try { const data = await svc.recordInspection(+req.params.id, req.body, req.user.userId); res.json({ success: true, data }); } catch (e) { next(e); } };
const returns    = async (req, res, next) => { try { const data = await svc.recordReturn(+req.params.id, req.body, req.user.userId); res.status(201).json({ success: true, data }); } catch (e) { next(e); } };
const stages     = async (req, res, next) => { try { res.json({ success: true, data: await svc.getStages(+req.params.id) }); } catch (e) { next(e); } };

module.exports = { listPRs, getPR, createPR, advancePR, listPOs, getPO, createPO, advancePO, delivery, inspection, returns, stages };
