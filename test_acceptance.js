// Acceptance Test Runner for Hostel & Mess Leaves/Refunds
const db = require('./config/database');

async function runTests() {
  console.log('========================================================');
  console.log('RUNNING ACCEPTANCE TESTS');
  console.log('========================================================\n');

  const studentA = 'BT26CSA001'; // Aditya More
  const studentB = 'BT26CSD001'; // Siddharth Mehta

  // Clean test students' leaves first if any
  await db.query('DELETE FROM Leave_Log WHERE bt_no IN (?, ?)', [studentA, studentB]);
  await db.query('DELETE FROM Mess_Leaves WHERE bt_no IN (?, ?)', [studentA, studentB]);
  await db.query('DELETE FROM Mess_Refunds WHERE bt_no IN (?, ?)', [studentA, studentB]);
  await db.query('DELETE FROM Refunds WHERE bt_no IN (?, ?)', [studentA, studentB]);
  await db.query('DELETE FROM Leave_Summary WHERE bt_no IN (?, ?)', [studentA, studentB]);

  // -------------------------------------------------------------------
  // Acceptance Test 1
  // Student A mess leave 2026-10-19 -> 2026-10-24
  // Expected: 1 Mess_Leaves row (6 days), Mess_Refunds A = 6 days, Rs 600
  // -------------------------------------------------------------------
  console.log('--- TEST 1: Student A mess leave 2026-10-19 -> 2026-10-24 ---');
  await db.query('INSERT INTO Mess_Leaves (bt_no, from_date, to_date) VALUES (?, ?, ?)',
    [studentA, '2026-10-19', '2026-10-24']);

  const [t1Leaves] = await db.query('SELECT * FROM Mess_Leaves WHERE bt_no = ?', [studentA]);
  const [t1Refunds] = await db.query('SELECT * FROM Mess_Refunds WHERE bt_no = ?', [studentA]);

  console.log('Mess_Leaves rows count:', t1Leaves.length, '| days in row:', t1Leaves[0]?.days);
  console.log('Mess_Refunds row:', {
    bt_no: t1Refunds[0]?.bt_no,
    total_days: t1Refunds[0]?.total_days,
    refund_amount: Number(t1Refunds[0]?.refund_amount),
  });

  const t1Pass = t1Leaves.length === 1 &&
                 Number(t1Leaves[0]?.days) === 6 &&
                 Number(t1Refunds[0]?.total_days) === 6 &&
                 Number(t1Refunds[0]?.refund_amount) === 600;
  console.log('TEST 1 RESULT:', t1Pass ? 'PASSED ✓' : 'FAILED ✗', '\n');

  // -------------------------------------------------------------------
  // Acceptance Test 2
  // Student B hostel leave 2026-10-20 -> 2026-10-22
  // Expected: Leave_Log row, auto Mess_Leaves row, Mess_Refunds B = 3 days, Rs 300, hostel Refunds B = 3 days, Rs 300
  // -------------------------------------------------------------------
  console.log('--- TEST 2: Student B hostel leave 2026-10-20 -> 2026-10-22 ---');
  await db.query('INSERT INTO Leave_Log (bt_no, from_date, to_date) VALUES (?, ?, ?)',
    [studentB, '2026-10-20', '2026-10-22']);

  const [t2Hostel] = await db.query('SELECT * FROM Leave_Log WHERE bt_no = ?', [studentB]);
  const [t2Mess] = await db.query('SELECT * FROM Mess_Leaves WHERE bt_no = ?', [studentB]);
  const [t2MessRefund] = await db.query('SELECT * FROM Mess_Refunds WHERE bt_no = ?', [studentB]);
  const [t2HostelRefund] = await db.query('SELECT * FROM Refunds WHERE bt_no = ?', [studentB]);

  console.log('Leave_Log row count:', t2Hostel.length, '| days:', t2Hostel[0]?.days);
  console.log('Auto Mess_Leaves row count:', t2Mess.length, '| days:', t2Mess[0]?.days);
  console.log('Mess_Refunds B:', {
    bt_no: t2MessRefund[0]?.bt_no,
    total_days: t2MessRefund[0]?.total_days,
    refund_amount: Number(t2MessRefund[0]?.refund_amount),
  });
  console.log('Hostel Refunds B:', {
    bt_no: t2HostelRefund[0]?.bt_no,
    refund_amount: Number(t2HostelRefund[0]?.refund_amount),
  });

  const t2Pass = t2Hostel.length === 1 &&
                 Number(t2Hostel[0]?.days) === 3 &&
                 t2Mess.length === 1 &&
                 Number(t2Mess[0]?.days) === 3 &&
                 Number(t2MessRefund[0]?.total_days) === 3 &&
                 Number(t2MessRefund[0]?.refund_amount) === 300 &&
                 Number(t2HostelRefund[0]?.refund_amount) === 300;
  console.log('TEST 2 RESULT:', t2Pass ? 'PASSED ✓' : 'FAILED ✗', '\n');

  // -------------------------------------------------------------------
  // Acceptance Test 3
  // Student A then hostel leave 2026-10-22 -> 2026-10-26 (overlaps)
  // Expected: Mess_Refunds A = 8 distinct days, Rs 800 (not 11)
  // -------------------------------------------------------------------
  console.log('--- TEST 3: Student A then hostel leave 2026-10-22 -> 2026-10-26 (overlaps) ---');
  await db.query('INSERT INTO Leave_Log (bt_no, from_date, to_date) VALUES (?, ?, ?)',
    [studentA, '2026-10-22', '2026-10-26']);

  const [t3MessLeaves] = await db.query('SELECT * FROM Mess_Leaves WHERE bt_no = ? ORDER BY from_date', [studentA]);
  const [t3MessRefund] = await db.query('SELECT * FROM Mess_Refunds WHERE bt_no = ?', [studentA]);

  console.log('Student A Mess_Leaves entries count:', t3MessLeaves.length);
  t3MessLeaves.forEach((r, idx) => {
    console.log(`  Entry ${idx + 1}: ${r.from_date} to ${r.to_date} (${r.days} days)`);
  });
  console.log('Student A Mess_Refunds:', {
    bt_no: t3MessRefund[0]?.bt_no,
    total_days: t3MessRefund[0]?.total_days,
    refund_amount: Number(t3MessRefund[0]?.refund_amount),
  });

  const t3Pass = Number(t3MessRefund[0]?.total_days) === 8 &&
                 Number(t3MessRefund[0]?.refund_amount) === 800;
  console.log('TEST 3 RESULT:', t3Pass ? 'PASSED ✓ (Distinct 8 days, NOT 11)' : 'FAILED ✗', '\n');

  // -------------------------------------------------------------------
  // Acceptance Test 4
  // On 2026-10-19, admin Hostel "Leave" page shows only A and B. September leaves are hidden.
  // -------------------------------------------------------------------
  console.log('--- TEST 4: Admin Hostel "Leave" page query on 2026-10-19 ---');
  const [t4Leaves] = await db.query(`
    SELECT l.*, s.name FROM Leave_Log l 
    JOIN Students s ON l.bt_no = s.bt_no 
    WHERE (
        (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::DATE BETWEEN l.from_date AND l.to_date
        OR l.to_date >= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::DATE
    )
    ORDER BY l.from_date DESC, l.leave_id DESC
  `);

  console.log('Hostel Leave page rows returned:', t4Leaves.length);
  const studentsOnPage = t4Leaves.map(r => `${r.bt_no} (${r.name}): ${r.from_date} -> ${r.to_date}`);
  console.log('Students returned:', studentsOnPage);

  const hasOnlyAandB = t4Leaves.length === 2 &&
                       t4Leaves.some(r => r.bt_no === studentA) &&
                       t4Leaves.some(r => r.bt_no === studentB);
  const septemberLeavesHidden = !t4Leaves.some(r => String(r.to_date).includes('2026-09') || String(r.from_date).includes('2026-09'));

  console.log('Shows only A and B:', hasOnlyAandB);
  console.log('September leaves hidden:', septemberLeavesHidden);
  const t4Pass = hasOnlyAandB && septemberLeavesHidden;
  console.log('TEST 4 RESULT:', t4Pass ? 'PASSED ✓' : 'FAILED ✗', '\n');

  // -------------------------------------------------------------------
  // Acceptance Test 5
  // Admin Mess "Leaves & Refunds" shows both tables with the rows above.
  // -------------------------------------------------------------------
  console.log('--- TEST 5: Admin Mess "Leaves & Refunds" page query ---');
  const [t5LeaveRecords] = await db.query(`
    SELECT l.*, s.name 
    FROM Mess_Leaves l 
    JOIN Students s ON l.bt_no = s.bt_no 
    WHERE l.bt_no IN (?, ?)
    ORDER BY l.from_date DESC, l.leave_id DESC
  `, [studentA, studentB]);

  const [t5RefundSummary] = await db.query(`
    SELECT r.refund_id, r.bt_no, s.name, r.total_days, r.refund_amount, r.last_updated
    FROM Mess_Refunds r
    JOIN Students s ON r.bt_no = s.bt_no
    WHERE r.bt_no IN (?, ?)
    ORDER BY r.last_updated DESC, r.bt_no
  `, [studentA, studentB]);

  console.log('Mess Leave Records count for A & B:', t5LeaveRecords.length);
  t5LeaveRecords.forEach(r => console.log(`  Leave: ${r.bt_no} (${r.name}) ${r.from_date} -> ${r.to_date} (${r.days} days)`));
  console.log('Mess Refund Summary for A & B:', t5RefundSummary.length);
  t5RefundSummary.forEach(r => console.log(`  Refund: ${r.bt_no} (${r.name}): ${r.total_days} days, Rs ${r.refund_amount}`));

  const t5Pass = t5LeaveRecords.length === 3 && // A has 2 leaves, B has 1 leaf
                 t5RefundSummary.length === 2 &&
                 t5RefundSummary.find(r => r.bt_no === studentA)?.total_days === 8 &&
                 t5RefundSummary.find(r => r.bt_no === studentB)?.total_days === 3;
  console.log('TEST 5 RESULT:', t5Pass ? 'PASSED ✓' : 'FAILED ✗', '\n');

  // -------------------------------------------------------------------
  // Acceptance Test 6
  // A date entered as 19/10/2026 displays as 19/10/2026 on every page
  // -------------------------------------------------------------------
  console.log('--- TEST 6: Date formatting display without timezone shift ---');
  const [dateCheck] = await db.query("SELECT from_date, to_date FROM Leave_Log WHERE bt_no = ? AND from_date = '2026-10-22'", [studentA]);
  const rawDateStr = t1Leaves[0]?.from_date; // '2026-10-19'
  console.log('Database returned DATE column type:', typeof rawDateStr, '| value:', rawDateStr);

  // Test our formatter function
  function formatDate(d) {
    if (!d) return '-';
    if (typeof d === 'string') {
      const match = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) return `${parseInt(match[3], 10)}/${parseInt(match[2], 10)}/${match[1]}`;
    }
    const dt = new Date(d);
    return `${dt.getDate()}/${dt.getMonth() + 1}/${dt.getFullYear()}`;
  }

  const formattedDisplay = formatDate(rawDateStr);
  console.log("Formatted output for '2026-10-19':", formattedDisplay);
  const t6Pass = typeof rawDateStr === 'string' &&
                 rawDateStr.startsWith('2026-10-19') &&
                 formattedDisplay === '19/10/2026';
  console.log('TEST 6 RESULT:', t6Pass ? 'PASSED ✓ (Displays as 19/10/2026)' : 'FAILED ✗', '\n');

  console.log('========================================================');
  const allPass = t1Pass && t2Pass && t3Pass && t4Pass && t5Pass && t6Pass;
  console.log('ALL 6 ACCEPTANCE TESTS:', allPass ? 'ALL PASSED ✓✓✓' : 'SOME TESTS FAILED');
  console.log('========================================================');

  process.exit(allPass ? 0 : 1);
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
