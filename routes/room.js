const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { isAuthenticated } = require('../middleware/auth');

router.use(isAuthenticated);

router.get('/students', async (req, res) => {
    try {
        const [students] = await db.query('SELECT * FROM Students ORDER BY bt_no');
        res.render('room/students', { 
            students, 
            page: 'students',
            error: req.query.error || null,
            success: req.query.success || null
        });
    } catch (err) {
        res.render('room/students', { 
            students: [], 
            page: 'students', 
            error: err.message,
            success: null 
        });
    }
});

router.post('/students/add', async (req, res) => {
    let { bt_no, name, year, phone, email, branch } = req.body;
    bt_no = (bt_no || '').trim().toUpperCase();
    name = (name || '').trim();
    phone = (phone || '').toString().trim().replace(/[\s\-\+]/g, '');
    email = (email || '').trim().toLowerCase();
    branch = (branch || '').trim().toUpperCase();
    const parsedYear = parseInt(year, 10);

    const renderWithError = async (errorMessage) => {
        const [students] = await db.query('SELECT * FROM Students ORDER BY bt_no').catch(() => [[]]);
        return res.render('room/students', { 
            students, 
            page: 'students', 
            error: errorMessage,
            success: null 
        });
    };

    // 1. Validation for BT No
    if (!bt_no || bt_no.length < 4 || !/^[A-Z0-9_-]+$/i.test(bt_no)) {
        return renderWithError('Invalid BT / Roll Number. Must be at least 4 alphanumeric characters (e.g. BT24CSE082).');
    }

    // 2. Validation for Name
    if (!name || name.length < 2 || !/^[a-zA-Z\s\.\-]+$/.test(name)) {
        return renderWithError('Invalid Name. Please provide a valid student name (letters only).');
    }

    // 3. Validation for Year (1st, 2nd, 3rd, 4th Year)
    if (![1, 2, 3, 4].includes(parsedYear)) {
        return renderWithError('Please select a valid academic year (1st, 2nd, 3rd, or 4th Year).');
    }

    // 4. Strict Validation for 10-digit Phone Number
    if (!/^\d{10}$/.test(phone)) {
        return renderWithError('Phone number must be exactly 10 digits (numbers only, no country code or symbols).');
    }

    // 5. Validation for Email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return renderWithError('Please enter a valid email address.');
    }

    // 6. Strict Validation for Branch (Allowed: CSA, CSD, CSE, CSH, ECI, ECE)
    const ALLOWED_BRANCHES = ['CSA', 'CSD', 'CSE', 'CSH', 'ECI', 'ECE'];
    if (!branch || !ALLOWED_BRANCHES.includes(branch)) {
        return renderWithError(`Please select a valid branch (${ALLOWED_BRANCHES.join(', ')}).`);
    }

    try {
        // Check for duplicates
        const [existingBt] = await db.query('SELECT bt_no FROM Students WHERE UPPER(bt_no) = ?', [bt_no]);
        if (existingBt.length > 0) {
            return renderWithError(`Student with BT No "${bt_no}" already exists.`);
        }

        const [existingPhone] = await db.query('SELECT bt_no FROM Students WHERE phone = ?', [phone]);
        if (existingPhone.length > 0) {
            return renderWithError(`Phone number "${phone}" is already registered to student ${existingPhone[0].bt_no}.`);
        }

        const [existingEmail] = await db.query('SELECT bt_no FROM Students WHERE LOWER(email) = ?', [email]);
        if (existingEmail.length > 0) {
            return renderWithError(`Email "${email}" is already registered to student ${existingEmail[0].bt_no}.`);
        }

        await db.query('INSERT INTO Students (bt_no, name, year, phone, email, branch) VALUES (?, ?, ?, ?, ?, ?)', 
            [bt_no, name, parsedYear, phone, email, branch]);
        res.redirect('/room/students?success=' + encodeURIComponent(`Student ${bt_no} successfully added.`));
    } catch (err) {
        return renderWithError(err.message);
    }
});

