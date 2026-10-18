-- =====================================================================
-- Hostel Management System — Comprehensive Database Seeder (PostgreSQL)
-- =====================================================================
-- This file populates the database with realistic mock data across all
-- 33 tables and analytical views.
--
-- Modules Covered:
--  1. Configuration & Settings (Hostel_Settings, Mess_Settings)
--  2. Staff & Vendors (Staff_Roles, Mess_Staff, Vendors)
--  3. Student Directory (Students)
--  4. Rooms & Allocation Infrastructure (Rooms, Room_Allocations, Room_Occupancy, Allocation_History)
--  5. Leaves & Automatic Refunds (Leave_Log, Leave_Summary, Refunds)
--  6. Facility Maintenance & Visitor Logging (Complaints, Visitors, Payments)
--  7. Mess Pantry, Recipes & Weekly Menu (Inventory, Menu_Dishes, Dish_Requirements, Weekly_Menu, Meal_Log)
--  8. Mess Accounting, Procurement & Feedback (Mess_Fees, Mess_Leaves, Mess_Refunds, Mess_Expenses, Purchase_Orders, Purchase_Items, Waste_Log, Mess_Feedback, Alerts)
--  9. Sports Facility Management (Sports_Items, Sports_Issues, Sports_Fines)
--
-- Usage:
--   psql -U postgres -d hostel_management -f sql/seed.sql
--   or:
--   npm run seed
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 0. Clean reset of existing mock data (cascades cleanly through FKs)
-- ---------------------------------------------------------------------
TRUNCATE TABLE 
    Students, 
    Rooms, 
    Hostel_Settings, 
    Mess_Settings, 
    Staff_Roles, 
    Vendors, 
    Inventory, 
    Menu_Dishes, 
    Sports_Items,
    Mess_Expenses,
    Alerts
RESTART IDENTITY CASCADE;

-- ---------------------------------------------------------------------
-- 1. System Configuration & Settings
-- ---------------------------------------------------------------------
INSERT INTO Hostel_Settings (setting_name, value) VALUES 
('leave_refund_per_day', 100.00)
ON CONFLICT (setting_name) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO Mess_Settings (setting_name, value) VALUES 
('refund_per_day', 100.00)
ON CONFLICT (setting_name) DO UPDATE SET value = EXCLUDED.value;

-- ---------------------------------------------------------------------
-- 2. Staff Roles & Mess Staff
-- ---------------------------------------------------------------------
INSERT INTO Staff_Roles (role_id, role_name, salary_per_person) VALUES 
(1, 'Manager', 28000.00),
(2, 'Head Chef', 22000.00),
(3, 'Cook', 18000.00),
(4, 'Assistant Cook', 14000.00),
(5, 'Helper', 11000.00),
(6, 'Cleaner', 9500.00),
(7, 'Storekeeper', 16000.00)
ON CONFLICT (role_id) DO UPDATE SET 
    role_name = EXCLUDED.role_name, 
    salary_per_person = EXCLUDED.salary_per_person;

SELECT setval('staff_roles_role_id_seq', (SELECT MAX(role_id) FROM Staff_Roles));

INSERT INTO Mess_Staff (name, role_id, phone, joining_date, status) VALUES 
('Priya Sharma', 1, '9876500001', '2024-11-01', 'Active'),
('Vikram Singh', 2, '9876500002', '2024-11-15', 'Active'),
('Ramesh Patil', 3, '9876500003', '2025-01-10', 'Active'),
('Suresh Kale', 3, '9876500004', '2025-01-15', 'Active'),
('Anil Verma', 4, '9876500005', '2025-02-01', 'Active'),
('Mohan Das', 5, '9876500006', '2025-02-10', 'Active'),
('Akash More', 5, '9876500007', '2025-02-15', 'Active'),
('Sunita Bai', 6, '9876500008', '2025-01-20', 'Active'),
('Laxmi Devi', 6, '9876500009', '2025-02-01', 'Active'),
('Rajesh Gupta', 7, '9876500010', '2025-01-05', 'Active');

-- ---------------------------------------------------------------------
-- 3. Vendors
-- ---------------------------------------------------------------------
INSERT INTO Vendors (vendor_id, vendor_name, phone, item_speciality) VALUES 
(1, 'Green Valley Fresh Agro', '9811002201', 'Fresh Farm Vegetables & Greens'),
(2, 'Krishna Dairy Cooperative', '9811002202', 'Fresh Milk, Curd, Butter & Paneer'),
(3, 'Shree Ganesh Wholesale Provisions', '9811002203', 'Grains, Flours, Pulses & Basmati Rice'),
(4, 'Bharat Commercial LPG Agency', '9811002204', 'Commercial Gas Cylinders & Kitchen Fuel'),
(5, 'Royal Spices & Oil Millers', '9811002205', 'Refined Oil, Ghee, Whole & Ground Spices');

