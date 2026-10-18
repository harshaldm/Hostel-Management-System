const { Pool, types } = require('pg');
const config = require('./config');

// Keep DATE columns (OID 1082) as plain 'YYYY-MM-DD' strings to prevent timezone shifts
types.setTypeParser(1082, val => val);

const pool = new Pool({
    host: config.database.host,
    user: config.database.user,
    password: config.database.password,
    database: config.database.database,
    port: config.database.port,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
});

// Wrapper to make pg return results in the same [rows, fields] format as mysql2
// so that existing route code using `const [rows] = await db.query(...)` works unchanged.
const originalQuery = pool.query.bind(pool);

pool.query = async function(text, params) {
    // Convert MySQL-style ? placeholders to PostgreSQL $1, $2, ... placeholders
    if (typeof text === 'string' && params && Array.isArray(params)) {
        let paramIndex = 0;
        text = text.replace(/\?/g, () => {
            paramIndex++;
            return `$${paramIndex}`;
        });
    }
    
    const result = await originalQuery(text, params);
    // Return [rows, fields] to match mysql2's promise API
    return [result.rows, result.fields];
};

module.exports = pool;