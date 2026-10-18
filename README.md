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

### 2. Install Dependencies (`node_modules`)

```bash
npm install
```

> **Note on `node_modules/`:**  
> Running `npm install` installs all project dependencies (such as `express`, `pg`, `ejs`, etc.) into the local `node_modules/` directory based on [`package.json`](file:///c:/Users/Harshal/Desktop/DBMS/Hostel%20Management%20System/package.json). Because `node_modules/` is large and platform-dependent, it is excluded from Git via [`.gitignore`](file:///c:/Users/Harshal/Desktop/DBMS/Hostel%20Management%20System/.gitignore). Anyone cloning the project must run `npm install` locally before starting the server.

### 3. Configure Environment Variables (`.env`)

A template file [`.env.example`](file:///c:/Users/Harshal/Desktop/DBMS/Hostel%20Management%20System/.env.example) is provided in the repository. Create your local `.env` file by copying the template:

**Windows (PowerShell / Command Prompt):**
```bash
copy .env.example .env
```

**Linux / macOS:**
```bash
cp .env.example .env
```

Open `.env` and fill in your PostgreSQL credentials and app settings:

```env
# Database
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_NAME=hostel_management
DB_PORT=5432

# App
PORT=3000

# Admin credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# Student default password
STUDENT_PASSWORD=pass123

# Session secret
SESSION_SECRET=hostel_secret_key
```

> **Security Note:**  
> The `.env` file contains sensitive credentials and is listed in [`.gitignore`](file:///c:/Users/Harshal/Desktop/DBMS/Hostel%20Management%20System/.gitignore) so it is never committed to version control.

You can also check or adjust [`config/config.js`](file:///c:/Users/Harshal/Desktop/DBMS/Hostel%20Management%20System/config/config.js) if editing database configuration directly.

### 4. Run

```bash
npm start
```

Or for development:
```bash
npm run dev
```

Server runs at `http://localhost:3000`

## Project Structure

```
├── .env.example     # Environment variable template (tracked in Git)
├── .env             # Local environment secrets & config (ignored in Git)
├── .gitignore       # Git ignore rules (node_modules, .env, etc.)
├── node_modules/    # Installed npm packages (ignored in Git, created via npm install)
├── config/          # Database connection & credentials
├── routes/          # API & page routes (auth, room, mess, sports, student)
├── views/           # EJS UI templates
├── sql/             # PostgreSQL schemas, triggers, and seed data
├── server.js        # Main application entry point
├── package.json     # Project dependencies & npm scripts
└── README.md        # Project documentation
```

## Environment Variables Reference

| Variable | Description | Default / Example |
|---|---|---|
| `DB_HOST` | PostgreSQL host address | `localhost` |
| `DB_USER` | PostgreSQL username | `postgres` |
| `DB_PASSWORD` | PostgreSQL user password | `your_password_here` |
| `DB_NAME` | PostgreSQL database name | `hostel_management` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `PORT` | Express application server port | `3000` |
| `ADMIN_USERNAME` | Admin login username | `admin` |
| `ADMIN_PASSWORD` | Admin login password | `admin123` |
| `STUDENT_PASSWORD` | Default password for student logins | `pass123` |
| `SESSION_SECRET` | Secret key used for session signing | `hostel_secret_key` |

## Available Scripts

| Command | Description |
|---|---|
| `npm start` | Start production server |
| `npm run dev` | Start dev server |

## Login

- Default admin login page at `/login` with credentials `admin` / `admin123`.
- Student login at `/student-login` with student roll number (`bt_no`) and password `pass123`.