SELECT setval('vendors_vendor_id_seq', (SELECT MAX(vendor_id) FROM Vendors));

-- ---------------------------------------------------------------------
-- 4. Student Profiles (Diverse batches across 1st to 4th Year)
-- ---------------------------------------------------------------------
INSERT INTO Students (bt_no, name, year, phone, email, branch) VALUES 
('BT24CSE106', 'Bhoumik Jain', 3, '9820011002', 'bhoumik.jain@gmail.com', 'CSE'),
('BT24CSE088', 'Harshal Mestri', 3, '9820011001', 'harshal.mestri@gmail.com', 'CSE'),
('BT24CSE083', 'Sahil Padole', 3, '9820011003', 'sahil.padole@gmail.com', 'CSE'),
('BT24CSE082', 'Tarush Varma', 3, '9820011004', 'tarush.varma@gmail.com', 'CSE'),
('BT25CSE012', 'Aarav Sharma', 2, '9820011005', 'aarav.sharma@gmail.com', 'CSE'),
('BT25ECE045', 'Ananya Iyer', 2, '9820011006', 'ananya.iyer@gmail.com', 'ECE'),
('BT26ME008', 'Rohan Kulkarni', 1, '9820011007', 'rohan.kulkarni@gmail.com', 'MECH'),
('BT26CE019', 'Aditi Deshmukh', 1, '9820011008', 'aditi.deshmukh@gmail.com', 'CIVIL'),
('BT23IT034', 'Siddharth Nair', 4, '9820011009', 'siddharth.nair@gmail.com', 'IT'),
('BT23EE027', 'Pooja Reddy', 4, '9820011010', 'pooja.reddy@gmail.com', 'EE'),
('BT25AIDS05', 'Kabir Mehta', 2, '9820011011', 'kabir.mehta@gmail.com', 'AIDS'),
('BT24ECE091', 'Neha Joshi', 3, '9820011012', 'neha.joshi@gmail.com', 'ECE'),
('BT26CSE033', 'Aryan Patel', 1, '9820011013', 'aryan.patel@gmail.com', 'CSE'),
('BT23CSE015', 'Tanvi Bhat', 4, '9820011014', 'tanvi.bhat@gmail.com', 'CSE'),
('BT25CHE022', 'Manish Sen', 2, '9820011015', 'manish.sen@gmail.com', 'CHEM'),
('BT24ME064', 'Devendra Rao', 3, '9820011016', 'devendra.rao@gmail.com', 'MECH'),
('BT26ECE051', 'Shruti Shinde', 1, '9820011017', 'shruti.shinde@gmail.com', 'ECE'),
('BT25IT018', 'Kunal Chavan', 2, '9820011018', 'kunal.chavan@gmail.com', 'IT');

-- ---------------------------------------------------------------------
-- 5. Physical Rooms Catalog
-- ---------------------------------------------------------------------
INSERT INTO Rooms (room_no, max_capacity, floor_no, room_type) VALUES 
(101, 3, 1, 'Triple'),
(102, 2, 1, 'Double'),
(103, 1, 1, 'Single'),
(104, 2, 1, 'Double'),
(105, 3, 1, 'Triple'),
(201, 4, 2, 'Dormitory'),
(202, 2, 2, 'Double'),
(203, 2, 2, 'Double'),
(204, 1, 2, 'Single'),
(205, 3, 2, 'Triple'),
(301, 2, 3, 'Double'),
(302, 2, 3, 'Double'),
(303, 1, 3, 'Single'),
(304, 4, 3, 'Dormitory'),
(401, 1, 4, 'Single'),
(402, 2, 4, 'Double');

-- Initialize base occupancy for all rooms so occupancy cache is complete
INSERT INTO Room_Occupancy (room_no, current_count)
SELECT room_no, 0 FROM Rooms
ON CONFLICT (room_no) DO NOTHING;