router.post('/students/edit/:bt_no', async (req, res) => {
    const targetBt = (req.params.bt_no || '').trim().toUpperCase();
    let { name, year, phone, email, branch } = req.body;
    name = (name || '').trim();
    phone = (phone || '').toString().trim().replace(/[\s\-\+]/g, '');
    email = (email || '').trim().toLowerCase();
    branch = (branch || '').trim().toUpperCase();
    const parsedYear = parseInt(year, 10);

    if (!name || name.length < 2 || !/^[a-zA-Z\s\.\-]+$/.test(name)) {
        return res.redirect('/room/students?error=' + encodeURIComponent('Invalid Name. Letters only.'));
    }

    if (![1, 2, 3, 4].includes(parsedYear)) {
        return res.redirect('/room/students?error=' + encodeURIComponent('Please select a valid academic year (1st, 2nd, 3rd, or 4th Year).'));
    }

    if (!/^\d{10}$/.test(phone)) {
        return res.redirect('/room/students?error=' + encodeURIComponent('Phone number must be exactly 10 digits.'));
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.redirect('/room/students?error=' + encodeURIComponent('Please enter a valid email address.'));
    }

    const ALLOWED_BRANCHES = ['CSA', 'CSD', 'CSE', 'CSH', 'ECI', 'ECE'];
    if (!branch || !ALLOWED_BRANCHES.includes(branch)) {
        return res.redirect('/room/students?error=' + encodeURIComponent(`Please select a valid branch (${ALLOWED_BRANCHES.join(', ')}).`));
    }

    try {
        const [existingPhone] = await db.query('SELECT bt_no FROM Students WHERE phone = ? AND UPPER(bt_no) != ?', [phone, targetBt]);
        if (existingPhone.length > 0) {
            return res.redirect('/room/students?error=' + encodeURIComponent(`Phone number "${phone}" is already used by ${existingPhone[0].bt_no}.`));
        }

        const [existingEmail] = await db.query('SELECT bt_no FROM Students WHERE LOWER(email) = ? AND UPPER(bt_no) != ?', [email, targetBt]);
        if (existingEmail.length > 0) {
            return res.redirect('/room/students?error=' + encodeURIComponent(`Email "${email}" is already used by ${existingEmail[0].bt_no}.`));
        }

        await db.query('UPDATE Students SET name = ?, year = ?, phone = ?, email = ?, branch = ? WHERE UPPER(bt_no) = ?', 
            [name, parsedYear, phone, email, branch, targetBt]);
        res.redirect('/room/students?success=' + encodeURIComponent(`Student ${targetBt} updated successfully.`));
    } catch (err) {
        res.redirect('/room/students?error=' + encodeURIComponent(err.message));
    }
});

router.post('/students/delete/:bt_no', async (req, res) => {
    const targetBt = req.params.bt_no;
    try {
        await db.query('DELETE FROM Students WHERE bt_no = ?', [targetBt]);
        res.redirect('/room/students?success=' + encodeURIComponent(`Student ${targetBt} deleted successfully.`));
    } catch (err) {
        res.redirect('/room/students?error=' + encodeURIComponent(`Cannot delete student ${targetBt}: ${err.message}`));
    }
});

router.get('/rooms', async (req, res) => {
    try {
        const [rooms] = await db.query(`
            SELECT r.*, 
            (SELECT COUNT(*) FROM Room_Allocations ra WHERE ra.room_no = r.room_no) as occupied 
            FROM Rooms r ORDER BY room_no
        `);
        res.render('room/rooms', { rooms, page: 'rooms' });
    } catch (err) {
        res.render('room/rooms', { rooms: [], page: 'rooms', error: err.message });
    }
});

