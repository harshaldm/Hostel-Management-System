const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { isAuthenticated } = require('../middleware/auth');

router.use(isAuthenticated);

router.get('/', (req, res) => {
    res.redirect('/sports/dashboard');
});

router.get('/dashboard', async (req, res) => {
    try {
        const [items] = await db.query('SELECT * FROM Sports_Items ORDER BY item_name');
        const [issues] = await db.query(`
            SELECT i.*, s.name, si.item_name 
            FROM Sports_Issues i 
            JOIN Students s ON i.bt_no = s.bt_no 
            JOIN Sports_Items si ON i.item_id = si.item_id
            WHERE i.status = 'Issued'
            ORDER BY i.issue_date DESC
        `);
        const [fines] = await db.query('SELECT * FROM Sports_Fines');
        
        const totalItems = items.reduce((sum, item) => sum + item.total_quantity, 0);
        const availableItems = items.reduce((sum, item) => sum + item.available_quantity, 0);
        const issuedItems = totalItems - availableItems;
        const totalFines = fines.reduce((sum, f) => sum + parseFloat(f.fine_amount || 0), 0);
        
        res.render('sports/dashboard', { 
            items, issues, fines, 
            stats: { totalItems, availableItems, issuedItems, totalFines, totalItemsCount: items.length },
            page: 'sports-dashboard' 
        });
    } catch (err) {
        res.render('sports/dashboard', { items: [], issues: [], fines: [], stats: { totalItems: 0, availableItems: 0, issuedItems: 0, totalFines: 0, totalItemsCount: 0 }, page: 'sports-dashboard', error: err.message });
    }
});

router.get('/inventory', async (req, res) => {
    try {
        const [items] = await db.query('SELECT * FROM Sports_Items ORDER BY item_name');
        res.render('sports/inventory', { items, page: 'sports-inventory' });
    } catch (err) {
        res.render('sports/inventory', { items: [], page: 'sports-inventory', error: err.message });
    }
});

router.post('/inventory/add', async (req, res) => {
    try {
        const { item_name, total_quantity, available_quantity, fine_per_day, cost_per_item } = req.body;
        await db.query(
            'INSERT INTO Sports_Items (item_name, total_quantity, available_quantity, fine_per_day, cost_per_item) VALUES (?, ?, ?, ?, ?)',
            [item_name, total_quantity, available_quantity || total_quantity, fine_per_day || 0, cost_per_item || 0]
        );
        res.redirect('/sports/inventory');
    } catch (err) {
        res.redirect('/sports/inventory');
    }
});

router.post('/inventory/update/:id', async (req, res) => {
    try {
        const { item_name, total_quantity, available_quantity, fine_per_day, cost_per_item } = req.body;
        await db.query(
            'UPDATE Sports_Items SET item_name = ?, total_quantity = ?, available_quantity = ?, fine_per_day = ?, cost_per_item = ? WHERE item_id = ?',
            [item_name, total_quantity, available_quantity, fine_per_day, cost_per_item, req.params.id]
        );
        res.redirect('/sports/inventory');
    } catch (err) {
        res.redirect('/sports/inventory');
    }
});

router.post('/inventory/delete/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM Sports_Items WHERE item_id = ?', [req.params.id]);
        res.redirect('/sports/inventory');
    } catch (err) {
        res.redirect('/sports/inventory');
    }
});

router.get('/issues', async (req, res) => {
    try {
        const [issues] = await db.query(`
            SELECT i.*, s.name, si.item_name 
            FROM Sports_Issues i 
            JOIN Students s ON i.bt_no = s.bt_no 
            JOIN Sports_Items si ON i.item_id = si.item_id
            ORDER BY i.issue_date DESC
        `);
        const [items] = await db.query('SELECT * FROM Sports_Items WHERE available_quantity > 0');
        const [students] = await db.query('SELECT * FROM Students');
        res.render('sports/issues', { issues, items, students, page: 'sports-issues', error: null });
    } catch (err) {
        res.render('sports/issues', { issues: [], items: [], students: [], page: 'sports-issues', error: err.message });
    }
});

router.post('/issues/issue', async (req, res) => {
    try {
        const { bt_no, item_id, quantity, due_date } = req.body;
        await db.query(
            'INSERT INTO Sports_Issues (bt_no, item_id, quantity, due_date) VALUES (?, ?, ?, ?)',
            [bt_no, item_id, quantity || 1, due_date]
        );
        res.redirect('/sports/issues');
    } catch (err) {
        const [issues] = await db.query(`
            SELECT i.*, s.name, si.item_name 
            FROM Sports_Issues i 
            JOIN Students s ON i.bt_no = s.bt_no 
            JOIN Sports_Items si ON i.item_id = si.item_id
            ORDER BY i.issue_date DESC
        `);
        const [items] = await db.query('SELECT * FROM Sports_Items WHERE available_quantity > 0');
        const [students] = await db.query('SELECT * FROM Students');
        res.render('sports/issues', { issues, items, students, page: 'sports-issues', error: err.message });
    }
});

router.post('/issues/return/:id', async (req, res) => {
    try {
        await db.query("UPDATE Sports_Issues SET status = 'Returned', return_date = CURRENT_DATE WHERE issue_id = ?", [req.params.id]);
        res.redirect('/sports/issues');
    } catch (err) {
        res.redirect('/sports/issues');
    }
});

router.get('/fines', async (req, res) => {
    try {
        const [fines] = await db.query(`
            SELECT f.*, s.name, si.item_name, i.issue_date, i.due_date, i.return_date
            FROM Sports_Fines f 
            JOIN Sports_Issues i ON f.issue_id = i.issue_id
            JOIN Students s ON f.bt_no = s.bt_no 
            JOIN Sports_Items si ON i.item_id = si.item_id
            ORDER BY f.created_date DESC
        `);
        const totalFines = fines.reduce((sum, f) => sum + parseFloat(f.fine_amount || 0), 0);
        res.render('sports/fines', { fines, totalFines, page: 'sports-fines' });
    } catch (err) {
        res.render('sports/fines', { fines: [], totalFines: 0, page: 'sports-fines', error: err.message });
    }
});

router.post('/fines/pay/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM Sports_Fines WHERE fine_id = ?', [req.params.id]);
        res.redirect('/sports/fines');
    } catch (err) {
        res.redirect('/sports/fines');
    }
});

router.post('/fines/waive/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM Sports_Fines WHERE fine_id = ?', [req.params.id]);
        res.redirect('/sports/fines');
    } catch (err) {
        res.redirect('/sports/fines');
    }
});

module.exports = router;