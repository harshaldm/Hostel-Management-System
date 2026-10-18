const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { isStudent } = require('../middleware/auth');

router.use(isStudent);

router.get('/', (req, res) => {
    res.redirect('/student/profile');
});

router.get('/profile', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM Students WHERE bt_no = ?', [req.session.student.bt_no]);
        const student = (rows && rows.length > 0) ? rows[0] : req.session.student;
        req.session.student = student;
        res.render('student/profile', { student, page: 'profile' });
    } catch (err) {
        res.render('student/profile', { student: req.session.student, page: 'profile' });
    }
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

const MONTH_NAMES = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

router.get('/dues', async (req, res) => {
    try {
        const student = req.session.student;
        const [rows] = await db.query(`
            SELECT fee_id, bt_no, month, year, amount, status
            FROM Mess_Fees
            WHERE bt_no = ? AND status = 'Pending'
            ORDER BY year ASC, month ASC, fee_id ASC
        `, [student.bt_no]);
        
        const dues = rows.map(r => ({
            ...r,
            month_name: MONTH_NAMES[r.month] || `Month ${r.month}`
        }));
        const totalDue = dues.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);

        res.render('student/dues', { student, dues, totalDue, page: 'dues' });
    } catch (err) {
        res.render('student/dues', { student: req.session.student, dues: [], totalDue: 0, page: 'dues', error: err.message });
    }
});

router.get('/complaints', async (req, res) => {
    try {
        const student = req.session.student;
        const [alloc] = await db.query('SELECT room_no FROM Room_Allocations WHERE bt_no = ?', [student.bt_no]);
        const [complaints] = await db.query(`
            SELECT * FROM Complaints
            WHERE bt_no = ?
            ORDER BY created_at DESC
        `, [student.bt_no]);

        res.render('student/complaints', {
            student,
            room: (alloc && alloc.length > 0) ? alloc[0].room_no : null,
            complaints,
            page: 'complaints',
            error: req.query.error || null,
            success: req.query.success || null
        });
    } catch (err) {
        res.render('student/complaints', {
            student: req.session.student,
            room: null,
            complaints: [],
            page: 'complaints',
            error: err.message,
            success: null
        });
    }
});

router.post('/complaints/add', async (req, res) => {
    try {
        const student = req.session.student;
        const [alloc] = await db.query('SELECT room_no FROM Room_Allocations WHERE bt_no = ?', [student.bt_no]);
        if (!alloc || alloc.length === 0) {
            return res.redirect('/student/complaints?error=' + encodeURIComponent('No room allocated yet. You cannot file a complaint.'));
        }

        let { issue_type, description } = req.body;
        description = (description || '').trim();
        issue_type = (issue_type || '').trim();

        if (!issue_type || !description) {
            return res.redirect('/student/complaints?error=' + encodeURIComponent('Please select an issue type and provide a description.'));
        }

        if (description.length > 500) {
            description = description.substring(0, 500);
        }

        const room_no = alloc[0].room_no;
        await db.query(`
            INSERT INTO Complaints (bt_no, room_no, issue_type, description, status, created_at)
            VALUES (?, ?, ?, ?, 'Pending', NOW())
        `, [student.bt_no, room_no, issue_type, description]);

        res.redirect('/student/complaints?success=' + encodeURIComponent('Complaint submitted successfully.'));
    } catch (err) {
        res.redirect('/student/complaints?error=' + encodeURIComponent(err.message));
    }
});

router.get('/mess-leave', async (req, res) => {
    const student = req.session.student;
    try {
        // R6: Student portal > Mess Leave history shows self-applied AND hostel-derived mess leaves
        const [leaves] = await db.query(`
            SELECT ml.*, 
                   CASE WHEN EXISTS (
                       SELECT 1 FROM Leave_Log ll 
                       WHERE ll.bt_no = ml.bt_no 
                         AND ll.from_date = ml.from_date 
                         AND ll.to_date = ml.to_date
                   ) THEN 'Hostel Leave' ELSE 'Mess Leave' END AS leave_source
            FROM Mess_Leaves ml 
            WHERE ml.bt_no = ? 
            ORDER BY ml.from_date DESC, ml.leave_id DESC
        `, [student.bt_no]);
        res.render('student/mess-leave', { student, leaves, page: 'mess-leave', error: null, success: null });
    } catch (err) {
        res.render('student/mess-leave', { student, leaves: [], page: 'mess-leave', error: err.message, success: null });
    }
});

