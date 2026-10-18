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