-- ===============================
-- SPORTS MANAGEMENT MODULE — PostgreSQL
-- ===============================

-- 1. Sports Items Inventory
CREATE TABLE IF NOT EXISTS Sports_Items (
    item_id SERIAL PRIMARY KEY,
    item_name VARCHAR(100) UNIQUE NOT NULL,
    total_quantity INT NOT NULL,
    available_quantity INT NOT NULL,
    fine_per_day DECIMAL(10,2) DEFAULT 0,
    cost_per_item DECIMAL(10,2) DEFAULT 0,
    total_cost DECIMAL(10,2) GENERATED ALWAYS AS (total_quantity * cost_per_item) STORED
);

-- 2. Item Issue Register
CREATE TABLE IF NOT EXISTS Sports_Issues (
    issue_id SERIAL PRIMARY KEY,
    bt_no VARCHAR(20) NOT NULL,
    item_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    issue_date DATE DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    return_date DATE NULL,
    status VARCHAR(20) DEFAULT 'Issued',

    FOREIGN KEY (bt_no) REFERENCES Students(bt_no) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES Sports_Items(item_id) ON DELETE CASCADE
);

-- 3. Pending Fines
CREATE TABLE IF NOT EXISTS Sports_Fines (
    fine_id SERIAL PRIMARY KEY,
    issue_id INT UNIQUE,
    bt_no VARCHAR(20),
    fine_amount DECIMAL(10,2) NOT NULL,
    created_date DATE DEFAULT CURRENT_DATE,

    FOREIGN KEY (issue_id) REFERENCES Sports_Issues(issue_id) ON DELETE CASCADE,
    FOREIGN KEY (bt_no) REFERENCES Students(bt_no) ON DELETE CASCADE
);

-- ===============================
-- TRIGGERS
-- ===============================

-- Check stock before issue
CREATE OR REPLACE FUNCTION sports_check_stock()
RETURNS TRIGGER AS $$
DECLARE
    avail INT;
BEGIN
    SELECT available_quantity INTO avail
    FROM Sports_Items
    WHERE item_id = NEW.item_id;

    IF avail < NEW.quantity THEN
        RAISE EXCEPTION 'Not enough sports items available';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sports_check_stock ON Sports_Issues;
CREATE TRIGGER sports_check_stock
BEFORE INSERT ON Sports_Issues
FOR EACH ROW
EXECUTE FUNCTION sports_check_stock();

-- Reduce stock after issue
CREATE OR REPLACE FUNCTION sports_reduce_stock()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE Sports_Items
    SET available_quantity = available_quantity - NEW.quantity
    WHERE item_id = NEW.item_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sports_reduce_stock ON Sports_Issues;
CREATE TRIGGER sports_reduce_stock
AFTER INSERT ON Sports_Issues
FOR EACH ROW
EXECUTE FUNCTION sports_reduce_stock();

-- Return item and create fine if late
CREATE OR REPLACE FUNCTION sports_return_fine()
RETURNS TRIGGER AS $$
DECLARE
    late_days INT;
    rate DECIMAL(10,2);
BEGIN
    IF NEW.status = 'Returned' AND OLD.status <> 'Returned' THEN
        UPDATE Sports_Items
        SET available_quantity = available_quantity + NEW.quantity
        WHERE item_id = NEW.item_id;

        IF NEW.return_date > NEW.due_date THEN
            late_days := (NEW.return_date - NEW.due_date);

            SELECT fine_per_day INTO rate
            FROM Sports_Items
            WHERE item_id = NEW.item_id;

            INSERT INTO Sports_Fines(issue_id, bt_no, fine_amount)
            VALUES(NEW.issue_id, NEW.bt_no, late_days * rate);
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sports_return_fine ON Sports_Issues;
CREATE TRIGGER sports_return_fine
AFTER UPDATE ON Sports_Issues
FOR EACH ROW
EXECUTE FUNCTION sports_return_fine();

-- ===============================
-- VIEW: Pending Fines Only
-- ===============================

CREATE OR REPLACE VIEW vw_pending_sports_fines AS
SELECT fine_id, issue_id, bt_no, fine_amount, created_date
FROM Sports_Fines;

-- ===============================
-- TEST DATA
-- ===============================

INSERT INTO Sports_Items(item_name, total_quantity, available_quantity, fine_per_day, cost_per_item)
VALUES
('Cricket Bat',10,10,20,2500),
('Football',8,8,15,1200),
('Badminton Racket',12,12,10,900),
('Volleyball',6,6,15,1000),
('Table Tennis Paddle',10,10,10,700)
ON CONFLICT (item_name) DO NOTHING;
