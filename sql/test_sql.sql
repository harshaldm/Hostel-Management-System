INSERT INTO Students (bt_no, name, year, phone, email, branch) VALUES
('BT24ECI001', 'Jayesh Thakare', 2024, '8446374356', 'jayesh1@gmail.com', 'ECI'),
('BT24CSE002', 'Aman Sharma', 2024, '9123456780', 'aman@gmail.com', 'CSE'),
('BT23ME003', 'Rohan Patil', 2023, '9988776655', 'rohan@gmail.com', 'ME'),
('BT22ECE004', 'Sneha Iyer', 2022, '9876543210', 'sneha@gmail.com', 'ECE'),
('BT24IT005', 'Priya Deshmukh', 2024, '9011223344', 'priya@gmail.com', 'IT');

INSERT INTO Rooms (room_no, max_capacity, floor_no, room_type) VALUES
(101, 3, 1, 'Triple'),
(102, 2, 1, 'Double'),
(201, 4, 2, 'Dormitory'),
(202, 2, 2, 'Double');

INSERT INTO Room_Allocations (bt_no, room_no, allocation_date) VALUES
('BT24ECI001', 101, '2025-01-10'),
('BT24CSE002', 101, '2025-01-11'),
('BT23ME003', 102, '2025-01-12'),
('BT22ECE004', 201, '2025-01-13'),
('BT24IT005', 201, '2025-01-14');

INSERT INTO Leave_Log (bt_no, from_date, to_date, days) VALUES
('BT24ECI001', '2025-03-01', '2025-03-05', 4),
('BT24CSE002', '2025-02-10', '2025-02-12', 2),
('BT23ME003', '2025-01-20', '2025-01-25', 5),
('BT22ECE004', '2025-04-01', '2025-04-03', 2);

INSERT INTO Complaints (bt_no, room_no, issue_type, description, status) VALUES
('BT24ECI001', 101, 'Fan Issue', 'Fan not working properly', 'Pending'),
('BT24CSE002', 101, 'Light Issue', 'Tube light fused', 'Resolved'),
('BT23ME003', 102, 'Water Problem', 'No hot water in bathroom', 'In Progress');

INSERT INTO Payments (bt_no, amount, payment_date, status) VALUES
('BT24ECI001', 50000, '2025-01-01', 'Paid'),
('BT24CSE002', 50000, '2025-01-02', 'Paid'),
('BT23ME003', 45000, '2025-01-03', 'Pending'),
('BT22ECE004', 50000, '2025-01-04', 'Paid');

INSERT INTO Visitors (student_bt_no, visitor_name, visit_date, in_time, out_time, purpose) VALUES
('BT24ECI001', 'Mr. Thakare', '2025-03-02', '10:00:00', '12:00:00', 'Family Visit'),
('BT24CSE002', 'Mrs. Sharma', '2025-02-11', '14:00:00', '16:00:00', 'Parent Visit'),
('BT23ME003', 'Friend', '2025-01-22', '18:00:00', '20:00:00', 'Meetup');

INSERT INTO Allocation_History (bt_no, old_room, new_room, from_date, to_date) VALUES
('BT24ECI001', 102, 101, '2025-01-01', '2025-01-10'),
('BT24CSE002', 201, 101, '2025-01-05', '2025-01-11');

SELECT * FROM Room_Occupancy;
SELECT * FROM Leave_Summary;
SELECT * FROM Refunds;