-- ---------------------------------------------------------------------
-- 6. Room Allocations
-- (Capacity trigger 'check_room_capacity' and occupancy trigger 'update_room_occupancy' fire automatically)
-- ---------------------------------------------------------------------
INSERT INTO Room_Allocations (bt_no, room_no, allocation_date) VALUES 
('BT24CSE106', 101, '2025-01-05'),
('BT24CSE088', 101, '2025-01-05'),
('BT24CSE083', 101, '2025-01-05'),
('BT24CSE082', 102, '2025-01-06'),
('BT25CSE012', 102, '2025-01-06'),
('BT23IT034',  103, '2025-01-07'),
('BT25ECE045', 104, '2025-01-08'),
('BT24ECE091', 104, '2025-01-08'),
('BT26ME008',  201, '2025-01-10'),
('BT26CE019',  201, '2025-01-10'),
('BT26CSE033', 201, '2025-01-10'),
('BT25AIDS05', 201, '2025-01-10'),
('BT23EE027',  202, '2025-01-12'),
('BT23CSE015', 204, '2025-01-12'),
('BT25CHE022', 301, '2025-01-15'),
('BT24ME064',  301, '2025-01-15');

-- ---------------------------------------------------------------------
-- 7. Allocation History (Historical room transfers)
-- ---------------------------------------------------------------------
INSERT INTO Allocation_History (bt_no, old_room, new_room, from_date, to_date) VALUES 
('BT24CSE106', 104, 101, '2024-08-01', '2025-01-04'),
('BT24CSE088', 202, 101, '2024-08-01', '2025-01-04'),
('BT23IT034',  201, 103, '2023-08-01', '2024-07-31'),
('BT23CSE015', 302, 204, '2023-08-01', '2024-07-31'),
('BT24ME064',  205, 301, '2024-08-01', '2025-01-14');

-- ---------------------------------------------------------------------
-- 8. Hostel Leave Logs
-- (Trigger 'leave_insert' populates Leave_Summary; trigger 'refund_insert' populates Refunds)
-- ---------------------------------------------------------------------
INSERT INTO Leave_Log (bt_no, from_date, to_date, days) VALUES 
('BT24CSE106', '2025-02-10', '2025-02-13', 4),
('BT24CSE088', '2025-03-01', '2025-03-05', 5),
('BT24CSE083', '2025-01-15', '2025-01-17', 3),
('BT25ECE045', '2025-02-20', '2025-02-22', 3),
('BT23IT034',  '2025-03-10', '2025-03-15', 6),
('BT26ME008',  '2025-04-01', '2025-04-03', 3);

-- ---------------------------------------------------------------------
-- 9. Complaints & Maintenance Tickets
-- ---------------------------------------------------------------------
INSERT INTO Complaints (bt_no, room_no, issue_type, description, status, created_at, resolved_at) VALUES 
('BT24CSE106', 101, 'Fan Issue', 'Ceiling fan makes humming noise at high speed', 'Resolved', '2025-02-01 10:30:00', '2025-02-02 15:45:00'),
('BT24CSE088', 101, 'Light Issue', 'Study tube light flickering continuously', 'Resolved', '2025-02-15 09:00:00', '2025-02-15 14:20:00'),
('BT24CSE082', 102, 'Water Problem', 'Low water pressure in attached washbasin tap', 'In Progress', '2025-03-02 11:15:00', NULL),
('BT25ECE045', 104, 'Wi-Fi Problem', 'Hostel Wi-Fi access point weak signal in corner desk', 'In Progress', '2025-03-04 18:45:00', NULL),
('BT26ME008',  201, 'Furniture', 'Study table drawer lock broken', 'Pending', '2025-03-08 14:00:00', NULL),
('BT23IT034',  103, 'Plumbing', 'Bathroom shower head leaking intermittently', 'Pending', '2025-03-10 08:30:00', NULL),
('BT23CSE015', 204, 'Electrical', 'Power socket sparking on laptop plug insertion', 'Resolved', '2025-01-20 12:00:00', '2025-01-20 17:30:00');

-- ---------------------------------------------------------------------
-- 10. Visitor Register
-- ---------------------------------------------------------------------
INSERT INTO Visitors (student_bt_no, visitor_name, visit_date, in_time, out_time, purpose) VALUES 
('BT24CSE106', 'Rajesh Jain', '2025-02-08', '10:00:00', '12:30:00', 'Parent Visit & Document Handover'),
('BT24CSE088', 'Sunil Mestri', '2025-02-12', '14:00:00', '16:00:00', 'Fee Receipt Collection & Luggage'),
('BT24CSE082', 'Mukesh Varma', '2025-02-18', '11:00:00', '13:00:00', 'Health & Winter Clothing Delivery'),
('BT25ECE045', 'Radha Iyer', '2025-02-25', '15:30:00', '18:00:00', 'Family Meet & Guardian Consultation'),
('BT26ME008',  'Anand Kulkarni', '2025-03-01', '09:30:00', '11:30:00', 'First Year Orientation & Parent Visit'),
('BT23IT034',  'Kiran Nair', '2025-03-05', '16:00:00', '17:45:00', 'Sibling Visit');

