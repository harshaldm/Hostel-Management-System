
# 🏨 Hostel Management System

**Version 2.0.0** | Node.js · Express.js · PostgreSQL · EJS

A web-based Hostel Management System designed to simplify hostel administration by providing a centralized dashboard for managing students, room allocations, mess operations, and sports facilities.

The application uses **Node.js and Express.js** for the backend, **PostgreSQL** for database management, and **EJS** for server-rendered user interfaces.

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation and Setup](#-installation-and-setup)
- [Environment Configuration](#-environment-configuration)
- [Running the Application](#-running-the-application)
- [Login Credentials](#-login-credentials)
- [Database Setup](#-database-setup)
- [Available Scripts](#-available-scripts)
- [Troubleshooting](#-troubleshooting)
- [Security Recommendations](#-security-recommendations)
- [Future Enhancements](#-future-enhancements)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

Managing a hostel involves handling student records, room assignments, mess services, and recreational facilities. Performing these operations manually can lead to inefficient workflows and inconsistent records.

The Hostel Management System aims to digitize these processes through a centralized web application.

### Key Objectives

- Centralize hostel-related information and operations.
- Simplify student and room management.
- Organize mess and sports facility operations.
- Maintain structured and consistent records using PostgreSQL.
- Provide an accessible interface for hostel administrators and students.

---

## ✨ Features

### 👨‍💼 1. Administration
- Admin login and authentication.
- Centralized dashboard for hostel operations.
- Access to relevant student and facility management modules.

### 🎓 2. Student Management
- Manage student information and records.
- Support student login using roll number (`bt_no`).
- Provide student access through a dedicated login page.

### 🛏️ 3. Room Management
- Organize hostel room information.
- Support room-related administrative operations.
- Maintain room records in the PostgreSQL database.

### 🍽️ 4. Mess Management
- Dedicated mess management module.
- Database support for mess-related records and operations.
- Integration with the main hostel database.

### ⚽ 5. Sports Management
- Dedicated sports management module.
- Database support for sports-related records and operations.
- Integration with the main application.

### 🗄️ 6. Database Management
- PostgreSQL relational database.
- SQL scripts for schema creation and test data.
- Database triggers and other schema-level logic where defined.
- Separate SQL files for core, mess, and sports modules.

> Feature availability depends on the routes, database schema, and UI implemented in the current version of the project.

---

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| Express.js | Backend web framework |
| PostgreSQL | Relational database |
| `pg` | PostgreSQL connectivity for Node.js |
| EJS | Server-side HTML templating |
| npm | Dependency and package management |
| HTML, CSS, JavaScript | Web interface |

---

## 📂 Project Structure

```text
Hostel-Management-System/
│
├── config/
│   └── config.js           # Application/database configuration
│
├── routes/
│   ├── auth routes         # Authentication-related routes
│   ├── room routes         # Room management
│   ├── mess routes         # Mess management
│   ├── sports routes       # Sports management
│   └── student routes      # Student-related operations
│
├── views/
│   └── *.ejs               # EJS templates and UI pages
│
├── sql/
│   ├── setup.sql           # Database creation
│   ├── impr_sql.sql        # Core schema and database logic
│   ├── mess_sql.sql        # Mess module schema
│   ├── sports_sql.sql      # Sports module schema
│   └── test_sql.sql        # Test/sample data
│
├── .env.example            # Environment variable template
├── .env                    # Local environment configuration
├── .gitignore              # Git ignore rules
├── server.js               # Application entry point
├── package.json            # Dependencies and npm scripts
├── package-lock.json       # Locked dependency versions
└── README.md               # Project documentation
```

**Note:** The route filenames above are descriptive placeholders. Refer to the actual files in your `routes/` directory for the exact names.

---

## 📋 Prerequisites

Ensure the following software is installed:

- **Node.js:** v14 or later (a currently supported LTS version is recommended).
- **npm:** Included with Node.js.
- **PostgreSQL:** A running PostgreSQL server.
- **Git:** Optional, for cloning the repository.
- **psql:** PostgreSQL command-line client.

Verify your installations:

```bash
node --version
npm --version
psql --version
```

---

## 🚀 Installation and Setup

### Step 1: Clone the Repository

If the project is hosted on GitHub:

```bash
git clone <YOUR_REPOSITORY_URL>
cd "Hostel Management System"
```

Alternatively, open a terminal in the existing project directory.

### Step 2: Set Up PostgreSQL

Ensure your PostgreSQL server is running and that you have access to a PostgreSQL user with permission to create databases.

Create the database and load the required SQL scripts in the order described in the [Database Setup](#-database-setup) section.

### Step 3: Install Dependencies

Run the following command from the project root:

```bash
npm install
```

This installs the packages specified in `package.json` into the local `node_modules/` directory.

**Important:** `node_modules/` is not committed to Git because it is generated locally and may contain platform-specific files. Run `npm install` after cloning the repository.

### Step 4: Configure Environment Variables

Create your local `.env` file from the provided template.

**Windows PowerShell or Command Prompt:**

```powershell
Copy-Item .env.example .env
```

For Command Prompt, use:

```cmd
copy .env.example .env
```

**Linux/macOS:**

```bash
cp .env.example .env
```

Open `.env` and update the database credentials and application settings.

### Step 5: Start the Application

```bash
npm start
```

Open the application in your browser:

**http://localhost:3000**

For development, use:

```bash
npm run dev
```

This command assumes that the `dev` script is configured in `package.json`.

---

## ⚙️ Environment Configuration

Example `.env` configuration:

```env
# PostgreSQL Configuration
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_NAME=hostel_management
DB_PORT=5432

# Application Configuration
PORT=3000

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# Default Student Password
STUDENT_PASSWORD=pass123

# Session Configuration
SESSION_SECRET=replace_with_a_long_random_secret
```

### Environment Variables Reference

| Variable | Description | Example |
|---|---|---|
| `DB_HOST` | PostgreSQL server hostname | `localhost` |
| `DB_USER` | PostgreSQL username | `postgres` |
| `DB_PASSWORD` | PostgreSQL password | Your database password |
| `DB_NAME` | Database name | `hostel_management` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `PORT` | Application server port | `3000` |
| `ADMIN_USERNAME` | Configured admin username | `admin` |
| `ADMIN_PASSWORD` | Configured admin password | Set locally |
| `STUDENT_PASSWORD` | Default student password, if supported by the application | Set locally |
| `SESSION_SECRET` | Secret used for session signing | Random secret |

**Important:** The application must load environment variables before reading them. Confirm that `server.js` or your configuration module loads `dotenv` if the project uses a `.env` file.

---

## 🗄️ Database Setup

Run the SQL scripts from the project root.

### Step 1: Create the Database

```bash
psql -U postgres -f sql/setup.sql
```

This script is expected to create the `hostel_management` database.

### Step 2: Create Core Tables and Database Logic

```bash
psql -U postgres -d hostel_management -f sql/impr_sql.sql
```

This loads the main database schema and associated logic.

### Step 3: Configure the Mess Module

```bash
psql -U postgres -d hostel_management -f sql/mess_sql.sql
```

### Step 4: Configure the Sports Module

```bash
psql -U postgres -d hostel_management -f sql/sports_sql.sql
```

### Step 5: Load Test Data

```bash
psql -U postgres -d hostel_management -f sql/test_sql.sql
```

The test data is intended to help verify the application during local development.

> **Warning:** Run test-data scripts only against a development database unless you have verified their contents. They may insert, update, or delete records.

### Verify the Database

Connect to PostgreSQL:

```bash
psql -U postgres -d hostel_management
```

List the available tables:

```sql
\dt
```

Exit PostgreSQL:

```sql
\q
```

**Windows note:** If `psql` is not recognized, add the PostgreSQL `bin` directory to your PATH or run the command from the SQL Shell (psql).

---

## ▶️ Running the Application

### Production-style Start

```bash
npm start
```

### Development Start

```bash
npm run dev
```

### Expected Result

Once the application starts successfully, visit:

```text
http://localhost:3000
```

The actual port may differ if you change the `PORT` environment variable.

---

## 🔐 Login Credentials

The following are the example default credentials documented for the current setup.

| User Type | Login Page | Username / Identifier | Password |
|---|---|---|---|
| Admin | `/login` | `admin` | `admin123` |
| Student | `/student-login` | Student roll number (`bt_no`) | `pass123` |

### Admin Login

Navigate to:

```text
http://localhost:3000/login
```

Use the configured admin username and password.

### Student Login

Navigate to:

```text
http://localhost:3000/student-login
```

Enter the student's roll number (`bt_no`) and the configured default student password.

> **Security warning:** These credentials are for local development only. Change default passwords before deployment. Actual login behavior depends on the authentication logic implemented in the application.

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm install` | Install project dependencies |
| `npm start` | Start the application using the configured start script |
| `npm run dev` | Start the development server, if configured |

To inspect all available npm scripts:

```bash
npm run
```

---

## 🧰 Troubleshooting

### 1. PostgreSQL Connection Error

**Possible causes:**
- PostgreSQL is not running.
- Database credentials are incorrect.
- The database has not been created.
- The configured host or port is incorrect.

**What to do:**

1. Verify that PostgreSQL is running.
2. Check your `.env` values.
3. Confirm that the `hostel_management` database exists.
4. Test the connection:

```bash
psql -U postgres -d hostel_management
```

### 2. `npm install` Fails

Try the following:

```bash
node --version
npm --version
npm install
```

If necessary, check your network connection and the error output before clearing caches or removing lockfiles.

### 3. Port 3000 Is Already in Use

Change the port in `.env`:

```env
PORT=3001
```

Restart the application and open:

```text
http://localhost:3001
```

### 4. Missing Environment Variables

- Confirm that `.env` exists in the project root.
- Check that variable names match those used in the code.
- Ensure environment variables are loaded before the database connection is initialized.
- Restart the server after changing configuration.

### 5. Database Tables Are Missing

Run the schema scripts in the correct order:

1. `setup.sql`
2. `impr_sql.sql`
3. `mess_sql.sql`
4. `sports_sql.sql`
5. `test_sql.sql`

Check the SQL output for errors before proceeding.

### 6. `npm run dev` Does Not Work

Inspect the `scripts` section of `package.json`. If the `dev` script is absent, use `npm start` or configure a development script supported by your project.

---

## 🔒 Security Recommendations

Before deploying this project, consider the following improvements:

- Never commit `.env` or real database credentials to Git.
- Replace default admin and student passwords.
- Use strong, randomly generated session secrets.
- Hash passwords using a suitable password-hashing algorithm such as Argon2 or bcrypt.
- Validate and sanitize user input.
- Use parameterized SQL queries to help prevent SQL injection.
- Configure secure session cookies and HTTPS in production.
- Add appropriate authentication and authorization checks to protected routes.
- Avoid exposing database errors and sensitive information to users.
- Use a least-privilege PostgreSQL account for the application.
- Review dependencies regularly for security vulnerabilities.

For a basic dependency audit, run:

```bash
npm audit
```

Review the reported issues before applying updates.

---

## 🚧 Future Enhancements

Potential improvements for future versions include:

- Student profile and attendance management.
- Automated room allocation and availability tracking.
- Online mess menu and feedback management.
- Sports facility booking and scheduling.
- Fee tracking and payment management.
- Maintenance requests and complaint tracking.
- Email or in-app notifications.
- Reports and analytics for hostel administrators.
- Role-based access control for administrators, students, and staff.
- Responsive UI improvements for mobile devices.

These are suggested enhancements and may not be available in version 2.0.0.

---

## 🤝 Contributing

Contributions, bug reports, and suggestions are welcome.

1. Fork the repository.
2. Create a feature branch:

   ```bash
   git checkout -b feature/your-feature
   ```

3. Implement and test your changes.
4. Commit your changes:

   ```bash
   git add .
   git commit -m "Add: describe your changes"
   ```

5. Push the branch:

   ```bash
   git push origin feature/your-feature
   ```

6. Open a pull request describing your changes.

---

## 📄 License

No license has been specified in this README. Add a `LICENSE` file and update this section to reflect the license you choose.

---

**Hostel Management System v2.0.0**

*Simplifying hostel administration through a centralized web application.*
