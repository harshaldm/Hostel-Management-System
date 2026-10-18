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

-- 10 Dishes (must be created before Weekly_Menu which references it)
CREATE TABLE IF NOT EXISTS Menu_Dishes(
    dish_id SERIAL PRIMARY KEY,
    dish_name VARCHAR(100) UNIQUE,
    meal_type VARCHAR(20)
);

-- 5 Weekly Menu
CREATE TABLE IF NOT EXISTS Weekly_Menu(
    menu_id SERIAL PRIMARY KEY,
    day_name VARCHAR(20),
    meal_type VARCHAR(20),
    dish_id INT,
    FOREIGN KEY(dish_id) REFERENCES Menu_Dishes(dish_id)
);

-- 6 Inventory
CREATE TABLE IF NOT EXISTS Inventory(
    item_id SERIAL PRIMARY KEY,
    item_name VARCHAR(100) UNIQUE,
    quantity DECIMAL(10,2),
    unit VARCHAR(20),
    cost_per_unit DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    week_no INT
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

-- 11 Requirements
CREATE TABLE IF NOT EXISTS Dish_Requirements(
    req_id SERIAL PRIMARY KEY,
    dish_id INT,
    item_id INT,
    required_qty DECIMAL(10,2),
    UNIQUE(dish_id, item_id),
    FOREIGN KEY(dish_id) REFERENCES Menu_Dishes(dish_id) ON DELETE CASCADE,
    FOREIGN KEY(item_id) REFERENCES Inventory(item_id) ON DELETE CASCADE
);

-- 12 Meal Log
CREATE TABLE IF NOT EXISTS Meal_Log(
    log_id SERIAL PRIMARY KEY,
    dish_id INT,
    served_date DATE DEFAULT CURRENT_DATE,
    meal_type VARCHAR(20),
    remarks VARCHAR(255),
    FOREIGN KEY(dish_id) REFERENCES Menu_Dishes(dish_id)
);

---------------------------------------------------
-- TRIGGERS
---------------------------------------------------

-- Mess leave insert → update refunds
CREATE OR REPLACE FUNCTION mess_leave_insert()
RETURNS TRIGGER AS $$
DECLARE
    rate DECIMAL(10,2);
BEGIN
    SELECT value INTO rate FROM Mess_Settings WHERE setting_name='refund_per_day';
    INSERT INTO Mess_Refunds(bt_no, total_days, refund_amount)
    VALUES(NEW.bt_no, NEW.days, NEW.days * rate)
    ON CONFLICT (bt_no) DO UPDATE
    SET total_days = Mess_Refunds.total_days + NEW.days,
        refund_amount = (Mess_Refunds.total_days + NEW.days) * rate;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS mess_leave_insert ON Mess_Leaves;
CREATE TRIGGER mess_leave_insert
AFTER INSERT ON Mess_Leaves
FOR EACH ROW
EXECUTE FUNCTION mess_leave_insert();

-- Mess leave delete → update refunds
CREATE OR REPLACE FUNCTION mess_leave_delete()
RETURNS TRIGGER AS $$
DECLARE
    rate DECIMAL(10,2);
BEGIN
    SELECT value INTO rate FROM Mess_Settings WHERE setting_name='refund_per_day';
    UPDATE Mess_Refunds
    SET total_days = total_days - OLD.days,
        refund_amount = (total_days - OLD.days) * rate
    WHERE bt_no = OLD.bt_no;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS mess_leave_delete ON Mess_Leaves;
CREATE TRIGGER mess_leave_delete
AFTER DELETE ON Mess_Leaves
FOR EACH ROW
EXECUTE FUNCTION mess_leave_delete();

-- Mess leave update → update refunds
CREATE OR REPLACE FUNCTION mess_leave_update()
RETURNS TRIGGER AS $$
DECLARE
    rate DECIMAL(10,2);
BEGIN
    SELECT value INTO rate FROM Mess_Settings WHERE setting_name='refund_per_day';
    UPDATE Mess_Refunds
    SET total_days = total_days - OLD.days + NEW.days,
        refund_amount = (total_days - OLD.days + NEW.days) * rate
    WHERE bt_no = NEW.bt_no;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS mess_leave_update ON Mess_Leaves;
CREATE TRIGGER mess_leave_update
AFTER UPDATE ON Mess_Leaves
FOR EACH ROW
EXECUTE FUNCTION mess_leave_update();

-- Check inventory before meal
CREATE OR REPLACE FUNCTION check_inventory_before_meal()
RETURNS TRIGGER AS $$
DECLARE
    rec RECORD;
    v_have DECIMAL(10,2);
BEGIN
    FOR rec IN SELECT item_id, required_qty FROM Dish_Requirements WHERE dish_id = NEW.dish_id
    LOOP
        SELECT quantity INTO v_have FROM Inventory WHERE item_id = rec.item_id;
        IF v_have < rec.required_qty THEN
            RAISE EXCEPTION 'Insufficient inventory stock';
        END IF;
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_inventory_before_meal ON Meal_Log;
CREATE TRIGGER check_inventory_before_meal
BEFORE INSERT ON Meal_Log
FOR EACH ROW
EXECUTE FUNCTION check_inventory_before_meal();

-- Deduct inventory after meal (converted from MySQL UPDATE JOIN)
CREATE OR REPLACE FUNCTION deduct_inventory_after_meal()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE Inventory
    SET quantity = Inventory.quantity - d.required_qty,
        total_cost = (Inventory.quantity - d.required_qty) * Inventory.cost_per_unit
    FROM Dish_Requirements d
    WHERE Inventory.item_id = d.item_id
      AND d.dish_id = NEW.dish_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS deduct_inventory_after_meal ON Meal_Log;
CREATE TRIGGER deduct_inventory_after_meal
AFTER INSERT ON Meal_Log
FOR EACH ROW
EXECUTE FUNCTION deduct_inventory_after_meal();

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

INSERT INTO Inventory(item_name, quantity, unit, cost_per_unit, total_cost, week_no) VALUES
('Rice',200,'kg',45,9000,1),
('Wheat Flour',150,'kg',38,5700,1),
('Poha Rice',80,'kg',40,3200,1),
('Onion',100,'kg',25,2500,1),
('Potato',120,'kg',30,3600,1),
('Oil',60,'litre',140,8400,1),
('Dal',90,'kg',95,8550,1),
('Paneer',40,'kg',260,10400,1),
('Milk',100,'litre',55,5500,1),
('Sugar',60,'kg',42,2520,1);

INSERT INTO Menu_Dishes(dish_name, meal_type) VALUES
('Poha','Breakfast'),('Upma','Breakfast'),('Paratha','Breakfast'),('Tea','Breakfast'),
('Rice Dal','Lunch'),('Aloo Sabzi','Lunch'),('Paneer Curry','Lunch'),('Roti','Lunch'),
('Khichdi','Dinner'),('Veg Pulao','Dinner'),('Chapati','Dinner'),('Mixed Sabzi','Dinner');

-- Requirements
INSERT INTO Dish_Requirements(dish_id, item_id, required_qty) VALUES
(1,3,5),(1,4,2),(1,6,1),
(2,4,2),(2,6,1),
(3,2,6),(3,5,3),(3,6,1),
(4,9,10),(4,10,2),
(5,1,8),(5,7,4),(5,6,1),
(6,5,6),(6,4,2),(6,6,1),
(7,8,5),(7,4,2),(7,6,1),
(8,2,8),
(9,1,6),(9,7,3),(9,6,1),
(10,1,7),(10,5,3),(10,4,2),(10,6,1),
(11,2,7),
(12,5,4),(12,4,2),(12,6,1);

-- Weekly Schedule
INSERT INTO Weekly_Menu(day_name, meal_type, dish_id) VALUES
('Monday','Breakfast',1),('Monday','Lunch',5),('Monday','Dinner',9),
('Tuesday','Breakfast',2),('Tuesday','Lunch',6),('Tuesday','Dinner',10),
('Wednesday','Breakfast',3),('Wednesday','Lunch',7),('Wednesday','Dinner',11),
('Thursday','Breakfast',1),('Thursday','Lunch',5),('Thursday','Dinner',12),
('Friday','Breakfast',2),('Friday','Lunch',6),('Friday','Dinner',9),
('Saturday','Breakfast',3),('Saturday','Lunch',7),('Saturday','Dinner',10),
('Sunday','Breakfast',1),('Sunday','Lunch',5),('Sunday','Dinner',11);


-- ===============================
-- ADVANCED UPGRADES
-- ===============================

CREATE TABLE IF NOT EXISTS Vendors(
    vendor_id SERIAL PRIMARY KEY,
    vendor_name VARCHAR(100),
    phone VARCHAR(15),
    item_speciality VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS Purchase_Orders(
    po_id SERIAL PRIMARY KEY,
    vendor_id INT,
    order_date DATE,
    status VARCHAR(20),
    FOREIGN KEY(vendor_id) REFERENCES Vendors(vendor_id)
);

CREATE TABLE IF NOT EXISTS Purchase_Items(
    po_item_id SERIAL PRIMARY KEY,
    po_id INT,
    item_id INT,
    qty DECIMAL(10,2),
    price DECIMAL(10,2),
    FOREIGN KEY(po_id) REFERENCES Purchase_Orders(po_id) ON DELETE CASCADE,
    FOREIGN KEY(item_id) REFERENCES Inventory(item_id)
);

CREATE TABLE IF NOT EXISTS Waste_Log(
    waste_id SERIAL PRIMARY KEY,
    item_id INT,
    qty DECIMAL(10,2),
    waste_date DATE,
    reason VARCHAR(255),
    FOREIGN KEY(item_id) REFERENCES Inventory(item_id)
);

CREATE TABLE IF NOT EXISTS Mess_Feedback(
    feedback_id SERIAL PRIMARY KEY,
    bt_no VARCHAR(20),
    dish_id INT,
    rating INT,
    comment_text VARCHAR(255),
    feedback_date DATE,
    FOREIGN KEY(bt_no) REFERENCES Students(bt_no) ON DELETE CASCADE,
    FOREIGN KEY(dish_id) REFERENCES Menu_Dishes(dish_id)
);

CREATE TABLE IF NOT EXISTS Alerts(
    alert_id SERIAL PRIMARY KEY,
    alert_type VARCHAR(50),
    message_text VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_resolved VARCHAR(10) DEFAULT 'No'
);

CREATE OR REPLACE VIEW vw_low_inventory AS
SELECT item_id, item_name, quantity, unit FROM Inventory WHERE quantity < 20;

CREATE OR REPLACE VIEW vw_student_refunds AS
SELECT s.bt_no, s.name, r.total_days, r.refund_amount FROM Students s JOIN Mess_Refunds r ON s.bt_no = r.bt_no;

CREATE OR REPLACE VIEW vw_weekly_menu AS
SELECT w.day_name, w.meal_type, m.dish_name FROM Weekly_Menu w JOIN Menu_Dishes m ON w.dish_id = m.dish_id;

-- Low stock alert trigger
CREATE OR REPLACE FUNCTION low_stock_alert()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.quantity < 20 THEN
        INSERT INTO Alerts(alert_type, message_text)
        VALUES('Low Stock', CONCAT(NEW.item_name, ' is below threshold'));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS low_stock_alert ON Inventory;
CREATE TRIGGER low_stock_alert
AFTER UPDATE ON Inventory
FOR EACH ROW
EXECUTE FUNCTION low_stock_alert();

-- ===============================
-- DASHBOARD VIEWS
-- ===============================

CREATE OR REPLACE VIEW vw_monthly_cost_trends AS
SELECT EXTRACT(YEAR FROM expense_date)::INT AS yr,
       EXTRACT(MONTH FROM expense_date)::INT AS mn,
       SUM(amount) AS total_expense
FROM Mess_Expenses
GROUP BY EXTRACT(YEAR FROM expense_date), EXTRACT(MONTH FROM expense_date)
ORDER BY yr, mn;

CREATE OR REPLACE VIEW vw_top_waste_items AS
SELECT i.item_name, SUM(w.qty) AS total_wasted
FROM Waste_Log w JOIN Inventory i ON w.item_id = i.item_id
GROUP BY i.item_name
ORDER BY total_wasted DESC;

CREATE OR REPLACE VIEW vw_feedback_average AS
SELECT m.dish_name, ROUND(AVG(f.rating), 2) AS avg_rating, COUNT(*) AS total_reviews
FROM Mess_Feedback f JOIN Menu_Dishes m ON f.dish_id = m.dish_id
GROUP BY m.dish_name
ORDER BY avg_rating DESC;
