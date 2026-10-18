-- =============================================
-- Master Setup Script — PostgreSQL
-- Run this to create the database and all tables.
-- Usage: psql -U postgres -f sql/setup.sql
-- =============================================

-- Drop and recreate the database
DROP DATABASE IF EXISTS hostel_management;
CREATE DATABASE hostel_management;