router.post('/rooms/add', async (req, res) => {
    try {
        const { room_no, max_capacity, floor_no, room_type } = req.body;
        await db.query('INSERT INTO Rooms (room_no, max_capacity, floor_no, room_type) VALUES (?, ?, ?, ?)', 
            [room_no, max_capacity, floor_no, room_type]);
        res.redirect('/room/rooms');
    } catch (err) {
        res.redirect('/room/rooms');
    }
});

router.post('/rooms/delete/:room_no', async (req, res) => {
    try {
        await db.query('DELETE FROM Rooms WHERE room_no = ?', [req.params.room_no]);
        res.redirect('/room/rooms');
    } catch (err) {
        res.redirect('/room/rooms');
    }
});

router.post('/rooms/edit/:room_no', async (req, res) => {
    try {
        const { max_capacity, floor_no, room_type } = req.body;
        await db.query(
            'UPDATE Rooms SET max_capacity = ?, floor_no = ?, room_type = ? WHERE room_no = ?',
            [max_capacity, floor_no, room_type, req.params.room_no]
        );
        res.redirect('/room/rooms');
    } catch (err) {
        res.redirect('/room/rooms');
    }
});



router.get('/allocations', async (req, res) => {
    try {
        const [allocations] = await db.query(`
            SELECT ra.*, s.name, r.room_type 
            FROM Room_Allocations ra 
            JOIN Students s ON ra.bt_no = s.bt_no 
            JOIN Rooms r ON ra.room_no = r.room_no
            ORDER BY ra.allocation_date DESC
        `);
        const [students] = await db.query('SELECT * FROM Students WHERE bt_no NOT IN (SELECT bt_no FROM Room_Allocations)');
        const [rooms] = await db.query('SELECT * FROM Rooms');
        res.render('room/allocations', { allocations, students, rooms, page: 'allocations', error: null });
    } catch (err) {
        res.render('room/allocations', { allocations: [], students: [], rooms: [], page: 'allocations', error: err.message });
    }
});

router.post('/allocations/add', async (req, res) => {
    try {
        const { bt_no, room_no } = req.body;
        await db.query('INSERT INTO Room_Allocations (bt_no, room_no) VALUES (?, ?)', [bt_no, room_no]);
        res.redirect('/room/allocations');
    } catch (err) {
        const [allocations] = await db.query(`
            SELECT ra.*, s.name, r.room_type 
            FROM Room_Allocations ra 
            JOIN Students s ON ra.bt_no = s.bt_no 
            JOIN Rooms r ON ra.room_no = r.room_no
            ORDER BY ra.allocation_date DESC
        `);
        const [students] = await db.query('SELECT * FROM Students WHERE bt_no NOT IN (SELECT bt_no FROM Room_Allocations)');
        const [rooms] = await db.query('SELECT * FROM Rooms');
        res.render('room/allocations', { allocations, students, rooms, page: 'allocations', error: err.message });
    }
});

router.post('/allocations/reassign', async (req, res) => {
    try {
        const { bt_no, room_no } = req.body;
        await db.query('UPDATE Room_Allocations SET room_no = ?, allocation_date = NOW() WHERE bt_no = ?', [room_no, bt_no]);
        res.redirect('/room/allocations');
    } catch (err) {
        res.redirect('/room/allocations');
    }
});

router.post('/allocations/delete/:bt_no', async (req, res) => {
    try {
        await db.query('DELETE FROM Room_Allocations WHERE bt_no = ?', [req.params.bt_no]);
        res.redirect('/room/allocations');
    } catch (err) {
        res.redirect('/room/allocations');
    }
});

router.get('/leave', async (req, res) => {
    try {
        const [leaves] = await db.query(`
            SELECT l.*, s.name FROM Leave_Log l 
            JOIN Students s ON l.bt_no = s.bt_no 
            ORDER BY l.from_date DESC
        `);
        const [refunds] = await db.query('SELECT * FROM Refunds');
        const [students] = await db.query('SELECT * FROM Students');
        res.render('room/leave', { leaves, refunds, students, page: 'leave' });
    } catch (err) {
        res.render('room/leave', { leaves: [], refunds: [], students: [], page: 'leave', error: err.message });
    }
});

