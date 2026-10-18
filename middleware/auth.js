const isAuthenticated = (req, res, next) => {
    if (req.session.isAdmin) {
        return next();
    }
    res.redirect('/login');
};

const isStudent = (req, res, next) => {
    if (req.session.isStudent) {
        return next();
    }
    res.redirect('/student-login');
};

module.exports = { isAuthenticated, isStudent };