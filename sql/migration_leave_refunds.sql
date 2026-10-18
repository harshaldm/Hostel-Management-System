-- =====================================================================
-- Migration: Link Mess Leave, Hostel Leave and Mess Refunds
-- File: sql/migration_leave_refunds.sql
-- =====================================================================

BEGIN;

-- 1. Function: recompute_mess_refund(p_bt_no VARCHAR)
-- Calculates distinct leave dates across all Mess_Leaves for this student
-- and upserts Mess_Refunds (recalculate from scratch, never increment).
CREATE OR REPLACE FUNCTION recompute_mess_refund(p_bt_no VARCHAR)
RETURNS VOID AS $$
DECLARE
    v_days INT;
    v_rate DECIMAL(10,2);
BEGIN
    -- Get refund rate from Mess_Settings (default to 100.00 if missing)
    SELECT COALESCE(value, 100.00) INTO v_rate
    FROM Mess_Settings
    WHERE setting_name = 'refund_per_day';
    
    IF v_rate IS NULL THEN
        v_rate := 100.00;
    END IF;

    -- Count distinct calendar days across all mess leaves for this student using generate_series
    SELECT COALESCE(COUNT(DISTINCT d::DATE), 0) INTO v_days
    FROM Mess_Leaves ml,
         LATERAL generate_series(ml.from_date::TIMESTAMP, ml.to_date::TIMESTAMP, '1 day'::INTERVAL) AS d
    WHERE ml.bt_no = p_bt_no
      AND ml.from_date IS NOT NULL
      AND ml.to_date IS NOT NULL
      AND ml.to_date >= ml.from_date;

    -- Upsert into Mess_Refunds (last_updated = CURRENT_TIMESTAMP)
    INSERT INTO Mess_Refunds (bt_no, total_days, refund_amount, last_updated)
    VALUES (p_bt_no, v_days, v_days * v_rate, CURRENT_TIMESTAMP)
    ON CONFLICT (bt_no) DO UPDATE
    SET total_days = EXCLUDED.total_days,
        refund_amount = EXCLUDED.refund_amount,
        last_updated = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- 2. Ensure inclusive days calculation on Mess_Leaves (BEFORE INSERT OR UPDATE)
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

-- 3. Trigger on Mess_Leaves AFTER INSERT / UPDATE / DELETE -> recompute_mess_refund
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
    ELSE -- INSERT
        PERFORM recompute_mess_refund(NEW.bt_no);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Drop obsolete / flawed triggers on Mess_Leaves that did running +=
DROP TRIGGER IF EXISTS mess_leave_insert ON Mess_Leaves;
DROP TRIGGER IF EXISTS mess_leave_delete ON Mess_Leaves;
DROP TRIGGER IF EXISTS mess_leave_update ON Mess_Leaves;
DROP TRIGGER IF EXISTS trg_mess_leaves_recompute ON Mess_Leaves;

CREATE TRIGGER trg_mess_leaves_recompute
AFTER INSERT OR UPDATE OR DELETE ON Mess_Leaves
FOR EACH ROW
EXECUTE FUNCTION trg_mess_leaves_recompute();

-- 4. Ensure inclusive days calculation on Leave_Log (BEFORE INSERT OR UPDATE)
CREATE OR REPLACE FUNCTION trg_leave_log_calc_days()
RETURNS TRIGGER AS $$
BEGIN
    NEW.days := (NEW.to_date - NEW.from_date) + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_leave_log_calc_days ON Leave_Log;
CREATE TRIGGER trg_leave_log_calc_days
BEFORE INSERT OR UPDATE ON Leave_Log
FOR EACH ROW
EXECUTE FUNCTION trg_leave_log_calc_days();

-- 5. Trigger on Leave_Log AFTER INSERT -> auto-insert into Mess_Leaves (skips if identical exists)
CREATE OR REPLACE FUNCTION trg_sync_hostel_leave_to_mess()
RETURNS TRIGGER AS $$
DECLARE
    v_days INT;
BEGIN
    v_days := (NEW.to_date - NEW.from_date) + 1;

    -- Avoid duplicate insertion if an identical leave row already exists
    IF NOT EXISTS (
        SELECT 1 FROM Mess_Leaves
        WHERE bt_no = NEW.bt_no
          AND from_date = NEW.from_date
          AND to_date = NEW.to_date
    ) THEN
        INSERT INTO Mess_Leaves (bt_no, from_date, to_date, days)
        VALUES (NEW.bt_no, NEW.from_date, NEW.to_date, v_days);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_hostel_leave_to_mess ON Leave_Log;
CREATE TRIGGER trg_sync_hostel_leave_to_mess
AFTER INSERT ON Leave_Log
FOR EACH ROW
EXECUTE FUNCTION trg_sync_hostel_leave_to_mess();

-- 6. One-time backfill: existing Leave_Log rows -> Mess_Leaves
INSERT INTO Mess_Leaves (bt_no, from_date, to_date, days)
SELECT l.bt_no, l.from_date, l.to_date, (l.to_date - l.from_date) + 1
FROM Leave_Log l
WHERE NOT EXISTS (
    SELECT 1 FROM Mess_Leaves m
    WHERE m.bt_no = l.bt_no
      AND m.from_date = l.from_date
      AND m.to_date = l.to_date
);

-- 7. One-time backfill: recompute all Mess_Refunds from scratch
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN SELECT DISTINCT bt_no FROM Mess_Leaves LOOP
        PERFORM recompute_mess_refund(rec.bt_no);
    END LOOP;
END;
$$;

COMMIT;
