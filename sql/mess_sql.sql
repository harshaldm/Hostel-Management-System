-- =============================================
-- Mess Management Module — PostgreSQL
-- =============================================

-- 1 Settings
CREATE TABLE IF NOT EXISTS Mess_Settings(
    setting_name VARCHAR(100) PRIMARY KEY,
    value DECIMAL(10,2) NOT NULL
);
INSERT INTO Mess_Settings VALUES ('refund_per_day',100)
ON CONFLICT (setting_name) DO NOTHING;

-- 2 Fees
CREATE TABLE IF NOT EXISTS Mess_Fees(
    fee_id SERIAL PRIMARY KEY,
    bt_no VARCHAR(20),
    month INT,
    year INT,
    amount DECIMAL(10,2),
    payment_date DATE,
    status VARCHAR(20) DEFAULT 'Pending',
    FOREIGN KEY(bt_no) REFERENCES Students(bt_no) ON DELETE CASCADE
);

-- 3 Leaves
CREATE TABLE IF NOT EXISTS Mess_Leaves(
    leave_id SERIAL PRIMARY KEY,
    bt_no VARCHAR(20),
    from_date DATE,
    to_date DATE,
    days INT,
    FOREIGN KEY(bt_no) REFERENCES Students(bt_no) ON DELETE CASCADE
);

-- 4 Refunds
CREATE TABLE IF NOT EXISTS Mess_Refunds(
    refund_id SERIAL PRIMARY KEY,
    bt_no VARCHAR(20) UNIQUE,
    total_days INT DEFAULT 0,
    refund_amount DECIMAL(10,2) DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(bt_no) REFERENCES Students(bt_no) ON DELETE CASCADE
);

-- Auto-update last_updated on Mess_Refunds
CREATE OR REPLACE FUNCTION update_mess_refunds_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mess_refunds_timestamp
BEFORE UPDATE ON Mess_Refunds
FOR EACH ROW
EXECUTE FUNCTION update_mess_refunds_timestamp();

-- 5 Menu Dishes
CREATE TABLE IF NOT EXISTS Menu_Dishes(
    dish_id SERIAL PRIMARY KEY,
    dish_name VARCHAR(100) UNIQUE,
    meal_type VARCHAR(20)
);

-- 6 Weekly Menu
CREATE TABLE IF NOT EXISTS Weekly_Menu(
    menu_id SERIAL PRIMARY KEY,
    day_name VARCHAR(20),
    meal_type VARCHAR(20),
    dish_id INT,
    FOREIGN KEY(dish_id) REFERENCES Menu_Dishes(dish_id)
);

-- 7 Roles
CREATE TABLE IF NOT EXISTS Staff_Roles(
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE,
    salary_per_person DECIMAL(10,2)
);

-- 8 Staff
CREATE TABLE IF NOT EXISTS Mess_Staff(
    staff_id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    role_id INT,
    phone VARCHAR(15),
    joining_date DATE,
    status VARCHAR(20) DEFAULT 'Active',
    FOREIGN KEY(role_id) REFERENCES Staff_Roles(role_id)
);

-- 9 Expenses
CREATE TABLE IF NOT EXISTS Mess_Expenses(
    expense_id SERIAL PRIMARY KEY,
    type VARCHAR(100),
    amount DECIMAL(10,2),
    expense_date DATE,
    remarks VARCHAR(255)
);

-- 10 Vendors
CREATE TABLE IF NOT EXISTS Vendors(
    vendor_id SERIAL PRIMARY KEY,
    vendor_name VARCHAR(100),
    phone VARCHAR(15),
    item_speciality VARCHAR(100)
);

---------------------------------------------------
-- TRIGGERS
---------------------------------------------------

-- Mess leave insert → update refunds
-- Recompute Mess_Refunds from scratch using distinct dates across all leaves
CREATE OR REPLACE FUNCTION recompute_mess_refund(p_bt_no VARCHAR)
RETURNS VOID AS $$
DECLARE
    v_days INT;
    v_rate DECIMAL(10,2);
BEGIN
    SELECT COALESCE(value, 100.00) INTO v_rate
    FROM Mess_Settings
    WHERE setting_name = 'refund_per_day';
    
    IF v_rate IS NULL THEN
        v_rate := 100.00;
    END IF;

    SELECT COALESCE(COUNT(DISTINCT d::DATE), 0) INTO v_days
    FROM Mess_Leaves ml,
         LATERAL generate_series(ml.from_date::TIMESTAMP, ml.to_date::TIMESTAMP, '1 day'::INTERVAL) AS d
    WHERE ml.bt_no = p_bt_no
      AND ml.from_date IS NOT NULL
      AND ml.to_date IS NOT NULL
      AND ml.to_date >= ml.from_date;

    INSERT INTO Mess_Refunds (bt_no, total_days, refund_amount, last_updated)
    VALUES (p_bt_no, v_days, v_days * v_rate, CURRENT_TIMESTAMP)
    ON CONFLICT (bt_no) DO UPDATE
    SET total_days = EXCLUDED.total_days,
        refund_amount = EXCLUDED.refund_amount,
        last_updated = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Ensure inclusive days calculation on Mess_Leaves