-- ---------------------------------------------------------------------
-- 11. Hostel Fee Payments
-- ---------------------------------------------------------------------
INSERT INTO Payments (bt_no, amount, payment_date, status) VALUES 
('BT24CSE106', 50000.00, '2025-01-05', 'Paid'),
('BT24CSE088', 50000.00, '2025-01-06', 'Paid'),
('BT24CSE083', 50000.00, '2025-01-07', 'Paid'),
('BT24CSE082', 45000.00, '2025-01-08', 'Paid'),
('BT25CSE012', 45000.00, '2025-01-10', 'Paid'),
('BT25ECE045', 45000.00, '2025-01-12', 'Paid'),
('BT26ME008',  55000.00, '2025-01-15', 'Paid'),
('BT26CE019',  55000.00, '2025-01-16', 'Paid'),
('BT23IT034',  40000.00, '2025-01-18', 'Pending'),
('BT23EE027',  40000.00, '2025-01-20', 'Paid'),
('BT25AIDS05', 45000.00, '2025-01-22', 'Pending'),
('BT24ECE091', 50000.00, '2025-01-25', 'Paid');

-- ---------------------------------------------------------------------
-- 12. Mess Inventory (Generous quantities for recipe deductions)
-- ---------------------------------------------------------------------
INSERT INTO Inventory (item_id, item_name, quantity, unit, cost_per_unit, total_cost, week_no) VALUES 
(1,  'Rice', 500.00, 'kg', 45.00, 22500.00, 1),
(2,  'Wheat Flour', 400.00, 'kg', 38.00, 15200.00, 1),
(3,  'Poha Rice', 150.00, 'kg', 40.00, 6000.00, 1),
(4,  'Onion', 250.00, 'kg', 25.00, 6250.00, 1),
(5,  'Potato', 300.00, 'kg', 30.00, 9000.00, 1),
(6,  'Cooking Oil', 180.00, 'litre', 140.00, 25200.00, 1),
(7,  'Dal (Pulses)', 200.00, 'kg', 95.00, 19000.00, 1),
(8,  'Paneer', 90.00, 'kg', 260.00, 23400.00, 1),
(9,  'Milk', 250.00, 'litre', 55.00, 13750.00, 1),
(10, 'Sugar', 120.00, 'kg', 42.00, 5040.00, 1),
(11, 'Tea Leaves', 14.00, 'kg', 320.00, 4480.00, 1), -- Low stock for alert demonstration (< 20)
(12, 'Mixed Spices & Salt', 50.00, 'kg', 180.00, 9000.00, 1),
(13, 'Tomatoes', 120.00, 'kg', 35.00, 4200.00, 1);

SELECT setval('inventory_item_id_seq', (SELECT MAX(item_id) FROM Inventory));

-- ---------------------------------------------------------------------
-- 13. Menu Dishes Catalog
-- ---------------------------------------------------------------------
INSERT INTO Menu_Dishes (dish_id, dish_name, meal_type) VALUES 
(1,  'Poha', 'Breakfast'),
(2,  'Upma', 'Breakfast'),
(3,  'Paratha', 'Breakfast'),
(4,  'Tea', 'Breakfast'),
(5,  'Rice Dal', 'Lunch'),
(6,  'Aloo Sabzi', 'Lunch'),
(7,  'Paneer Curry', 'Lunch'),
(8,  'Roti', 'Lunch'),
(9,  'Khichdi', 'Dinner'),
(10, 'Veg Pulao', 'Dinner'),
(11, 'Chapati', 'Dinner'),
(12, 'Mixed Sabzi', 'Dinner'),
(13, 'Masala Dosa', 'Breakfast'),
(14, 'Rajma Chawal', 'Lunch'),
(15, 'Dal Makhani', 'Dinner');

SELECT setval('menu_dishes_dish_id_seq', (SELECT MAX(dish_id) FROM Menu_Dishes));

