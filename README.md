# Hostel Management System - Version 2.0.0

A Node.js/Express-based hostel management dashboard for managing students, rooms, mess, and sports facilities.

## Quick Start

### Prerequisites
- Node.js (v14+)
- PostgreSQL server

### 1. Setup Database

```bash
# Step 1: Create the database
psql -U postgres -f sql/setup.sql

# Step 2: Run the main schema (tables, triggers)
psql -U postgres -d hostel_management -f sql/impr_sql.sql

# Step 3: Run mess module
psql -U postgres -d hostel_management -f sql/mess_sql.sql

# Step 4: Run sports module
psql -U postgres -d hostel_management -f sql/sports_sql.sql

# Step 5: Load test data
psql -U postgres -d hostel_management -f sql/test_sql.sql
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure

Edit `config/config.js` with your database credentials:
```javascript
module.exports = {
    database: {
        host: 'localhost',
        user: 'postgres',
        password: 'your_password',
        database: 'hostel_management',
        port: 5432
    },
    admin: {
        username: 'admin',
        password: 'admin123'
    },
    student: {
        password: 'pass123'
    },
    port: 3000
};
```

### 4. Run

```bash
npm start
```

Server runs at `http://localhost:3000`

## Project Structure

```
├── config/          # Database config (PostgreSQL)
├── routes/          # API routes (auth, room, mess, sports, student)
├── views/           # EJS templates
├── sql/             # PostgreSQL schema & seed data
├── server.js        # Main entry point
└── package.json
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start dev server |

## Login

Default login page at `/login`. Admin credentials: `admin` / `admin123`.
Student login at `/student-login` with roll number and password `pass123`.