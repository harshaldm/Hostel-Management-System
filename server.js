const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const config = require('./config/config');

const app = express();

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
    secret: 'hostel_secret_key',
    resave: false,
    saveUninitialized: true
}));

// Global Date Formatter Helper: formats 'YYYY-MM-DD' as 'D/M/YYYY' or 'DD/MM/YYYY'
app.locals.formatDate = function(d) {
    if (!d) return '-';
    if (typeof d === 'string') {
        const match = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (match) {
            return `${parseInt(match[3], 10)}/${parseInt(match[2], 10)}/${match[1]}`;
        }
    }
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return String(d);
    return `${dt.getDate()}/${dt.getMonth() + 1}/${dt.getFullYear()}`;
};

app.locals.formatDateISO = function(d) {
    if (!d) return '';
    if (typeof d === 'string') {
        const match = d.match(/^(\d{4}-\d{2}-\d{2})/);
        if (match) return match[1];
    }
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return '';
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/room');
const messRoutes = require('./routes/mess');
const sportsRoutes = require('./routes/sports');
const studentRoutes = require('./routes/student');

app.use('/', authRoutes);
app.use('/room', roomRoutes);
app.use('/mess', messRoutes);
app.use('/sports', sportsRoutes);
app.use('/student', studentRoutes);

app.get('/dashboard', (req, res) => {
    if (!req.session.isAdmin) return res.redirect('/login');
    res.redirect('/room/students');
});

app.listen(config.port, () => {
    console.log(`Server running on http://localhost:${config.port}`);
});