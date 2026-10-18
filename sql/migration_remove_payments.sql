-- =====================================================================
-- Migration: Remove Payments table and update Complaints constraints
-- File: sql/migration_remove_payments.sql
-- =====================================================================

BEGIN;

-- 1. Drop Payments table (verified no FK, views, or triggers depend on it)
DROP TABLE IF EXISTS Payments;

-- 2. Ensure Complaints status default is 'Pending'
ALTER TABLE Complaints ALTER COLUMN status SET DEFAULT 'Pending';

COMMIT;
