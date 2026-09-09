'use strict';
const svc = require('./inventory.service');

const list    = async (req, res, next) => { try { const r = await svc.listInventory(req.query); res.json({ success: true, data: r.rows, meta: { total: r.total } }); } catch (e) { next(e); } };
const getOne  = async (req, res, next) => { try { res.json({ success: true, data: await svc.getInventoryItem(+req.params.id) }); } catch (e) { next(e); } };
const recalc  = async (req, res, next) => { try { res.json({ success: true, data: await svc.recalculate(+req.params.id) }); } catch (e) { next(e); } };
const txnList = async (req, res, next) => { try { const r = await svc.listTransactions(+req.params.id, req.query); res.json({ success: true, data: r.rows, meta: { total: r.total } }); } catch (e) { next(e); } };
const txnAdd  = async (req, res, next) => { try { await svc.recordTransaction(+req.params.id, req.body, req.user.userId); const item = await svc.recalculate(+req.params.id); res.status(201).json({ success: true, message: 'Transaction recorded.', data: item }); } catch (e) { next(e); } };
const items   = async (req, res, next) => { try { const r = await svc.listHardwareItems(req.query); res.json({ success: true, data: r.rows, meta: { total: r.total } }); } catch (e) { next(e); } };
const cats    = async (req, res, next) => { try { res.json({ success: true, data: await svc.listCategories() }); } catch (e) { next(e); } };

module.exports = { list, getOne, recalc, txnList, txnAdd, items, cats };