-- ---------------------------------------------------------------------
-- 14. Dish Requirements (Recipe Bill-of-Materials)
-- ---------------------------------------------------------------------
INSERT INTO Dish_Requirements (dish_id, item_id, required_qty) VALUES 
(1, 3, 5.00),  -- Poha: Poha Rice 5kg
(1, 4, 2.00),  -- Poha: Onion 2kg
(1, 6, 1.00),  -- Poha: Cooking Oil 1L
(2, 4, 2.00),  -- Upma: Onion 2kg
(2, 6, 1.00),  -- Upma: Cooking Oil 1L
(3, 2, 6.00),  -- Paratha: Wheat Flour 6kg
(3, 5, 3.00),  -- Paratha: Potato 3kg
(3, 6, 1.00),  -- Paratha: Cooking Oil 1L
(4, 9, 10.00), -- Tea: Milk 10L
(4, 10, 2.00), -- Tea: Sugar 2kg
(4, 11, 0.50), -- Tea: Tea Leaves 0.5kg
(5, 1, 8.00),  -- Rice Dal: Rice 8kg
(5, 7, 4.00),  -- Rice Dal: Dal 4kg
(5, 6, 1.00),  -- Rice Dal: Oil 1L
(6, 5, 6.00),  -- Aloo Sabzi: Potato 6kg
(6, 4, 2.00),  -- Aloo Sabzi: Onion 2kg
(6, 6, 1.00),  -- Aloo Sabzi: Oil 1L
(7, 8, 5.00),  -- Paneer Curry: Paneer 5kg
(7, 4, 2.00),  -- Paneer Curry: Onion 2kg
(7, 6, 1.00),  -- Paneer Curry: Oil 1L
(7, 13, 3.00), -- Paneer Curry: Tomatoes 3kg
(8, 2, 8.00),  -- Roti: Wheat Flour 8kg
(9, 1, 6.00),  -- Khichdi: Rice 6kg
(9, 7, 3.00),  -- Khichdi: Dal 3kg
(9, 6, 1.00),  -- Khichdi: Oil 1L
(10, 1, 7.00), -- Veg Pulao: Rice 7kg
(10, 5, 3.00), -- Veg Pulao: Potato 3kg
(10, 4, 2.00), -- Veg Pulao: Onion 2kg
(10, 6, 1.00), -- Veg Pulao: Oil 1L
(11, 2, 7.00), -- Chapati: Wheat Flour 7kg
(12, 5, 4.00), -- Mixed Sabzi: Potato 4kg
(12, 4, 2.00), -- Mixed Sabzi: Onion 2kg
(12, 6, 1.00), -- Mixed Sabzi: Oil 1L
(14, 1, 8.00), -- Rajma Chawal: Rice 8kg
(14, 7, 5.00), -- Rajma Chawal: Dal 5kg
(14, 13, 3.00),-- Rajma Chawal: Tomatoes 3kg
(15, 7, 6.00), -- Dal Makhani: Dal 6kg
(15, 9, 4.00), -- Dal Makhani: Milk 4L
(15, 6, 1.50)  -- Dal Makhani: Oil 1.5L
ON CONFLICT (dish_id, item_id) DO NOTHING;

-- ---------------------------------------------------------------------
-- 15. Weekly Menu Schedule (Monday to Sunday)
-- ---------------------------------------------------------------------
INSERT INTO Weekly_Menu (day_name, meal_type, dish_id) VALUES 
('Monday',    'Breakfast', 1),
('Monday',    'Lunch',     5),
('Monday',    'Dinner',    9),
('Tuesday',   'Breakfast', 2),
('Tuesday',   'Lunch',     6),
('Tuesday',   'Dinner',    10),
('Wednesday', 'Breakfast', 3),
('Wednesday', 'Lunch',     7),
('Wednesday', 'Dinner',    11),
('Thursday',  'Breakfast', 1),
('Thursday',  'Lunch',     14),
('Thursday',  'Dinner',    12),
('Friday',    'Breakfast', 2),
('Friday',    'Lunch',     6),
('Friday',    'Dinner',    15),
('Saturday',  'Breakfast', 3),
('Saturday',  'Lunch',     7),
('Saturday',  'Dinner',    10),
('Sunday',    'Breakfast', 13),
('Sunday',    'Lunch',     5),
('Sunday',    'Dinner',    9);

-- ---------------------------------------------------------------------
-- 16. Meal Log
-- (Triggers check inventory and deduct stock accordingly)
-- ---------------------------------------------------------------------
INSERT INTO Meal_Log (dish_id, served_date, meal_type, remarks) VALUES 
(1,  CURRENT_DATE - INTERVAL '2 days', 'Breakfast', 'Poha served on schedule with tea'),
(5,  CURRENT_DATE - INTERVAL '2 days', 'Lunch',     'Rice Dal lunch service smooth'),
(9,  CURRENT_DATE - INTERVAL '2 days', 'Dinner',    'Hot khichdi dinner served'),
(2,  CURRENT_DATE - INTERVAL '1 day',  'Breakfast', 'Upma served with coconut chutney'),
(6,  CURRENT_DATE - INTERVAL '1 day',  'Lunch',     'Aloo Sabzi with hot rotis'),
(10, CURRENT_DATE - INTERVAL '1 day',  'Dinner',    'Special Veg Pulao night'),
(3,  CURRENT_DATE,                     'Breakfast', 'Fresh aloo paratha breakfast'),
(7,  CURRENT_DATE,                     'Lunch',     'Paneer curry special feast');

