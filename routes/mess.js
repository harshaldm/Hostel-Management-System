const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { isAuthenticated } = require('../middleware/auth');

router.use(isAuthenticated);

router.get('/', (req, res) => {
    res.redirect('/mess/fees');
});

router.get('/fees', async (req, res) => {
    try {
        const [fees] = await db.query(`
            SELECT f.*, s.name FROM Mess_Fees f 
            JOIN Students s ON f.bt_no = s.bt_no 
            ORDER BY f.year DESC, f.month DESC
        `);
        const [students] = await db.query('SELECT * FROM Students');
        res.render('mess/fees', { fees, students, page: 'fees' });
    } catch (err) {
        res.render('mess/fees', { fees: [], students: [], page: 'fees', error: err.message });
    }
});

router.post('/fees/add', async (req, res) => {
    try {
        const { bt_no, month, year, amount, payment_date, status } = req.body;
        await db.query('INSERT INTO Mess_Fees (bt_no, month, year, amount, payment_date, status) VALUES (?, ?, ?, ?, ?, ?)', 
            [bt_no, month, year, amount, payment_date || null, status]);
        res.redirect('/mess/fees');
    } catch (err) {
        res.redirect('/mess/fees');
    }
});

router.post('/fees/mark-paid/:id', async (req, res) => {
    try {
        await db.query("UPDATE Mess_Fees SET status = 'Paid', payment_date = CURRENT_DATE WHERE fee_id = ?", [req.params.id]);
        res.redirect('/mess/fees');
    } catch (err) {
        res.redirect('/mess/fees');
    }
});

router.get('/leaves', async (req, res) => {
    try {
        // R5: Mess Leave Records (student name, from, to, days; newest first)
        const [leaves] = await db.query(`
            SELECT l.*, s.name 
            FROM Mess_Leaves l 
            JOIN Students s ON l.bt_no = s.bt_no 
            ORDER BY l.from_date DESC, l.leave_id DESC
        `);

        // R5: Mess Refund Summary (BT No, name, days, amount)
        const [refunds] = await db.query(`
            SELECT r.refund_id, r.bt_no, s.name, r.total_days, r.refund_amount, r.last_updated
            FROM Mess_Refunds r
            JOIN Students s ON r.bt_no = s.bt_no
            ORDER BY r.last_updated DESC, r.bt_no
        `);
        const [students] = await db.query('SELECT * FROM Students ORDER BY name');
        res.render('mess/leaves', { leaves, refunds, students, page: 'leaves', error: req.query.error || null });
    } catch (err) {
        res.render('mess/leaves', { leaves: [], refunds: [], students: [], page: 'leaves', error: err.message });
    }
});

router.post('/leaves/add', async (req, res) => {
    try {
        const { bt_no, from_date, to_date } = req.body;
        if (!bt_no || !from_date || !to_date) {
            return res.redirect('/mess/leaves?error=Please%20provide%20all%20required%20fields');
        }
        if (new Date(to_date) < new Date(from_date)) {
            return res.redirect('/mess/leaves?error=To%20date%20must%20be%20after%20or%20equal%20to%20From%20date');
        }
        const fromD = new Date(from_date);
        const toD = new Date(to_date);
        const days = Math.round((toD - fromD) / (1000 * 60 * 60 * 24)) + 1;

        await db.query('INSERT INTO Mess_Leaves (bt_no, from_date, to_date, days) VALUES (?, ?, ?, ?)', 
            [bt_no, from_date, to_date, days]);
        res.redirect('/mess/leaves');
    } catch (err) {
        res.redirect('/mess/leaves?error=' + encodeURIComponent(err.message));
    }
});

router.get('/menu', async (req, res) => {
    try {
        const [menu] = await db.query(`SELECT * FROM vw_weekly_menu ORDER BY CASE day_name WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3 WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6 WHEN 'Sunday' THEN 7 END, meal_type`);
        const [dishes] = await db.query('SELECT * FROM Menu_Dishes');
        res.render('mess/menu', { menu, dishes, page: 'menu' });
    } catch (err) {
        res.render('mess/menu', { menu: [], dishes: [], page: 'menu', error: err.message });
    }
});

router.post('/menu/update', async (req, res) => {
    try {
        const { day_name, meal_type, dish_id } = req.body;
        await db.query('DELETE FROM Weekly_Menu WHERE day_name = ? AND meal_type = ?', [day_name, meal_type]);
        if (dish_id) {
            await db.query('INSERT INTO Weekly_Menu (day_name, meal_type, dish_id) VALUES (?, ?, ?)', [day_name, meal_type, dish_id]);
        }
        res.redirect('/mess/menu');
    } catch (err) {
        res.redirect('/mess/menu');
    }
});


router.get('/staff', async (req, res) => {
    try {
        const [staff] = await db.query(`
            SELECT ms.*, sr.role_name FROM Mess_Staff ms 
            JOIN Staff_Roles sr ON ms.role_id = sr.role_id
            ORDER BY ms.status DESC, ms.name
        `);
        const [roles] = await db.query('SELECT * FROM Staff_Roles');
        res.render('mess/staff', { staff, roles, page: 'staff' });
    } catch (err) {
        res.render('mess/staff', { staff: [], roles: [], page: 'staff', error: err.message });
    }
});

router.post('/staff/add', async (req, res) => {
    try {
        const { name, role_id, phone, joining_date } = req.body;
        await db.query('INSERT INTO Mess_Staff (name, role_id, phone, joining_date) VALUES (?, ?, ?, ?)', 
            [name, role_id, phone, joining_date]);
        res.redirect('/mess/staff');
    } catch (err) {
        res.redirect('/mess/staff');
    }
});

router.get('/vendors', async (req, res) => {
    try {
        const [vendors] = await db.query('SELECT * FROM Vendors');
        res.render('mess/vendors', { vendors, page: 'vendors' });
    } catch (err) {
        const [vendors] = await db.query('SELECT * FROM Vendors');
        res.render('mess/vendors', { vendors, page: 'vendors', error: err.message });
    }
});

router.post('/vendors/add', async (req, res) => {
    try {
        const { vendor_name, phone, item_speciality } = req.body;
        await db.query('INSERT INTO Vendors (vendor_name, phone, item_speciality) VALUES (?, ?, ?)', 
            [vendor_name, phone, item_speciality]);
        res.redirect('/mess/vendors');
    } catch (err) {
        res.redirect('/mess/vendors');
    }
});

router.get('/expenses', async (req, res) => {
    try {
        const [expenses] = await db.query('SELECT * FROM Mess_Expenses ORDER BY expense_date DESC');
        const [trends] = await db.query('SELECT * FROM vw_monthly_cost_trends ORDER BY yr DESC, mn DESC LIMIT 12');
        res.render('mess/expenses', { expenses, trends, page: 'expenses' });
    } catch (err) {
        res.render('mess/expenses', { expenses: [], trends: [], page: 'expenses', error: err.message });
    }
});

router.post('/expenses/add', async (req, res) => {
    try {
        const { type, amount, expense_date, remarks } = req.body;
        await db.query('INSERT INTO Mess_Expenses (type, amount, expense_date, remarks) VALUES (?, ?, ?, ?)', 
            [type, amount, expense_date, remarks]);
        res.redirect('/mess/expenses');
    } catch (err) {
        res.redirect('/mess/expenses');
    }
});


module.exports = router;