router.post('/mess-leave/add', async (req, res) => {
    const student = req.session.student;
    const { from_date, to_date } = req.body;
    
    // Server-side validation
    if (!from_date || !to_date) {
        const [leaves] = await db.query(`
            SELECT ml.*, 
                   CASE WHEN EXISTS (
                       SELECT 1 FROM Leave_Log ll 
                       WHERE ll.bt_no = ml.bt_no AND ll.from_date = ml.from_date AND ll.to_date = ml.to_date
                   ) THEN 'Hostel Leave' ELSE 'Mess Leave' END AS leave_source
            FROM Mess_Leaves ml WHERE ml.bt_no = ? ORDER BY ml.from_date DESC, ml.leave_id DESC
        `, [student.bt_no]);
        return res.render('student/mess-leave', { student, leaves, page: 'mess-leave', error: 'Please provide both From and To dates.', success: null });
    }

    if (new Date(to_date) < new Date(from_date)) {
        const [leaves] = await db.query(`
            SELECT ml.*, 
                   CASE WHEN EXISTS (
                       SELECT 1 FROM Leave_Log ll 
                       WHERE ll.bt_no = ml.bt_no AND ll.from_date = ml.from_date AND ll.to_date = ml.to_date
                   ) THEN 'Hostel Leave' ELSE 'Mess Leave' END AS leave_source
            FROM Mess_Leaves ml WHERE ml.bt_no = ? ORDER BY ml.from_date DESC, ml.leave_id DESC
        `, [student.bt_no]);
        return res.render('student/mess-leave', { student, leaves, page: 'mess-leave', error: 'To Date must be on or after From Date.', success: null });
    }

    // Inclusive calculation: to_date - from_date + 1
    const fromD = new Date(from_date);
    const toD = new Date(to_date);
    const days = Math.round((toD - fromD) / (1000 * 60 * 60 * 24)) + 1;

    try {
        await db.query('INSERT INTO Mess_Leaves (bt_no, from_date, to_date, days) VALUES (?, ?, ?, ?)',
            [student.bt_no, from_date, to_date, days]);
        res.redirect('/student/mess-leave');
    } catch (err) {
        const [leaves] = await db.query(`
            SELECT ml.*, 
                   CASE WHEN EXISTS (
                       SELECT 1 FROM Leave_Log ll 
                       WHERE ll.bt_no = ml.bt_no AND ll.from_date = ml.from_date AND ll.to_date = ml.to_date
                   ) THEN 'Hostel Leave' ELSE 'Mess Leave' END AS leave_source
            FROM Mess_Leaves ml WHERE ml.bt_no = ? ORDER BY ml.from_date DESC, ml.leave_id DESC
        `, [student.bt_no]);
        res.render('student/mess-leave', { student, leaves, page: 'mess-leave', error: err.message, success: null });
    }
});

router.get('/hostel-leave', async (req, res) => {
    const student = req.session.student;
    try {
        const [leaves] = await db.query(`
            SELECT * FROM Leave_Log WHERE bt_no = ? ORDER BY from_date DESC, leave_id DESC
        `, [student.bt_no]);
        res.render('student/hostel-leave', { student, leaves, page: 'hostel-leave', error: null });
    } catch (err) {
        res.render('student/hostel-leave', { student, leaves: [], page: 'hostel-leave', error: err.message });
    }
});

router.post('/hostel-leave/add', async (req, res) => {
    const student = req.session.student;
    const { from_date, to_date } = req.body;
    
    // Server-side validation
    if (!from_date || !to_date) {
        const [leaves] = await db.query('SELECT * FROM Leave_Log WHERE bt_no = ? ORDER BY from_date DESC, leave_id DESC', [student.bt_no]);
        return res.render('student/hostel-leave', { student, leaves, page: 'hostel-leave', error: 'Please provide both From and To dates.' });
    }

    if (new Date(to_date) < new Date(from_date)) {
        const [leaves] = await db.query('SELECT * FROM Leave_Log WHERE bt_no = ? ORDER BY from_date DESC, leave_id DESC', [student.bt_no]);
        return res.render('student/hostel-leave', { student, leaves, page: 'hostel-leave', error: 'To Date must be on or after From Date.' });
    }

    // Inclusive calculation: to_date - from_date + 1
    const fromD = new Date(from_date);
    const toD = new Date(to_date);
    const days = Math.round((toD - fromD) / (1000 * 60 * 60 * 24)) + 1;

    try {
        await db.query('INSERT INTO Leave_Log (bt_no, from_date, to_date, days) VALUES (?, ?, ?, ?)',
            [student.bt_no, from_date, to_date, days]);
        res.redirect('/student/hostel-leave');
    } catch (err) {
        const [leaves] = await db.query('SELECT * FROM Leave_Log WHERE bt_no = ? ORDER BY from_date DESC, leave_id DESC', [student.bt_no]);
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