-- ---------------------------------------------------------------------
-- 17. Monthly Mess Fees Billing
-- ---------------------------------------------------------------------
INSERT INTO Mess_Fees (bt_no, month, year, amount, payment_date, status) VALUES 
('BT24CSE106', 1, 2025, 3800.00, '2025-01-05', 'Paid'),
('BT24CSE106', 2, 2025, 3800.00, '2025-02-04', 'Paid'),
('BT24CSE106', 3, 2025, 3800.00, NULL,         'Pending'),
('BT24CSE088', 1, 2025, 3800.00, '2025-01-06', 'Paid'),
('BT24CSE088', 2, 2025, 3800.00, '2025-02-05', 'Paid'),
('BT24CSE088', 3, 2025, 3800.00, '2025-03-03', 'Paid'),
('BT24CSE083', 1, 2025, 3800.00, '2025-01-08', 'Paid'),
('BT24CSE083', 2, 2025, 3800.00, '2025-02-10', 'Paid'),
('BT25ECE045', 2, 2025, 3800.00, '2025-02-07', 'Paid'),
('BT25ECE045', 3, 2025, 3800.00, NULL,         'Pending'),
('BT26ME008',  3, 2025, 3800.00, '2025-03-02', 'Paid'),
('BT23IT034',  3, 2025, 3800.00, NULL,         'Pending');

-- ---------------------------------------------------------------------
-- 18. Mess Leaves
-- (Trigger 'mess_leave_insert' populates Mess_Refunds automatically)
-- ---------------------------------------------------------------------
INSERT INTO Mess_Leaves (bt_no, from_date, to_date, days) VALUES 
('BT24CSE106', '2025-02-10', '2025-02-13', 4),
('BT24CSE088', '2025-03-01', '2025-03-05', 5),
('BT24CSE083', '2025-01-15', '2025-01-17', 3),
('BT25ECE045', '2025-02-20', '2025-02-22', 3),
('BT23IT034',  '2025-03-10', '2025-03-15', 6);

-- ---------------------------------------------------------------------
-- 19. Mess Operational Expenses (Vibrant trends for vw_monthly_cost_trends)
-- ---------------------------------------------------------------------
INSERT INTO Mess_Expenses (type, amount, expense_date, remarks) VALUES 
('Vegetables',            14500.00, '2025-01-10', 'January fresh vegetable supplies'),
('Dairy & Milk',          16800.00, '2025-01-15', 'Monthly milk, curd and paneer billing'),
('Groceries & Grains',    28500.00, '2025-01-20', 'Rice, wheat flour, and pulses wholesale procurement'),
('Gas / LPG Cylinders',    9200.00, '2025-01-25', 'Commercial cylinder refills (4 units)'),
('Vegetables',            15200.00, '2025-02-10', 'February fresh produce orders'),
('Dairy & Milk',          17500.00, '2025-02-15', 'Dairy deliveries for February'),
('Groceries & Grains',    26000.00, '2025-02-20', 'Pantry staples restocking'),
('Gas / LPG Cylinders',    9200.00, '2025-02-26', 'Commercial LPG supply (4 units)'),
('Kitchen Maintenance',    4500.00, '2025-02-28', 'Burner repair and chimney filter servicing'),
('Vegetables',            16000.00, '2025-03-10', 'March fresh vegetable bulk order'),
('Dairy & Milk',          18200.00, '2025-03-15', 'March dairy supply invoice'),
('Groceries & Grains',    29000.00, '2025-03-20', 'Grain and cooking oil shipment');

-- ---------------------------------------------------------------------
-- 20. Purchase Orders & Line Items
-- ---------------------------------------------------------------------
INSERT INTO Purchase_Orders (po_id, vendor_id, order_date, status) VALUES 
(1, 1, '2025-02-05', 'Completed'),
(2, 2, '2025-02-10', 'Completed'),
(3, 3, '2025-02-15', 'Completed'),
(4, 1, '2025-03-01', 'Completed'),
(5, 5, '2025-03-08', 'Pending');

SELECT setval('purchase_orders_po_id_seq', (SELECT MAX(po_id) FROM Purchase_Orders));

INSERT INTO Purchase_Items (po_id, item_id, qty, price) VALUES 
(1, 4, 100.00, 25.00),   -- PO 1: Onion 100kg
(1, 5, 120.00, 30.00),   -- PO 1: Potato 120kg
(2, 9, 200.00, 55.00),   -- PO 2: Milk 200L
(2, 8, 50.00,  260.00),  -- PO 2: Paneer 50kg
(3, 1, 300.00, 45.00),   -- PO 3: Rice 300kg
(3, 7, 100.00, 95.00),   -- PO 3: Dal 100kg
(4, 4, 80.00,  26.00),   -- PO 4: Onion 80kg
(4, 13, 60.00, 35.00),   -- PO 4: Tomatoes 60kg
(5, 6, 100.00, 140.00);  -- PO 5: Cooking Oil 100L

