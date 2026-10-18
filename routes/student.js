const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { isStudent } = require('../middleware/auth');

router.use(isStudent);

router.get('/', (req, res) => {
    res.redirect('/student/profile');
});

router.get('/profile', async (req, res) => {
    const student = req.session.student;
    res.render('student/profile', { student, page: 'profile' });
});

router.get('/room', async (req, res) => {
    try {
        const student = req.session.student;
        const [rows] = await db.query(`
            SELECT ra.*, r.room_no, r.floor_no, r.room_type
            FROM Room_Allocations ra
            JOIN Rooms r ON ra.room_no = r.room_no
            WHERE ra.bt_no = ?
        `, [student.bt_no]);
        res.render('student/room', { student, allocations: rows[0] || null, page: 'room', error: null });
    } catch (err) {
        res.render('student/room', { student: req.session.student, allocations: null, page: 'room', error: err.message });
    }
});

router.get('/fines', async (req, res) => {
    try {
        const student = req.session.student;
        const [rows] = await db.query(`
            SELECT sf.fine_id, sf.bt_no, sf.fine_amount, sf.created_date,
                   si.item_name, si.fine_per_day
            FROM Sports_Fines sf
            JOIN Sports_Issues sei ON sf.issue_id = sei.issue_id
            JOIN Sports_Items si ON sei.item_id = si.item_id
            WHERE sf.bt_no = ?
            ORDER BY sf.created_date DESC
        `, [student.bt_no]);
        res.render('student/fines', { student, fines: rows, page: 'fines' });
    } catch (err) {
        res.render('student/fines', { student: req.session.student, fines: [], page: 'fines', error: err.message });
    }
});

router.get('/mess-leave', async (req, res) => {
    const student = req.session.student;
    try {
        const [leaves] = await db.query(`
            SELECT * FROM Mess_Leaves WHERE bt_no = ? ORDER BY from_date DESC
        `, [student.bt_no]);
        res.render('student/mess-leave', { student, leaves, page: 'mess-leave', error: null, success: null });
    } catch (err) {
        res.render('student/mess-leave', { student, leaves: [], page: 'mess-leave', error: err.message, success: null });
    }
});

router.post('/mess-leave/add', async (req, res) => {
    const student = req.session.student;
    const { from_date, to_date, days } = req.body;
    try {
        await db.query('INSERT INTO Mess_Leaves (bt_no, from_date, to_date, days) VALUES (?, ?, ?, ?)',
            [student.bt_no, from_date, to_date, days]);
        res.redirect('/student/mess-leave');
    } catch (err) {
        const [leaves] = await db.query('SELECT * FROM Mess_Leaves WHERE bt_no = ? ORDER BY from_date DESC', [student.bt_no]);
        res.render('student/mess-leave', { student, leaves, page: 'mess-leave', error: err.message, success: null });
    }
});

router.get('/hostel-leave', async (req, res) => {
    const student = req.session.student;
    try {
        const [leaves] = await db.query(`
            SELECT * FROM Leave_Log WHERE bt_no = ? ORDER BY from_date DESC
        `, [student.bt_no]);
        res.render('student/hostel-leave', { student, leaves, page: 'hostel-leave', error: null });
    } catch (err) {
        res.render('student/hostel-leave', { student, leaves: [], page: 'hostel-leave', error: err.message });
    }
});

router.post('/hostel-leave/add', async (req, res) => {
    const student = req.session.student;
    const { from_date, to_date, days } = req.body;
    try {
        await db.query('INSERT INTO Leave_Log (bt_no, from_date, to_date, days) VALUES (?, ?, ?, ?)',
            [student.bt_no, from_date, to_date, days]);
        res.redirect('/student/hostel-leave');
    } catch (err) {
        const [leaves] = await db.query('SELECT * FROM Leave_Log WHERE bt_no = ? ORDER BY from_date DESC', [student.bt_no]);
        res.render('student/hostel-leave', { student, leaves, page: 'hostel-leave', error: err.message });
    }
});

router.get('/sports-issue', async (req, res) => {
    const student = req.session.student;
    try {
        const [issues] = await db.query(`
            SELECT si.*, spi.item_name, spi.available_quantity
            FROM Sports_Issues si
            JOIN Sports_Items spi ON si.item_id = spi.item_id
            WHERE si.bt_no = ?
            ORDER BY si.issue_date DESC
        `, [student.bt_no]);
        const [items] = await db.query('SELECT * FROM Sports_Items WHERE available_quantity > 0');
        res.render('student/sports-issue', { student, issues, items, page: 'sports-issue', error: null });
    } catch (err) {
        res.render('student/sports-issue', { student, issues: [], items: [], page: 'sports-issue', error: err.message });
    }
});

router.post('/sports-issue/add', async (req, res) => {
    const student = req.session.student;
    const { item_id, quantity, due_date } = req.body;
    try {
        await db.query('INSERT INTO Sports_Issues (bt_no, item_id, quantity, due_date) VALUES (?, ?, ?, ?)',
            [student.bt_no, item_id, quantity, due_date]);
        res.redirect('/student/sports-issue');
    } catch (err) {
        const [issues] = await db.query(`
            SELECT si.*, spi.item_name FROM Sports_Issues si
            JOIN Sports_Items spi ON si.item_id = spi.item_id
            WHERE si.bt_no = ? ORDER BY si.issue_date DESC
        `, [student.bt_no]);
        const [items] = await db.query('SELECT * FROM Sports_Items WHERE available_quantity > 0');
        res.render('student/sports-issue', { student, issues, items, page: 'sports-issue', error: err.message });
    }
});

router.post('/sports-issue/return/:id', async (req, res) => {
    try {
        await db.query("UPDATE Sports_Issues SET status = 'Returned', return_date = CURRENT_DATE WHERE issue_id = ?",
            [req.params.id]);
        res.redirect('/student/sports-issue');
    } catch (err) {
        res.redirect('/student/sports-issue');
    }
});

module.exports = router;