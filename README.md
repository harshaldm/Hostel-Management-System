# 🏨 Hostel Management System

**Version 2.0.0** | Node.js · Express.js · PostgreSQL · EJS · Bootstrap 5

A production-grade, full-featured Hostel Management System designed to streamline campus residence administration. It provides a centralized administrative portal and a self-service student portal for managing students, room allocations, facilities, mess billing, complaints, and sports operations.

---

## 📌 Table of Contents

- [Overview](#-overview)
- [System Portals & Features](#-system-portals--features)
  - [1. Admin Portal (Dark Theme)](#1-admin-portal-dark-theme)
  - [2. Student Portal (Green Theme)](#2-student-portal-green-theme)
  - [3. Database Engine & Automation](#3-database-engine--automation)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation and Setup](#-installation-and-setup)
- [Environment Configuration](#-environment-configuration)
- [Database Setup & Seeding](#-database-setup--seeding)
- [Running the Application](#-running-the-application)
- [Default Login Credentials](#-default-login-credentials)
- [API & Route Reference](#-api--route-reference)
- [Verification & Acceptance Testing](#-verification--acceptance-testing)
- [Contributing & License](#-contributing--license)

---

## 🎯 Overview

Managing residential hostels requires synchronized tracking of student records, bed vacancies, dining billing, leave attendance, maintenance tickets, and sports equipment.

The **Hostel Management System** digitizes these workflows with a high-performance web application backed by PostgreSQL. The system uses relational constraints, automated stored procedure triggers, and dedicated user interfaces for both administrators and residents.

---

## ✨ System Portals & Features

### 1. Admin Portal (Dark Theme)
- **Dashboard & Navigation**: High-contrast, dark-themed responsive sidebar (`#1a1a2e`).
- **Student Directory**: Student records with academic year, contact details, roll number (`bt_no`), and branch selection from official engineering departments (`CSA`, `CSD`, `CSE`, `CSH`, `ECI`, `ECE`).
- **Room Management & Occupancy**: Real-time room tracking across 5 floors (Single, Double, Triple) with capacity indicators.
- **Smart Room Allocation**:
  - The allocation dropdown displays **only available rooms** with free capacity (`COUNT(allocations) < max_capacity`).
  - Rooms with 0 allocations always remain available.
  - Reassignment modal automatically excludes the student's current room.
  - Final database safety trigger enforces integrity against race conditions.
- **Leave & Refund Processing**: Log hostel leaves with inclusive duration computation and automated daily rebate calculations.
- **Interactive Complaints Workflow**:
  - Direct status dropdown (`Pending`, `In Progress`, `Resolved`, `Cancelled`) on every ticket row.
  - Immediate visual badge color update without full page reloads:
    - `Pending`: Red
    - `In Progress`: Yellow
    - `Resolved`: Green (automatically stamps `resolved_at`)
    - `Cancelled`: Grey (clears `resolved_at`)
  - Instant Bootstrap toast notifications for status updates.
- **Visitor Registry**: Entry and exit logs, host student linking, and purpose logging.
- **Mess Operations**:
  - **Mess Fees**: Monthly ledger with status tracking and one-click "Mark Paid".
  - **Mess Leaves & Refunds**: Synchronized dining rebates recalculated via database triggers.
  - **Weekly Menu**: Complete 7-day meal schedule across Breakfast, Lunch, Snacks, and Dinner.
  - **Staff Management**: Mess personnel directory with inline `Active` / `Inactive` toggle and server-side validation.
  - **Vendors & Expenses**: Daily inventory procurement tracking and operational costs.
- **Sports Management**:
  - **Dashboard**: Live KPI stat counters, stock summary, and currently checked-out equipment.
  - **Inventory**: Stock availability, unit replacement costs, and daily late-fee rates.
  - **Equipment Issues & Fines**: Equipment loan checkout, return recording, and automated overdue penalty assessment.

### 2. Student Portal (Green Theme)
- **Dedicated Student UI**: Modern green-themed sidebar (`#198754`) tailored for mobile and desktop screens.
- **My Profile**: Identity details, enrollment year, department, and contact information.
- **My Room**: Current room allocation, floor level, and room type.
- **Complaint Lodging**:
  - File room maintenance requests (Electrical, Plumbing, Furniture, Cleaning, Internet, Pest Control).
  - Automatically associates the complaint with the student's assigned room.
  - Disables form with a warning if no room has been allocated yet.
  - "My Complaints" log tracking personal ticket history with live status badges.
- **Pending Fines**: Dedicated sports equipment fines register showing overdue days and penalty amounts.
- **Mess Fee Dues (Separate from Fines)**:
  - Displays outstanding dining fees with readable month names (e.g. "November"), billing year, and amount.
  - Displays cumulative summary: `"Total due: Rs X"`.
  - Automatically clears upon administrator marking payment as paid.
- **Leave Requests**: Apply for Mess Leaves or Hostel Leaves with start/end date validation.
- **Sports Issues**: Request equipment loans and view return due dates.

### 3. Database Engine & Automation
- **24 Relational Tables**: Normalized schema across Core Hostel, Dining Facility, and Sports Modules.
- **15 Database Triggers**: Automated room capacity checks, occupancy counts, inclusive leave duration calculations, cross-module hostel-to-mess leave synchronization, dining rebates, sports stock replenishment, and overdue fine generation.
- **4 Analytical SQL Views**: Aggregated metrics for refunds, weekly menus, monthly costs, and pending fines.
- **Enterprise Seeder (`seed.js`)**: Seed script generating realistic data across 448 students, 250 rooms, allocations, menus, staff, and tickets. Preserves student `BT24CSE106` (Bhoumik Jain).

---

## 🛠️ Technology Stack

| Component | Technology | Description |
|---|---|---|
| **Runtime** | Node.js (v18+) | Server-side JavaScript execution environment |
| **Framework** | Express.js 4.x | Fast, minimalist HTTP web application framework |
| **Database** | PostgreSQL 14+ | Relational ACID database with stored procedure triggers |
| **Database Driver** | `pg` (node-postgres) | Connection pooling via `pg.Pool` |
| **Templating** | EJS (Embedded JavaScript) | Dynamic server-side HTML rendering |
| **UI Framework** | Bootstrap 5.3 & Bootstrap Icons | Modern responsive components and iconography |
| **Configuration** | `dotenv` | Zero-dependency environment variable loader |
| **Session Store** | `express-session` | Cookie-based server sessions |

---

## 📂 Project Structure

```text
Hostel-Management-System/
├── config/
│   ├── config.js                     # Global configuration and credentials loader
│   └── database.js                   # PostgreSQL connection pool with mysql-style helper
├── middleware/
│   └── auth.js                       # Admin and Student authentication route guards
├── public/                           # Static assets, CSS, and scripts
├── routes/
│   ├── auth.js                       # Login, student login, and logout endpoints
│   ├── mess.js                       # Mess fees, leaves, weekly menu, staff, and expenses
│   ├── room.js                       # Students, rooms, allocations, complaints, visitors
│   ├── sports.js                     # Sports dashboard, inventory stock, issues, and fines
│   └── student.js                    # Student portal (profile, dues, complaints, leaves, issues)
├── sql/
│   ├── setup.sql                     # Database initialization
│   ├── impr_sql.sql                  # Core hostel management schema, triggers, and views
│   ├── mess_sql.sql                  # Dining facility schema and rebate triggers
│   ├── sports_sql.sql                # Sports inventory schema and overdue fine triggers
│   ├── migration_remove_payments.sql # Migration dropping Payments table and setting defaults
│   └── migration_leave_refunds.sql   # Migration linking mess and hostel leaves to refunds
├── views/
│   ├── landing.ejs                   # Public landing page
│   ├── login.ejs                     # Administrator login page
│   ├── student-login.ejs             # Student portal login page
│   ├── room/                         # Admin Core Hostel views (students, rooms, allocations, etc.)
│   ├── mess/                         # Admin Mess views (fees, leaves, menu, staff, vendors, etc.)
│   ├── sports/                       # Admin Sports views (dashboard, inventory, issues, fines)
│   └── student/                      # Student Portal views (profile, room, dues, complaints, etc.)
├── DatabaseArchitecture.md           # Complete technical reference (24 tables, 12 triggers, ERD)
├── seed.js                           # Deterministic mock data seeder and reset utility
├── server.js                         # Application entry point, helpers, and route mounting
├── package.json                      # NPM dependencies and scripts
└── README.md                         # Project documentation
```

---

## 📋 Prerequisites

Ensure the following tools are installed:
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **PostgreSQL**: v14 or higher running on port `5432`

---

## 🚀 Installation and Setup

### 1. Clone Repository & Install Dependencies

```bash
git clone https://github.com/harshaldm/Hostel-Management-System.git
cd Hostel-Management-System
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```env
# PostgreSQL Configuration
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_NAME=hostel_management
DB_PORT=5432

# Application Server Port
PORT=3000

# Authentication Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
STUDENT_PASSWORD=pass123
```

---

## 🗄️ Database Setup & Seeding

### Option A: Complete Seed (Recommended)
You can create the database schema and populate all 24 tables with realistic data in one command:

```bash
# Wipe all tables and populate fresh mock data:
node seed.js --reset
```

### Option B: Dry Run (Validation only)
Inspect the generated data distribution without modifying the database:

```bash
node seed.js --dry
```

### Option C: Manual SQL Scripts via `psql`
```bash
psql -U postgres -f sql/setup.sql
psql -U postgres -d hostel_management -f sql/impr_sql.sql
psql -U postgres -d hostel_management -f sql/mess_sql.sql
psql -U postgres -d hostel_management -f sql/sports_sql.sql
psql -U postgres -d hostel_management -f sql/migration_remove_payments.sql
```

---

## ▶️ Running the Application

Start the web server:

```bash
npm start
```

Visit the application in your browser:
**[http://localhost:3000](http://localhost:3000)**

---

## 🔐 Default Login Credentials

| Role | Portal URL | Username / Roll No | Default Password |
|---|---|---|---|
| **Administrator** | `http://localhost:3000/login` | `admin` | `admin123` |
| **Student** | `http://localhost:3000/student-login` | `BT24CSE106` *(or any seeded roll no)* | `pass123` |

---

## 🌐 API & Route Reference

### Authentication Routes
- `GET /` — Public landing page.
- `GET /login` / `POST /login` — Admin login and session creation.
- `GET /student-login` / `POST /student-login` — Student authentication via Roll No / Phone.
- `GET /logout` — Destroys session and redirects to landing.

### Core Hostel Routes (`/room`)
- `GET /room/students` — Student directory with branch filter and modal forms.
- `POST /room/students/add` — Enrolls new student with department validation.
- `GET /room/rooms` — Room layout, types, and floor occupancy.
- `GET /room/allocations` — Tenancy records and allocation modal.
- `GET /room/available-rooms` — JSON endpoint returning only rooms with free beds.
- `POST /room/allocations/add` — Assigns student to room (capacity enforced).
- `POST /room/allocations/reassign` — Transfers student to a different available room.
- `GET /room/complaints` — Maintenance tickets table with interactive status select.
- `PATCH /complaints/:id/status` — Updates ticket status (`Pending`, `In Progress`, `Resolved`, `Cancelled`).
- `GET /room/visitors` — Visitor registry.

### Dining Routes (`/mess`)
- `GET /mess/fees` — Student monthly dining fee register.
- `POST /mess/fees/add` — Issues monthly dining fee.
- `POST /mess/fees/mark-paid/:id` — Marks fee as paid.
- `GET /mess/leaves` — Mess leaves log and rebate summaries.
- `GET /mess/menu` — 7-day weekly menu timetable.
- `GET /mess/staff` — Staff roster with inline `Active` / `Inactive` status dropdown.
- `PATCH /mess/staff/:id/status` — Persists staff employment status.
- `GET /mess/vendors` — Registered supplier directory.
- `GET /mess/expenses` — Operational dining expenses.

### Sports Routes (`/sports`)
- `GET /sports/dashboard` — KPI dashboard, equipment summary, and current loans.
- `GET /sports/inventory` — Stock levels, fines per day, and costs.
- `GET /sports/issues` — Loan checkout register and return processing.
- `GET /sports/fines` — Overdue penalties log.

### Student Portal Routes (`/student`)
- `GET /student/profile` — Student profile overview.
- `GET /student/room` — Personal room details and roommates.
- `GET /student/dues` — Unpaid mess fees with month names and total balance.
- `GET /student/complaints` — Submit room maintenance issues and view history.
- `POST /student/complaints/add` — Submits ticket auto-binding student room.
- `GET /student/fines` — Pending sports penalties.
- `GET /student/mess-leave` / `POST /student/mess-leave/add` — Dining absence requests.
- `GET /student/hostel-leave` / `POST /student/hostel-leave/add` — Hostel gate pass requests.
- `GET /student/sports-issue` / `POST /student/sports-issue/add` — Equipment loan requests.

---

## 🧪 Verification & Acceptance Testing

The repository contains automated acceptance test suites covering core functionality:

```bash
# Run acceptance test harness:
node test_acceptance.js
```

### Verified Acceptance Scenarios:
1. **Hostel Payments Removal**: Table dropped without cascade; sidebar link and route removed; mess fees intact.
2. **Student Dues Isolation**: Displays pending mess dues with readable month names and total amount; separate from sports fines; clears live upon payment.
3. **Complaint Workflow**: Instant status changes (`Pending`, `In Progress`, `Resolved`, `Cancelled`), timestamp auditing, 400 rejection on invalid status, unallocated room protection.
4. **Smart Room Allocations**: Available-only room filtering with capacity trigger fallback.

---

## 📄 License & Technical Documentation

- Full database architecture, Entity-Relationship diagrams, and trigger matrix: **[DatabaseArchitecture.md](file:///c:/Users/bhoum/Desktop/coding/AG/Hostel-Management-System/DatabaseArchitecture.md)**.
- Licensed under the **MIT License**.
