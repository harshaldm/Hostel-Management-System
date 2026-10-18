const express = require('express');
const router = express.Router();
const config = require('../config/config');
const db = require('../config/database');

router.get('/', (req, res) => {
    res.render('landing');
});

router.get('/login', (req, res) => {
    if (req.session.isAdmin) return res.redirect('/room/students');
    res.render('login', { error: null });
});

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === config.admin.username && password === config.admin.password) {
        req.session.isAdmin = true;
        return res.redirect('/room/students');
    }
    res.render('login', { error: 'Invalid credentials' });
});

router.get('/student-login', (req, res) => {
    if (req.session.isStudent) return res.redirect('/student');
    res.render('student-login', { error: null });
});

router.post('/student-login', async (req, res) => {
    const { rollno, password } = req.body;
    if (password !== config.student.password) {
        return res.render('student-login', { error: 'Invalid credentials' });
    }
    try {
        const [students] = await db.query('SELECT * FROM Students WHERE bt_no = ?', [rollno.toUpperCase()]);
        if (students.length === 0) {
            return res.render('student-login', { error: 'Student not found' });
        }
        req.session.isStudent = true;
        req.session.student = students[0];
        res.redirect('/student');
    } catch (err) {
        res.render('student-login', { error: err.message });
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

module.exports = router;