router.post('/leave/add', async (req, res) => {
    try {
        const { bt_no, from_date, to_date, days } = req.body;
        await db.query('INSERT INTO Leave_Log (bt_no, from_date, to_date, days) VALUES (?, ?, ?, ?)', 
            [bt_no, from_date, to_date, days]);
        res.redirect('/room/leave');
    } catch (err) {
        res.redirect('/room/leave');
    }
});

router.get('/complaints', async (req, res) => {
    try {
        const [complaints] = await db.query(`
            SELECT c.*, s.name, r.room_no as room_number
            FROM Complaints c 
            JOIN Students s ON c.bt_no = s.bt_no 
            JOIN Rooms r ON c.room_no = r.room_no
            ORDER BY c.created_at DESC
        `);
        const [students] = await db.query('SELECT * FROM Students');
        const [rooms] = await db.query('SELECT * FROM Rooms');
        res.render('room/complaints', { complaints, students, rooms, page: 'complaints' });
    } catch (err) {
        res.render('room/complaints', { complaints: [], students: [], rooms: [], page: 'complaints', error: err.message });
    }
});

router.post('/complaints/add', async (req, res) => {
    try {
        const { bt_no, room_no, issue_type, description } = req.body;
        await db.query('INSERT INTO Complaints (bt_no, room_no, issue_type, description) VALUES (?, ?, ?, ?)', 
            [bt_no, room_no, issue_type, description]);
        res.redirect('/room/complaints');
    } catch (err) {
        res.redirect('/room/complaints');
    }
});

router.post('/complaints/resolve/:id', async (req, res) => {
    try {
        await db.query("UPDATE Complaints SET status = 'Resolved', resolved_at = NOW() WHERE complaint_id = ?", 
            [req.params.id]);
        res.redirect('/room/complaints');
    } catch (err) {
        res.redirect('/room/complaints');
    }
});

router.get('/visitors', async (req, res) => {
    try {
        const [visitors] = await db.query(`
            SELECT v.*, s.name FROM Visitors v 
            JOIN Students s ON v.student_bt_no = s.bt_no 
            ORDER BY v.visit_date DESC
        `);
        const [students] = await db.query('SELECT * FROM Students');
        res.render('room/visitors', { visitors, students, page: 'visitors' });
    } catch (err) {
        res.render('room/visitors', { visitors: [], students: [], page: 'visitors', error: err.message });
    }
});

router.post('/visitors/add', async (req, res) => {
    try {
        const { student_bt_no, visitor_name, visit_date, in_time, out_time, purpose } = req.body;
        await db.query('INSERT INTO Visitors (student_bt_no, visitor_name, visit_date, in_time, out_time, purpose) VALUES (?, ?, ?, ?, ?, ?)', 
            [student_bt_no, visitor_name, visit_date, in_time, out_time, purpose]);
        res.redirect('/room/visitors');
    } catch (err) {
        res.redirect('/room/visitors');
    }
});

router.get('/payments', async (req, res) => {
    try {
        const [payments] = await db.query(`
            SELECT p.*, s.name FROM Payments p 
            JOIN Students s ON p.bt_no = s.bt_no 
            ORDER BY p.payment_date DESC
        `);
        const [students] = await db.query('SELECT * FROM Students');
        res.render('room/payments', { payments, students, page: 'payments' });
    } catch (err) {
        res.render('room/payments', { payments: [], students: [], page: 'payments', error: err.message });
    }
});

router.post('/payments/add', async (req, res) => {
    try {
        const { bt_no, amount, payment_date, status } = req.body;
        await db.query('INSERT INTO Payments (bt_no, amount, payment_date, status) VALUES (?, ?, ?, ?)', 
            [bt_no, amount, payment_date, status]);
        res.redirect('/room/payments');
    } catch (err) {
        res.redirect('/room/payments');
    }
});

module.exports = router;