CREATE OR REPLACE FUNCTION trg_mess_leaves_calc_days()
RETURNS TRIGGER AS $$
BEGIN
    NEW.days := (NEW.to_date - NEW.from_date) + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_mess_leaves_calc_days ON Mess_Leaves;
CREATE TRIGGER trg_mess_leaves_calc_days
BEFORE INSERT OR UPDATE ON Mess_Leaves
FOR EACH ROW
EXECUTE FUNCTION trg_mess_leaves_calc_days();

-- Mess leave trigger (INSERT, UPDATE, DELETE) -> recompute refunds
CREATE OR REPLACE FUNCTION trg_mess_leaves_recompute()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        PERFORM recompute_mess_refund(OLD.bt_no);
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        IF (OLD.bt_no <> NEW.bt_no) THEN
            PERFORM recompute_mess_refund(OLD.bt_no);
        END IF;
        PERFORM recompute_mess_refund(NEW.bt_no);
        RETURN NEW;
    ELSE
        PERFORM recompute_mess_refund(NEW.bt_no);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS mess_leave_insert ON Mess_Leaves;
DROP TRIGGER IF EXISTS mess_leave_delete ON Mess_Leaves;
DROP TRIGGER IF EXISTS mess_leave_update ON Mess_Leaves;
DROP TRIGGER IF EXISTS trg_mess_leaves_recompute ON Mess_Leaves;

CREATE TRIGGER trg_mess_leaves_recompute
AFTER INSERT OR UPDATE OR DELETE ON Mess_Leaves
FOR EACH ROW
EXECUTE FUNCTION trg_mess_leaves_recompute();

---------------------------------------------------
-- DASHBOARD VIEWS
---------------------------------------------------

CREATE OR REPLACE VIEW vw_student_refunds AS
SELECT s.bt_no, s.name, r.total_days, r.refund_amount 
FROM Students s 
JOIN Mess_Refunds r ON s.bt_no = r.bt_no;

CREATE OR REPLACE VIEW vw_weekly_menu AS
SELECT w.day_name, w.meal_type, m.dish_name 
FROM Weekly_Menu w 
JOIN Menu_Dishes m ON w.dish_id = m.dish_id;

CREATE OR REPLACE VIEW vw_monthly_cost_trends AS
SELECT EXTRACT(YEAR FROM expense_date)::INT AS yr,
       EXTRACT(MONTH FROM expense_date)::INT AS mn,
       SUM(amount) AS total_expense
FROM Mess_Expenses
GROUP BY EXTRACT(YEAR FROM expense_date), EXTRACT(MONTH FROM expense_date)
ORDER BY yr, mn;

-- ===============================
-- TEST DATA
-- ===============================

INSERT INTO Staff_Roles(role_name, salary_per_person) VALUES
('Cook',18000),('Helper',10000),('Manager',25000),('Cleaner',9000)
ON CONFLICT (role_name) DO UPDATE SET salary_per_person = EXCLUDED.salary_per_person;

INSERT INTO Mess_Staff(name, role_id, phone, joining_date, status) VALUES
('Ramesh Patil',1,'9876500001','2025-01-10','Active'),
('Suresh Kale',1,'9876500002','2025-02-11','Active'),
('Mohan Das',2,'9876500003','2025-03-01','Active'),
('Akash More',2,'9876500004','2025-03-15','Active'),
('Priya Sharma',3,'9876500005','2024-12-01','Active'),
('Sunita Bai',4,'9876500006','2025-01-20','Active');

INSERT INTO Menu_Dishes(dish_name, meal_type) VALUES
('Poha','Breakfast'),('Upma','Breakfast'),('Paratha','Breakfast'),('Tea','Breakfast'),
('Rice Dal','Lunch'),('Aloo Sabzi','Lunch'),('Paneer Curry','Lunch'),('Roti','Lunch'),
('Khichdi','Dinner'),('Veg Pulao','Dinner'),('Chapati','Dinner'),('Mixed Sabzi','Dinner');

-- Weekly Schedule
INSERT INTO Weekly_Menu(day_name, meal_type, dish_id) VALUES
('Monday','Breakfast',1),('Monday','Lunch',5),('Monday','Dinner',9),
('Tuesday','Breakfast',2),('Tuesday','Lunch',6),('Tuesday','Dinner',10),
('Wednesday','Breakfast',3),('Wednesday','Lunch',7),('Wednesday','Dinner',11),
('Thursday','Breakfast',1),('Thursday','Lunch',5),('Thursday','Dinner',12),
('Friday','Breakfast',2),('Friday','Lunch',6),('Friday','Dinner',9),
('Saturday','Breakfast',3),('Saturday','Lunch',7),('Saturday','Dinner',10),
('Sunday','Breakfast',1),('Sunday','Lunch',5),('Sunday','Dinner',11);

INSERT INTO Vendors(vendor_name, phone, item_speciality) VALUES
('Green Valley Fresh Agro', '9811002201', 'Fresh Vegetables'),
('Krishna Dairy Cooperative', '9811002202', 'Dairy Products'),
('Shree Ganesh Wholesale Provisions', '9811002203', 'Grains & Pulses');