-- ---------------------------------------------------------------------
-- 21. Pantry Scrap & Waste Log (Feeds vw_top_waste_items)
-- ---------------------------------------------------------------------
INSERT INTO Waste_Log (item_id, qty, waste_date, reason) VALUES 
(4,  12.50, '2025-02-05', 'Peeling scrap and moisture spoilage'),
(5,  18.00, '2025-02-12', 'Rotten pieces during initial sorting'),
(9,  8.00,  '2025-02-20', 'Curdled during temporary refrigerator power outage'),
(13, 14.00, '2025-03-02', 'Overripe during transit'),
(1,  6.00,  '2025-03-05', 'Plate waste from dinner service'),
(2,  5.00,  '2025-03-08', 'Dough batch left over overnight');

-- ---------------------------------------------------------------------
-- 22. Student Mess Feedback (Feeds vw_feedback_average)
-- ---------------------------------------------------------------------
INSERT INTO Mess_Feedback (bt_no, dish_id, rating, comment_text, feedback_date) VALUES 
('BT24CSE106', 7,  5, 'Paneer Curry was rich, flavorful and soft!', '2025-02-12'),
('BT24CSE088', 1,  4, 'Poha was light and tasty, lemon slice was a nice touch.', '2025-02-14'),
('BT24CSE083', 5,  4, 'Rice and Dal tadka had great home-cooked flavor.', '2025-02-15'),
('BT24CSE082', 3,  5, 'Paratha with butter was fantastic on Sunday breakfast.', '2025-02-16'),
('BT25ECE045', 10, 4, 'Veg Pulao aroma was wonderful with fresh veggies.', '2025-02-22'),
('BT26ME008',  9,  3, 'Khichdi was wholesome but could use a bit more salt.', '2025-02-25'),
('BT23IT034',  7,  5, 'Best paneer dish this semester! Perfectly cooked.', '2025-03-02'),
('BT24ECE091', 14, 5, 'Rajma Chawal combo was outstanding.', '2025-03-05');

-- ---------------------------------------------------------------------
-- 23. System Alerts
-- ---------------------------------------------------------------------
INSERT INTO Alerts (alert_type, message_text, created_at, is_resolved) VALUES 
('Low Stock', 'Tea Leaves is below threshold (14.00 kg remaining)', '2025-03-01 08:00:00', 'No'),
('Maintenance', 'Kitchen chimney cleaning due for scheduled quarterly service', '2025-03-02 09:30:00', 'No'),
('Hygiene', 'Mess dining hall pest control routine completed', '2025-02-28 17:00:00', 'Yes'),
('Payment Reminder', 'March Mess Dues reminder dispatched to unassigned students', '2025-03-05 10:00:00', 'Yes');

-- ---------------------------------------------------------------------
-- 24. Sports Facility Catalog
-- (total_cost is generated automatically as total_quantity * cost_per_item)
-- ---------------------------------------------------------------------
INSERT INTO Sports_Items (item_id, item_name, total_quantity, available_quantity, fine_per_day, cost_per_item) VALUES 
(1, 'Cricket Bat',         12, 10, 20.00, 2500.00),
(2, 'Football',            10, 8,  15.00, 1200.00),
(3, 'Badminton Racket',    16, 14, 10.00, 900.00),
(4, 'Volleyball',          8,  6,  15.00, 1000.00),
(5, 'Table Tennis Paddle', 12, 10, 10.00, 700.00),
(6, 'Basketball',          6,  5,  15.00, 1400.00),
(7, 'Carrom Board & Coins',4,  3,  25.00, 3200.00),
(8, 'Chess Board & Pieces',6,  6,  10.00, 800.00)
ON CONFLICT (item_id) DO UPDATE SET 
    item_name = EXCLUDED.item_name,
    total_quantity = EXCLUDED.total_quantity,
    available_quantity = EXCLUDED.available_quantity,
    fine_per_day = EXCLUDED.fine_per_day,
    cost_per_item = EXCLUDED.cost_per_item;

SELECT setval('sports_items_item_id_seq', (SELECT MAX(item_id) FROM Sports_Items));

