-- =============================================
-- Hostel Management System — PostgreSQL Schema
-- =============================================

---------------------------------------------------
-- 1. STUDENTS (CORE TABLE)
---------------------------------------------------
CREATE TABLE Students (
    bt_no VARCHAR(20) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    year INT NOT NULL,
    phone VARCHAR(15) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    branch VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

---------------------------------------------------
-- 2. ROOMS
---------------------------------------------------
CREATE TABLE Rooms (
    room_no INT PRIMARY KEY,
    max_capacity INT NOT NULL,
    floor_no INT NOT NULL,
    room_type VARCHAR(50)
);

---------------------------------------------------
-- 3. ROOM ALLOCATION (MAIN RELATION TABLE)
---------------------------------------------------
CREATE TABLE Room_Allocations (
    alloc_id SERIAL PRIMARY KEY,
    bt_no VARCHAR(20),
    room_no INT,
    allocation_date DATE DEFAULT CURRENT_DATE,

    FOREIGN KEY (bt_no) REFERENCES Students(bt_no) ON DELETE CASCADE,
    FOREIGN KEY (room_no) REFERENCES Rooms(room_no) ON DELETE CASCADE
);

---------------------------------------------------
-- 4. ROOM OCCUPANCY (DERIVED / OPTIONAL CACHE)
---------------------------------------------------
CREATE TABLE Room_Occupancy (
    room_no INT PRIMARY KEY,
    current_count INT DEFAULT 0,

    FOREIGN KEY (room_no) REFERENCES Rooms(room_no) ON DELETE CASCADE
);

---------------------------------------------------
-- 5. LEAVE LOG
---------------------------------------------------
CREATE TABLE Leave_Log (
    leave_id SERIAL PRIMARY KEY,
    bt_no VARCHAR(20),
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    days INT,

    FOREIGN KEY (bt_no) REFERENCES Students(bt_no) ON DELETE CASCADE
);

---------------------------------------------------
-- 6. LEAVE SUMMARY (AGGREGATED)
---------------------------------------------------
CREATE TABLE Leave_Summary (
    bt_no VARCHAR(20) PRIMARY KEY,
    name VARCHAR(255),
    total_days INT DEFAULT 0,

    FOREIGN KEY (bt_no) REFERENCES Students(bt_no) ON DELETE CASCADE
);

---------------------------------------------------
-- 7. HOSTEL SETTINGS (CONFIG TABLE)
---------------------------------------------------
CREATE TABLE Hostel_Settings (
    setting_name VARCHAR(100) PRIMARY KEY,
    value DECIMAL(10,2) NOT NULL
);

INSERT INTO Hostel_Settings VALUES ('leave_refund_per_day', 100);

---------------------------------------------------
-- 8. REFUND TABLE
---------------------------------------------------
CREATE TABLE Refunds (
    refund_id SERIAL PRIMARY KEY,
    bt_no VARCHAR(20),
    name VARCHAR(255),
    refund_amount DECIMAL(10,2) DEFAULT 0,

    FOREIGN KEY (bt_no) REFERENCES Students(bt_no) ON DELETE CASCADE
);

---------------------------------------------------
-- 9. COMPLAINTS / MAINTENANCE
---------------------------------------------------
CREATE TABLE Complaints (
    complaint_id SERIAL PRIMARY KEY,
    bt_no VARCHAR(20),
    room_no INT,
    issue_type VARCHAR(100),
    description TEXT,
    status VARCHAR(20) DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,

    FOREIGN KEY (bt_no) REFERENCES Students(bt_no) ON DELETE CASCADE,
    FOREIGN KEY (room_no) REFERENCES Rooms(room_no) ON DELETE CASCADE
);

---------------------------------------------------
-- 10. VISITOR LOG
---------------------------------------------------
CREATE TABLE Visitors (
    visitor_id SERIAL PRIMARY KEY,
    student_bt_no VARCHAR(20),
    visitor_name VARCHAR(255),
    visit_date DATE,
    in_time TIME,
    out_time TIME,
    purpose VARCHAR(255),

    FOREIGN KEY (student_bt_no) REFERENCES Students(bt_no) ON DELETE CASCADE
);

---------------------------------------------------
-- 11. PAYMENTS
---------------------------------------------------
CREATE TABLE Payments (
    payment_id SERIAL PRIMARY KEY,
    bt_no VARCHAR(20),
    amount DECIMAL(10,2),
    payment_date DATE,
    status VARCHAR(20),

    FOREIGN KEY (bt_no) REFERENCES Students(bt_no) ON DELETE CASCADE
);

---------------------------------------------------
-- 12. ALLOCATION HISTORY
---------------------------------------------------
CREATE TABLE Allocation_History (
    history_id SERIAL PRIMARY KEY,
    bt_no VARCHAR(20),
    old_room INT,
    new_room INT,
    from_date DATE,
    to_date DATE,

    FOREIGN KEY (bt_no) REFERENCES Students(bt_no) ON DELETE CASCADE
);

---------------------------------------------------
-- TRIGGERS (PL/pgSQL)
---------------------------------------------------

---------------------------------------------------
-- ROOM CAPACITY CHECK
---------------------------------------------------
CREATE OR REPLACE FUNCTION check_room_capacity()
RETURNS TRIGGER AS $$
DECLARE
    max_cap INT;
    curr INT;
BEGIN
    SELECT max_capacity INTO max_cap
    FROM Rooms
    WHERE room_no = NEW.room_no;

    SELECT COUNT(*) INTO curr
    FROM Room_Allocations
    WHERE room_no = NEW.room_no;

    IF curr >= max_cap THEN
        RAISE EXCEPTION 'Room is full';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_room_capacity
BEFORE INSERT ON Room_Allocations
FOR EACH ROW
EXECUTE FUNCTION check_room_capacity();

---------------------------------------------------
-- UPDATE ROOM OCCUPANCY
---------------------------------------------------
CREATE OR REPLACE FUNCTION update_room_occupancy()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO Room_Occupancy (room_no, current_count)
    VALUES (NEW.room_no, 1)
    ON CONFLICT (room_no) DO UPDATE
    SET current_count = Room_Occupancy.current_count + 1;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_room_occupancy
AFTER INSERT ON Room_Allocations
FOR EACH ROW
EXECUTE FUNCTION update_room_occupancy();

---------------------------------------------------
-- LEAVE INSERT
---------------------------------------------------
CREATE OR REPLACE FUNCTION leave_insert()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO Leave_Summary (bt_no, name, total_days)
    VALUES (
        NEW.bt_no,
        (SELECT name FROM Students WHERE bt_no = NEW.bt_no),
        NEW.days
    )
    ON CONFLICT (bt_no) DO UPDATE
        SET total_days = Leave_Summary.total_days + NEW.days;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leave_insert
AFTER INSERT ON Leave_Log
FOR EACH ROW
EXECUTE FUNCTION leave_insert();

---------------------------------------------------
-- REFUND INSERT
---------------------------------------------------
CREATE OR REPLACE FUNCTION refund_insert()
RETURNS TRIGGER AS $$
DECLARE
    rate DECIMAL(10,2);
BEGIN
    SELECT value INTO rate
    FROM Hostel_Settings
    WHERE setting_name = 'leave_refund_per_day';

    INSERT INTO Refunds (bt_no, name, refund_amount)
    VALUES (NEW.bt_no, NEW.name, NEW.total_days * rate);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER refund_insert
AFTER INSERT ON Leave_Summary
FOR EACH ROW
EXECUTE FUNCTION refund_insert();

---------------------------------------------------
-- REFUND UPDATE
---------------------------------------------------
CREATE OR REPLACE FUNCTION refund_update()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE Refunds
    SET refund_amount = NEW.total_days * 100
    WHERE bt_no = NEW.bt_no;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER refund_update
AFTER UPDATE ON Leave_Summary
FOR EACH ROW
EXECUTE FUNCTION refund_update();
