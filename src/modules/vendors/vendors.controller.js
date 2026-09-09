'use strict';
const svc = require('./vendors.service');

const list        = async (req, res, next) => { try { const { page, limit, status, tier, search } = req.query; const r = await svc.listVendors({ page, limit, status, tier, search }); res.json({ success: true, data: r.rows, meta: { total: r.total } }); } catch (e) { next(e); } };
const getOne      = async (req, res, next) => { try { res.json({ success: true, data: await svc.getVendor(+req.params.id) }); } catch (e) { next(e); } };
const create      = async (req, res, next) => { try { res.status(201).json({ success: true, data: await svc.createVendor(req.body) }); } catch (e) { next(e); } };
const update      = async (req, res, next) => { try { res.json({ success: true, data: await svc.updateVendor(+req.params.id, req.body) }); } catch (e) { next(e); } };
const remove      = async (req, res, next) => { try { await svc.deleteVendor(+req.params.id); res.json({ success: true, message: 'Vendor deleted.' }); } catch (e) { next(e); } };
const snapshots   = async (req, res, next) => { try { const r = await svc.listSnapshots(+req.params.id, req.query); res.json({ success: true, data: r.rows, meta: { total: r.total } }); } catch (e) { next(e); } };
const recalc      = async (req, res, next) => { try { res.json({ success: true, data: await svc.calculateSnapshot(+req.params.id) }); } catch (e) { next(e); } };
const getSLA      = async (req, res, next) => { try { res.json({ success: true, data: await svc.getCurrentSLA(+req.params.id) }); } catch (e) { next(e); } };
const createSLA   = async (req, res, next) => { try { res.status(201).json({ success: true, data: await svc.createSLA(+req.params.id, req.body) }); } catch (e) { next(e); } };

module.exports = { list, getOne, create, update, remove, snapshots, recalc, getSLA, createSLA };
