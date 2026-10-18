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
        const [leaves] = await db.query(`
            SELECT l.*, s.name FROM Mess_Leaves l 
            JOIN Students s ON l.bt_no = s.bt_no 
            ORDER BY l.from_date DESC
        `);
        const [refunds] = await db.query('SELECT * FROM Mess_Refunds');
        const [students] = await db.query('SELECT * FROM Students');
        res.render('mess/leaves', { leaves, refunds, students, page: 'leaves' });
    } catch (err) {
        res.render('mess/leaves', { leaves: [], refunds: [], students: [], page: 'leaves', error: err.message });
    }
});

router.post('/leaves/add', async (req, res) => {
    try {
        const { bt_no, from_date, to_date, days } = req.body;
        await db.query('INSERT INTO Mess_Leaves (bt_no, from_date, to_date, days) VALUES (?, ?, ?, ?)', 
            [bt_no, from_date, to_date, days]);
        res.redirect('/mess/leaves');
    } catch (err) {
        res.redirect('/mess/leaves');
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

router.get('/inventory', async (req, res) => {
    try {
        const [inventory] = await db.query('SELECT * FROM Inventory ORDER BY item_name');
        const [lowStock] = await db.query('SELECT * FROM vw_low_inventory');
        res.render('mess/inventory', { inventory, lowStock, page: 'inventory' });
    } catch (err) {
        res.render('mess/inventory', { inventory: [], lowStock: [], page: 'inventory', error: err.message });
    }
});

router.post('/inventory/add', async (req, res) => {
    try {
        const { item_name, quantity, unit, cost_per_unit, week_no } = req.body;
        const total_cost = quantity * cost_per_unit;
        await db.query('INSERT INTO Inventory (item_name, quantity, unit, cost_per_unit, total_cost, week_no) VALUES (?, ?, ?, ?, ?, ?)', 
            [item_name, quantity, unit, cost_per_unit, total_cost, week_no]);
        res.redirect('/mess/inventory');
    } catch (err) {
        res.redirect('/mess/inventory');
    }
});

router.get('/meals', async (req, res) => {
    try {
        const [meals] = await db.query(`
            SELECT m.*, d.dish_name FROM Meal_Log m 
            JOIN Menu_Dishes d ON m.dish_id = d.dish_id 
            ORDER BY m.served_date DESC
        `);
        const [dishes] = await db.query('SELECT * FROM Menu_Dishes');
        res.render('mess/meals', { meals, dishes, page: 'meals', error: null });
    } catch (err) {
        res.render('mess/meals', { meals: [], dishes: [], page: 'meals', error: err.message });
    }
});

router.post('/meals/add', async (req, res) => {
    try {
        const { dish_id, served_date, meal_type, remarks } = req.body;
        await db.query('INSERT INTO Meal_Log (dish_id, served_date, meal_type, remarks) VALUES (?, ?, ?, ?)', 
            [dish_id, served_date, meal_type, remarks]);
        res.redirect('/mess/meals');
    } catch (err) {
        const [meals] = await db.query(`
            SELECT m.*, d.dish_name FROM Meal_Log m 
            JOIN Menu_Dishes d ON m.dish_id = d.dish_id 
            ORDER BY m.served_date DESC
        `);
        const [dishes] = await db.query('SELECT * FROM Menu_Dishes');
        res.render('mess/meals', { meals, dishes, page: 'meals', error: err.message });
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

router.get('/feedback', async (req, res) => {
    try {
        const [feedback] = await db.query(`
            SELECT f.*, s.name, d.dish_name FROM Mess_Feedback f 
            JOIN Students s ON f.bt_no = s.bt_no 
            JOIN Menu_Dishes d ON f.dish_id = d.dish_id
            ORDER BY f.feedback_date DESC
        `);
        const [avgFeedback] = await db.query('SELECT * FROM vw_feedback_average');
        res.render('mess/feedback', { feedback, avgFeedback, page: 'feedback' });
    } catch (err) {
        res.render('mess/feedback', { feedback: [], avgFeedback: [], page: 'feedback', error: err.message });
    }
});

router.get('/alerts', async (req, res) => {
    try {
        const [alerts] = await db.query('SELECT * FROM Alerts ORDER BY created_at DESC');
        res.render('mess/alerts', { alerts, page: 'alerts' });
    } catch (err) {
        res.render('mess/alerts', { alerts: [], page: 'alerts', error: err.message });
    }
});

router.post('/alerts/resolve/:id', async (req, res) => {
    try {
        await db.query("UPDATE Alerts SET is_resolved = 'Yes' WHERE alert_id = ?", [req.params.id]);
        res.redirect('/mess/alerts');
    } catch (err) {
        res.redirect('/mess/alerts');
    }
});

module.exports = router;