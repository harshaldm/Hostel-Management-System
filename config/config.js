require('dotenv').config();

module.exports = {
    database: {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'admin123',
        database: process.env.DB_NAME || 'hostel_management',
        port: parseInt(process.env.DB_PORT, 10) || 5432
    },
    admin: {
        username: process.env.ADMIN_USERNAME || 'admin',
        password: process.env.ADMIN_PASSWORD || 'admin123'
    },
    student: {
        password: process.env.STUDENT_PASSWORD || 'pass123'
    },
    port: parseInt(process.env.PORT, 10) || 3000
};