-- ---------------------------------------------------------------------
-- 25. Sports Equipment Issues & Returns
-- (Trigger 'sports_check_stock' and 'sports_reduce_stock' handle inventory)
-- ---------------------------------------------------------------------
INSERT INTO Sports_Issues (issue_id, bt_no, item_id, quantity, issue_date, due_date, return_date, status) VALUES 
(1, 'BT24CSE106', 1, 1, '2025-02-01', '2025-02-03', '2025-02-05', 'Returned'), -- 2 days late
(2, 'BT24CSE088', 2, 1, '2025-02-10', '2025-02-12', '2025-02-12', 'Returned'), -- on time
(3, 'BT24CSE083', 3, 2, '2025-02-15', '2025-02-18', '2025-02-21', 'Returned'), -- 3 days late
(4, 'BT24CSE082', 5, 2, '2025-03-01', '2025-03-03', '2025-03-03', 'Returned'), -- on time
(5, 'BT25ECE045', 4, 1, '2025-03-08', '2025-03-10', NULL,         'Issued'),
(6, 'BT26ME008',  6, 1, '2025-03-09', '2025-03-12', NULL,         'Issued'),
(7, 'BT23IT034',  7, 1, '2025-03-10', '2025-03-13', NULL,         'Issued');

SELECT setval('sports_issues_issue_id_seq', (SELECT MAX(issue_id) FROM Sports_Issues));

-- ---------------------------------------------------------------------
-- 26. Sports Fines (Late return penalties)
-- ---------------------------------------------------------------------
INSERT INTO Sports_Fines (issue_id, bt_no, fine_amount, created_date) VALUES 
(1, 'BT24CSE106', 40.00, '2025-02-05'), -- 2 days * 20.00
(3, 'BT24CSE083', 30.00, '2025-02-21')  -- 3 days * 10.00
ON CONFLICT (issue_id) DO NOTHING;

COMMIT;

-- =====================================================================
-- Verification Summary
-- =====================================================================
SELECT 'Students' AS table_name, COUNT(*) AS row_count FROM Students
UNION ALL SELECT 'Rooms', COUNT(*) FROM Rooms
UNION ALL SELECT 'Room_Allocations', COUNT(*) FROM Room_Allocations
UNION ALL SELECT 'Room_Occupancy', COUNT(*) FROM Room_Occupancy
UNION ALL SELECT 'Allocation_History', COUNT(*) FROM Allocation_History
UNION ALL SELECT 'Leave_Log', COUNT(*) FROM Leave_Log
UNION ALL SELECT 'Leave_Summary', COUNT(*) FROM Leave_Summary
UNION ALL SELECT 'Refunds', COUNT(*) FROM Refunds
UNION ALL SELECT 'Complaints', COUNT(*) FROM Complaints
UNION ALL SELECT 'Visitors', COUNT(*) FROM Visitors
UNION ALL SELECT 'Payments', COUNT(*) FROM Payments
UNION ALL SELECT 'Staff_Roles', COUNT(*) FROM Staff_Roles
UNION ALL SELECT 'Mess_Staff', COUNT(*) FROM Mess_Staff
UNION ALL SELECT 'Vendors', COUNT(*) FROM Vendors
UNION ALL SELECT 'Inventory', COUNT(*) FROM Inventory
UNION ALL SELECT 'Menu_Dishes', COUNT(*) FROM Menu_Dishes
UNION ALL SELECT 'Dish_Requirements', COUNT(*) FROM Dish_Requirements
UNION ALL SELECT 'Weekly_Menu', COUNT(*) FROM Weekly_Menu
UNION ALL SELECT 'Meal_Log', COUNT(*) FROM Meal_Log
UNION ALL SELECT 'Mess_Fees', COUNT(*) FROM Mess_Fees
UNION ALL SELECT 'Mess_Leaves', COUNT(*) FROM Mess_Leaves
UNION ALL SELECT 'Mess_Refunds', COUNT(*) FROM Mess_Refunds
UNION ALL SELECT 'Mess_Expenses', COUNT(*) FROM Mess_Expenses
UNION ALL SELECT 'Purchase_Orders', COUNT(*) FROM Purchase_Orders
UNION ALL SELECT 'Purchase_Items', COUNT(*) FROM Purchase_Items
UNION ALL SELECT 'Waste_Log', COUNT(*) FROM Waste_Log
UNION ALL SELECT 'Mess_Feedback', COUNT(*) FROM Mess_Feedback
UNION ALL SELECT 'Alerts', COUNT(*) FROM Alerts
UNION ALL SELECT 'Sports_Items', COUNT(*) FROM Sports_Items
UNION ALL SELECT 'Sports_Issues', COUNT(*) FROM Sports_Issues
UNION ALL SELECT 'Sports_Fines', COUNT(*) FROM Sports_Fines
ORDER BY table_name;
