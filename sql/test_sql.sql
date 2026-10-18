INSERT INTO Students (bt_no, name, year, phone, email, branch) VALUES
('BT24CSE088', 'Harshal Mestri', 2024, '9820011001', 'harshal.mestri@gmail.com', 'CSE'),
('BT24CSE106', 'Bhoumik Jain',   2024, '9820011002', 'bhoumik.jain@gmail.com',   'CSE'),
('BT24CSE083', 'Sahil Padole',    2024, '9820011003', 'sahil.padole@gmail.com',   'CSE'),
('BT24CSE082', 'Tarush Varma',   2024, '9820011004', 'tarush.varma@gmail.com',   'CSE');

INSERT INTO Rooms (room_no, max_capacity, floor_no, room_type) VALUES
(101, 3, 1, 'Triple'),
(102, 2, 1, 'Double'),
(201, 4, 2, 'Dormitory'),
(202, 2, 2, 'Double')
ON CONFLICT (room_no) DO NOTHING;

INSERT INTO Room_Allocations (bt_no, room_no, allocation_date) VALUES
('BT24CSE088', 101, '2025-01-10'),
('BT24CSE106', 101, '2025-01-10'),
('BT24CSE083', 101, '2025-01-10'),
('BT24CSE082', 102, '2025-01-11');

INSERT INTO Leave_Log (bt_no, from_date, to_date, days) VALUES
('BT24CSE088', '2025-03-01', '2025-03-05', 4),
('BT24CSE106', '2025-02-10', '2025-02-12', 2),
('BT24CSE083', '2025-01-20', '2025-01-25', 5);

INSERT INTO Complaints (bt_no, room_no, issue_type, description, status) VALUES
('BT24CSE088', 101, 'Fan Issue', 'Ceiling fan making clicking sound', 'Pending'),
('BT24CSE106', 101, 'Light Issue', 'Study tube light fused', 'Resolved'),
('BT24CSE082', 102, 'Water Problem', 'Low water pressure in shower', 'In Progress');

INSERT INTO Payments (bt_no, amount, payment_date, status) VALUES
('BT24CSE088', 50000, '2025-01-01', 'Paid'),
('BT24CSE106', 50000, '2025-01-02', 'Paid'),
('BT24CSE083', 50000, '2025-01-03', 'Paid'),
('BT24CSE082', 45000, '2025-01-04', 'Pending');

SELECT * FROM Room_Occupancy;
SELECT * FROM Leave_Summary;
SELECT * FROM Refunds;
