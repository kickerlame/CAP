'use strict';
const svc = require('./budgets.service');

const list     = async (req, res, next) => { try { const r = await svc.listBudgets(req.query); res.json({ success: true, data: r.rows, meta: { total: r.total } }); } catch (e) { next(e); } };
const getOne   = async (req, res, next) => { try { res.json({ success: true, data: await svc.getBudget(+req.params.id) }); } catch (e) { next(e); } };
const create   = async (req, res, next) => { try { const data = await svc.createBudget(req.body, req.user.userId); res.status(201).json({ success: true, data }); } catch (e) { next(e); } };
const update   = async (req, res, next) => { try { res.json({ success: true, data: await svc.updateBudget(+req.params.id, req.body) }); } catch (e) { next(e); } };
const txnAdd   = async (req, res, next) => { try { const data = await svc.addTransaction(+req.params.id, req.body, req.user.userId); res.status(201).json({ success: true, data }); } catch (e) { next(e); } };
const txnList  = async (req, res, next) => { try { const r = await svc.listTransactions(+req.params.id, req.query); res.json({ success: true, data: r.rows, meta: { total: r.total } }); } catch (e) { next(e); } };

module.exports = { list, getOne, create, update, txnAdd, txnList };
