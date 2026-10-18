/* ===================================================================
   Hostel Management System - Mock Data Seeder (PostgreSQL + Node.js)

   node seed.js --reset   wipe all tables, then seed fresh data
   node seed.js           seed only if the students table is empty
   node seed.js --dry     generate + sanity-check data, NO database

   Needs: npm i pg dotenv   (DB credentials come from your .env)

   Triggers do the rest. This file does NOT insert into tables that
   your triggers fill automatically:
     Room_Occupancy, Leave_Summary, Refunds, Sports_Fines
   =================================================================== */
try { require('dotenv').config(); } catch (_) { /* dotenv is optional */ }

/* ───────────── 1. CONFIG (edit here) ───────────── */
const BRANCHES = ['CSA', 'CSD', 'CSE', 'CSH', 'ECI', 'ECE'];
const ADMISSION_PREFIX = { 1: 'BT26', 2: 'BT25', 3: 'BT24', 4: 'BT23' }; // roll-no prefix per year
const BOYS_PER_YEAR = 90;   // each boys floor has 100 beds
const GIRLS_PER_YEAR = 22;  // girls floor: 100 beds shared by all 4 years (22 x 4 = 88)
const TODAY = '2026-10-18';

// Floor 1 = girls (all years). Floors 2-5 = boys, one floor per year.
const FLOORS = [
  { floor: 1, gender: 'F', year: null },
  { floor: 2, gender: 'M', year: 1 },
  { floor: 3, gender: 'M', year: 2 },
  { floor: 4, gender: 'M', year: 3 },
  { floor: 5, gender: 'M', year: 4 },
];
// 50 rooms per floor: 1-10 Single, 11-40 Double, 41-50 Triple
const ROOM_TYPES = [
  { type: 'Single', cap: 1, count: 10 },
  { type: 'Double', cap: 2, count: 30 },
  { type: 'Triple', cap: 3, count: 10 },
];
const HOSTEL_FEE = { Single: 45000, Double: 36000, Triple: 30000 }; // per semester
const MESS_FEE_PER_MONTH = 4500;
const REFUND_PER_DAY = 100;

const STATUS = {
  PAID: 'Paid', PENDING: 'Pending',
  OPEN: 'Pending', PROGRESS: 'In Progress', DONE: 'Resolved', // complaints
  ISSUED: 'Issued', RETURNED: 'Returned',                      // sports_issues
};

/* ───────────── 2. HELPERS ───────────── */
function mulberry32(a) { // seeded RNG: same data every run
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(2026);
const int = (a, b) => a + Math.floor(rand() * (b - a + 1));
const pick = arr => arr[Math.floor(rand() * arr.length)];
const chance = p => rand() < p;
const shuffle = arr => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};
const only = (o, keys) => Object.fromEntries(keys.map(k => [k, o[k]]));

const DAY = 864e5;
const D = s => new Date(s + 'T00:00:00Z');
const iso = d => d.toISOString().slice(0, 10);
const ts = d => d.toISOString().slice(0, 19).replace('T', ' ');
const addDays = (d, n) => new Date(d.getTime() + n * DAY);
const between = (a, b) => addDays(D(a), int(0, Math.round((D(b) - D(a)) / DAY)));
const hhmm = m => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}:00`;
const NOW = new Date(TODAY + 'T12:00:00Z');

/* ───────────── 3. STATIC DATA ───────────── */
const MALE = ['Aarav','Vivaan','Aditya','Arjun','Reyansh','Krishna','Ishaan','Rohan','Karan','Rahul','Siddharth','Harsh','Yash','Pranav','Nikhil','Aman','Ankit','Tejas','Om','Shubham','Atharva','Kunal','Mohit','Varun','Dhruv','Sahil','Parth','Gaurav','Abhishek','Vedant','Devansh','Manav','Chirag','Rishabh','Utkarsh','Piyush','Saurabh','Naman','Kartik','Sarthak','Ayush','Lakshya','Prathamesh','Omkar','Swapnil','Tushar','Vaibhav','Hardik','Jay','Mayank'];
const FEMALE = ['Ananya','Diya','Isha','Kavya','Meera','Neha','Priya','Riya','Saanvi','Sneha','Tanvi','Aditi','Pooja','Shruti','Nisha','Simran','Aishwarya','Bhavya','Divya','Kritika','Mansi','Nidhi','Payal','Rutuja','Sakshi','Tanisha','Vaishnavi','Yashika','Zoya','Harshita','Khushi','Palak','Swara','Trisha','Anushka'];
const LAST = ['Sharma','Verma','Patil','Deshmukh','Jain','Gupta','Agarwal','Singh','Kulkarni','Joshi','Mehta','Shah','Reddy','Nair','Iyer','Pandey','Mishra','Yadav','Chauhan','Rathod','Bhosale','Pawar','Jadhav','Kale','More','Wagh','Thakur','Tiwari','Dubey','Saxena','Bansal','Goyal','Kapoor','Malhotra','Chopra','Banerjee','Das','Roy','Naik','Gaikwad','Shinde','Chavan','Khandelwal','Maheshwari','Soni'];
const PARENT_FIRST = ['Rajesh','Sunita','Anil','Meena','Suresh','Kavita','Mahesh','Anjali','Vinod','Rekha'];

const ISSUES = {
  Electrical: ['Ceiling fan not working', 'Tube light flickering', 'Power socket sparking near bed', 'Switchboard loose'],
  Plumbing: ['Washbasin tap leaking', 'Flush not working in bathroom', 'Low water pressure', 'Drain blocked'],
  Furniture: ['Cupboard door broken', 'Study table wobbling', 'Bed frame creaking', 'Chair damaged'],
  Cleaning: ['Room not cleaned for 3 days', 'Corridor dustbin overflowing', 'Bathroom needs deep cleaning'],
  Internet: ['Wi-Fi signal very weak in room', 'LAN port not working', 'Frequent disconnections at night'],
  'Pest Control': ['Cockroaches in room', 'Mosquitoes near window', 'Ants near study table'],
};
const PURPOSES = ['Parents Visit', 'Family Visit', 'Friend Visit', 'Document Delivery', 'Guardian Meeting'];

const VENDORS = [
  { vendor_name: 'Shree Ganesh Grain Traders', item_speciality: 'Grains & Pulses', phone: '9822011101' },
  { vendor_name: 'Nagpur Fresh Vegetables', item_speciality: 'Fresh Vegetables & Greens', phone: '9822011102' },
  { vendor_name: 'Sai Dairy Products', item_speciality: 'Milk, Curd & Paneer', phone: '9822011103' },
  { vendor_name: 'Orange City Poultry', item_speciality: 'Eggs & Poultry', phone: '9822011104' },
  { vendor_name: 'Balaji Provisions', item_speciality: 'General Provisions & Groceries', phone: '9822011105' },
  { vendor_name: 'Vidarbha Oil & Spices', item_speciality: 'Cooking Oil & Spices', phone: '9822011106' },
];

const DISHES = [
  ['Poha','Breakfast'], ['Idli Sambar','Breakfast'], ['Aloo Paratha','Breakfast'], ['Upma','Breakfast'],
  ['Masala Dosa','Breakfast'], ['Bread Omelette','Breakfast'], ['Puri Bhaji','Breakfast'],
  ['Dal Tadka','Lunch'], ['Rajma Masala','Lunch'], ['Chole Masala','Lunch'], ['Paneer Butter Masala','Lunch'],
  ['Mixed Veg Curry','Lunch'], ['Aloo Gobi','Lunch'], ['Kadhi Pakora','Lunch'], ['Jeera Rice','Lunch'], ['Phulka Roti','Lunch'],
  ['Samosa','Snacks'], ['Tea & Biscuits','Snacks'], ['Bread Pakoda','Snacks'], ['Veg Sandwich','Snacks'], ['Maggi Noodles','Snacks'],
  ['Dal Fry','Dinner'], ['Egg Curry','Dinner'], ['Chicken Curry','Dinner'], ['Veg Biryani','Dinner'], ['Palak Paneer','Dinner'],
  ['Dal Khichdi','Dinner'], ['Chapati','Dinner'],
];

const MENU = {
  Monday:    { Breakfast: ['Poha'],         Lunch: ['Dal Tadka', 'Jeera Rice'],            Dinner: ['Egg Curry', 'Chapati'] },
  Tuesday:   { Breakfast: ['Idli Sambar'],  Lunch: ['Rajma Masala', 'Jeera Rice'],         Dinner: ['Dal Fry', 'Chapati'] },
  Wednesday: { Breakfast: ['Aloo Paratha'], Lunch: ['Paneer Butter Masala', 'Phulka Roti'], Dinner: ['Veg Biryani', 'Dal Fry'] },
  Thursday:  { Breakfast: ['Upma'],         Lunch: ['Chole Masala', 'Phulka Roti'],        Dinner: ['Chicken Curry', 'Chapati'] },
  Friday:    { Breakfast: ['Masala Dosa'],  Lunch: ['Mixed Veg Curry', 'Jeera Rice'],      Dinner: ['Palak Paneer', 'Chapati'] },
  Saturday:  { Breakfast: ['Puri Bhaji'],   Lunch: ['Kadhi Pakora', 'Jeera Rice'],         Dinner: ['Dal Khichdi', 'Egg Curry'] },
  Sunday:    { Breakfast: ['Bread Omelette'], Lunch: ['Aloo Gobi', 'Phulka Roti'],         Dinner: ['Veg Biryani', 'Chicken Curry'] },
};

const ROLES = [['Mess Manager', 35000, 1], ['Head Cook', 28000, 2], ['Cook', 22000, 5], ['Kitchen Helper', 15000, 6], ['Server', 13000, 4], ['Cleaner', 12000, 2]];

const SPORTS = [
  ['Cricket Bat',10,1500,20], ['Cricket Ball',24,350,10], ['Football',12,900,15], ['Basketball',10,1100,15],
  ['Volleyball',10,800,15], ['Badminton Racket',24,700,15], ['Shuttlecock Pack',30,250,10], ['Table Tennis Bat',12,450,10],
  ['Tennis Racket',6,1800,25], ['Chess Set',10,400,10], ['Carrom Board',4,1600,25], ['Skipping Rope',15,150,5],
];

/* ───────────── 4. DATA GENERATION (no DB needed) ───────────── */
function generate() {
  const d = {};
  const usedNames = new Set(['Bhoumik Jain']), usedPhones = new Set(['9820011002']);
  const newPhone = () => {
    let p;
    do { p = `${pick([6, 7, 8, 9])}${int(100000000, 999999999)}`; } while (usedPhones.has(p));
    usedPhones.add(p);
    return p;
  };
  const newName = g => {
    let f, l, n;
    do { f = pick(g === 'F' ? FEMALE : MALE); l = pick(LAST); n = `${f} ${l}`; } while (usedNames.has(n));
    usedNames.add(n);
    return { l, n };
  };

  // ── students
  d.students = [];
  for (let year = 1; year <= 4; year++) {
    const genders = shuffle([...Array(BOYS_PER_YEAR).fill('M'), ...Array(GIRLS_PER_YEAR).fill('F')]);
    const seq = {};
    genders.forEach((g, i) => {
      const branch = BRANCHES[i % BRANCHES.length];
      seq[branch] = (seq[branch] || 0) + 1;
      const { l, n } = newName(g);
      const bt_no = `${ADMISSION_PREFIX[year]}${branch}${String(seq[branch]).padStart(3, '0')}`;
      d.students.push({
        bt_no, name: n, last: l, g, year, branch,
        phone: newPhone(),
        email: `${bt_no.toLowerCase()}@iiitn.ac.in`,
        created_at: `${2026 - (year - 1)}-07-${int(15, 30)} 10:00:00`,
      });
    });
  }

  // ── Preserve Bhoumik Jain (BT24CSE106)
  const bhoumikIndex = d.students.findIndex(s => s.year === 3 && s.branch === 'CSE' && s.g === 'M');
  if (bhoumikIndex !== -1) {
    d.students[bhoumikIndex].bt_no = 'BT24CSE106';
    d.students[bhoumikIndex].name = 'Bhoumik Jain';
    d.students[bhoumikIndex].last = 'Jain';
    d.students[bhoumikIndex].phone = '9820011002';
    d.students[bhoumikIndex].email = 'bhoumik.jain@gmail.com';
    d.students[bhoumikIndex].created_at = '2024-07-20 10:00:00';
  }

  // ── rooms
  d.rooms = [];
  for (const f of FLOORS) {
    let n = 0;
    for (const t of ROOM_TYPES) {
      for (let k = 0; k < t.count; k++) {
        n++;
        d.rooms.push({ room_no: f.floor * 100 + n, max_capacity: t.cap, floor_no: f.floor, room_type: t.type });
      }
    }
  }
  const roomByNo = new Map(d.rooms.map(r => [r.room_no, r]));

  // ── allocations
  d.allocations = [];
  d.history = [];
  for (const f of FLOORS) {
    const residents = d.students.filter(s => (f.gender === 'F' ? s.g === 'F' : s.g === 'M' && s.year === f.year));
    const floorRooms = d.rooms.filter(r => r.floor_no === f.floor);
    const beds = shuffle(floorRooms.flatMap(r => Array(r.max_capacity).fill(r.room_no)));
    residents.forEach((s, i) => {
      s.room_no = beds[i];
      let allocDate = between('2026-07-25', '2026-08-08');
      if (chance(0.1)) {
        const moved = between('2026-08-20', '2026-09-30');
        d.history.push({
          bt_no: s.bt_no, old_room: pick(floorRooms.filter(r => r.room_no !== s.room_no)).room_no,
          new_room: s.room_no, from_date: iso(allocDate), to_date: iso(moved),
        });
        allocDate = moved;
      }
      d.allocations.push({ bt_no: s.bt_no, room_no: s.room_no, allocation_date: iso(allocDate) });
    });
  }

  // ── hostel leaves
  d.leaves = [];
  for (const s of d.students) {
    if (!chance(0.35)) continue;
    let cursor = D('2026-08-05');
    for (let k = int(1, 3); k > 0; k--) {
      const from = addDays(cursor, int(0, 14));
      const days = int(1, 7);
      const to = addDays(from, days - 1);
      if (to > D('2026-10-16')) break;
      d.leaves.push({ bt_no: s.bt_no, from_date: iso(from), to_date: iso(to), days });
      cursor = addDays(to, 3);
    }
  }

  // ── complaints
  const complaintStatuses = [STATUS.DONE, STATUS.DONE, STATUS.DONE, STATUS.PROGRESS, STATUS.OPEN];
  d.complaints = Array.from({ length: 70 }, () => {
    const s = pick(d.students);
    const issue_type = pick(Object.keys(ISSUES));
    const created = new Date(between('2026-08-10', '2026-10-14').getTime() + int(8, 20) * 36e5 + int(0, 59) * 6e4);
    let status = pick(complaintStatuses), resolved = null;
    if (status === STATUS.DONE) {
      resolved = new Date(created.getTime() + int(1, 6) * DAY + int(0, 5) * 36e5);
      if (resolved > NOW) { status = STATUS.PROGRESS; resolved = null; }
    }
    return {
      bt_no: s.bt_no, room_no: s.room_no, issue_type, description: pick(ISSUES[issue_type]),
      status, created_at: ts(created), resolved_at: resolved ? ts(resolved) : null,
    };
  });

  // ── hostel payments
  d.payments = d.students.map(s => {
    const paid = chance(0.85);
    return {
      bt_no: s.bt_no,
      amount: HOSTEL_FEE[roomByNo.get(s.room_no).room_type],
      payment_date: paid ? iso(between('2026-07-28', '2026-08-31')) : null,
      status: paid ? STATUS.PAID : STATUS.PENDING,
    };
  });

  // ── visitors
  d.visitors = Array.from({ length: 90 }, () => {
    const s = pick(d.students);
    const purpose = pick(PURPOSES);
    const family = purpose === 'Parents Visit' || purpose === 'Family Visit';
    const inMin = 10 * 60 + int(0, 420);
    return {
      student_bt_no: s.bt_no,
      visitor_name: family ? `${pick(PARENT_FIRST)} ${s.last}` : `${pick([...MALE, ...FEMALE])} ${pick(LAST)}`,
      visit_date: iso(between('2026-08-05', '2026-10-17')),
      in_time: hhmm(inMin), out_time: hhmm(inMin + int(30, 150)), purpose,
    };
  });

  // ── mess fees
  d.messFees = [];
  for (const s of d.students) {
    for (const m of [8, 9, 10]) {
      const paid = chance(m === 8 ? 0.96 : m === 9 ? 0.9 : 0.65);
      d.messFees.push({
        bt_no: s.bt_no, month: m, year: 2026, amount: MESS_FEE_PER_MONTH,
        payment_date: paid ? `2026-${String(m).padStart(2, '0')}-${String(int(1, 10)).padStart(2, '0')}` : null,
        status: paid ? STATUS.PAID : STATUS.PENDING,
      });
    }
  }

  // ── mess leaves
  d.messLeaves = d.leaves.filter(() => chance(0.8)).map(l => ({ ...l }));
  const refundDays = {};
  d.messLeaves.forEach(l => { refundDays[l.bt_no] = (refundDays[l.bt_no] || 0) + l.days; });
  d.messRefunds = Object.entries(refundDays).map(([bt_no, total_days]) => ({
    bt_no, total_days, refund_amount: total_days * REFUND_PER_DAY, last_updated: ts(NOW),
  }));

  // ── dishes & menu
  d.dishes = DISHES.map(([name, type]) => ({ name, type }));
  const dishByName = new Map(d.dishes.map(x => [x.name, x]));
  d.weeklyMenu = [];
  for (const [day_name, meals] of Object.entries(MENU)) {
    for (const [meal_type, dishes] of Object.entries(meals)) {
      for (const dish of dishes) {
        if (!dishByName.has(dish)) throw new Error(`MENU uses unknown dish: ${dish}`);
        d.weeklyMenu.push({ day_name, meal_type, dish });
      }
    }
  }

  // ── staff
  d.roles = ROLES.map(([role_name, salary_per_person]) => ({ role_name, salary_per_person }));
  d.staff = [];
  ROLES.forEach(([role, , count]) => {
    for (let k = 0; k < count; k++) {
      d.staff.push({
        name: newName(chance(0.6) ? 'M' : 'F').n, role, phone: newPhone(),
        joining_date: iso(between('2019-01-01', '2026-06-30')),
        status: d.staff.length % 10 === 9 ? 'Inactive' : 'Active',
      });
    }
  });

  // ── vendors
  d.vendors = VENDORS;

  // ── mess expenses
  d.messExpenses = [
    { type: 'Vegetables', amount: 24500.00, expense_date: '2026-07-28', remarks: 'July fresh produce purchase' },
    { type: 'Dairy & Milk', amount: 28800.00, expense_date: '2026-07-31', remarks: 'July milk and paneer settlement' },
    { type: 'Groceries & Grains', amount: 48500.00, expense_date: '2026-08-05', remarks: 'August wholesale pantry stock' },
    { type: 'Vegetables', amount: 26200.00, expense_date: '2026-08-15', remarks: 'Mid-August vegetable supplies' },
    { type: 'Gas / LPG Fuel', amount: 14200.00, expense_date: '2026-08-25', remarks: 'Commercial gas cylinders refill' },
    { type: 'Dairy & Milk', amount: 29500.00, expense_date: '2026-08-31', remarks: 'August dairy invoice' },
    { type: 'Groceries & Grains', amount: 46000.00, expense_date: '2026-09-05', remarks: 'September grain shipment' },
    { type: 'Vegetables', amount: 27500.00, expense_date: '2026-09-18', remarks: 'September vegetable supplies' },
    { type: 'Kitchen Maintenance', amount: 6500.00, expense_date: '2026-09-25', remarks: 'Exhaust chimney & burner repair' },
    { type: 'Dairy & Milk', amount: 31000.00, expense_date: '2026-09-30', remarks: 'September dairy bill' },
    { type: 'Groceries & Grains', amount: 49000.00, expense_date: '2026-10-05', remarks: 'October staples procurement' },
    { type: 'Vegetables', amount: 25000.00, expense_date: '2026-10-15', remarks: 'October fresh vegetables' },
  ];

  // ── sports
  d.sportsItems = SPORTS.map(([item_name, total, cost, fine]) => ({
    item_name, total_quantity: total, available_quantity: total, fine_per_day: fine, cost_per_item: cost, total_cost: total * cost,
  }));
  const used = {};
  d.sportsIssues = [];
  for (let i = 0; i < 130; i++) {
    const s = pick(d.students), it = pick(SPORTS), qty = int(1, 2);
    if ((used[it[0]] || 0) + qty > it[1] - 1) continue;
    used[it[0]] = (used[it[0]] || 0) + qty;
    const issued = between('2026-08-20', '2026-10-16');
    const due = addDays(issued, 3);
    const r = rand();
    let ret = r < 0.2 ? null : r < 0.5 ? addDays(due, int(1, 6)) : addDays(issued, int(0, 3));
    if (ret && ret > D(TODAY)) ret = null;
    d.sportsIssues.push({
      bt_no: s.bt_no, item: it[0], quantity: qty,
      issue_date: iso(issued), due_date: iso(due), return_date: ret ? iso(ret) : null,
    });
  }
  return d;
}

/* ───────────── 5. SANITY REPORT ───────────── */
function report(d) {
  const perRoom = {};
  d.allocations.forEach(a => { perRoom[a.room_no] = (perRoom[a.room_no] || 0) + 1; });
  d.rooms.forEach(r => {
    if ((perRoom[r.room_no] || 0) > r.max_capacity) throw new Error(`Room ${r.room_no} is over capacity`);
  });
  for (const key of ['bt_no', 'phone', 'email']) {
    if (new Set(d.students.map(s => s[key])).size !== d.students.length) throw new Error(`Duplicate ${key}`);
  }
  console.log('\nFloor layout & occupancy');
  console.table(FLOORS.map(f => {
    const rooms = d.rooms.filter(r => r.floor_no === f.floor);
    return {
      floor: f.floor,
      residents: f.gender === 'F' ? 'Girls (Years 1-4)' : `Boys (Year ${f.year})`,
      rooms: rooms.length,
      single: rooms.filter(r => r.room_type === 'Single').length,
      double: rooms.filter(r => r.room_type === 'Double').length,
      triple: rooms.filter(r => r.room_type === 'Triple').length,
      beds: rooms.reduce((t, r) => t + r.max_capacity, 0),
      filled: d.allocations.filter(a => Math.floor(a.room_no / 100) === f.floor).length,
    };
  }));
  console.log('Branch split (students):',
    BRANCHES.map(b => `${b}=${d.students.filter(s => s.branch === b).length}`).join('  '));
  console.log('Rows to insert:', {
    students: d.students.length, rooms: d.rooms.length, allocations: d.allocations.length, history: d.history.length,
    leaves: d.leaves.length, complaints: d.complaints.length, payments: d.payments.length, visitors: d.visitors.length,
    mess_fees: d.messFees.length, sports_issues: d.sportsIssues.length,
  });
}

/* ───────────── 6. DB HELPERS ───────────── */
const ALL_TABLES = [
  'sports_fines', 'sports_issues', 'sports_items',
  'mess_staff', 'staff_roles', 'vendors',
  'weekly_menu', 'menu_dishes',
  'mess_refunds', 'mess_leaves', 'mess_fees', 'mess_expenses',
  'allocation_history', 'visitors', 'payments', 'complaints',
  'refunds', 'leave_summary', 'leave_log', 'room_occupancy', 'room_allocations', 'rooms', 'students'
];

const colCache = {};
async function tableCols(c, table) {
  const tbl = table.toLowerCase();
  if (!colCache[tbl]) {
    const { rows } = await c.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema = current_schema() AND table_name = $1 AND is_generated = 'NEVER'`, [tbl]);
    colCache[tbl] = new Set(rows.map(r => r.column_name));
  }
  return colCache[tbl];
}

async function insertRows(c, table, rows, { returning, onConflict = '', quiet = false } = {}) {
  if (!rows.length) return [];
  const cols = await tableCols(c, table);
  if (!cols.size) throw new Error(`table "${table}" not found`);
  const all = Object.keys(rows[0]);
  const keys = all.filter(k => cols.has(k));
  const ignored = all.filter(k => !cols.has(k));
  if (ignored.length && !quiet) console.warn(`  ! ${table}: columns not in DB, ignored -> ${ignored.join(', ')}`);
  const chunk = Math.floor(60000 / keys.length);
  const out = [];
  for (let i = 0; i < rows.length; i += chunk) {
    const params = [];
    const tuples = rows.slice(i, i + chunk).map(r =>
      '(' + keys.map(k => { params.push(r[k]); return '$' + params.length; }).join(',') + ')');
    const res = await c.query(
      `INSERT INTO ${table} (${keys.join(',')}) VALUES ${tuples.join(',')} ${onConflict} ${returning ? 'RETURNING ' + returning : ''}`,
      params);
    out.push(...res.rows);
  }
  if (!quiet) console.log(`  ✓ ${table}: ${rows.length} rows`);
  return out;
}

async function idMap(c, table, rows, idCol, nameCol) {
  const out = await insertRows(c, table, rows, { returning: `${idCol}, ${nameCol}` });
  return new Map(out.map(r => [r[nameCol], r[idCol]]));
}

async function section(c, label, fn) {
  console.log(label);
  await c.query('SAVEPOINT sec');
  try { await fn(); await c.query('RELEASE SAVEPOINT sec'); }
  catch (e) { await c.query('ROLLBACK TO SAVEPOINT sec'); console.warn(`  ✗ skipped: ${e.message}`); }
}

async function upsertSetting(c, table, name, value) {
  const cols = [...(await tableCols(c, table))].filter(k => k !== 'setting_name');
  const valueCol = cols.find(k => /value/.test(k)) || cols[0];
  if (!valueCol) throw new Error(`${table}: cannot find the value column`);
  await c.query(
    `INSERT INTO ${table} (setting_name, ${valueCol}) VALUES ($1, $2)
     ON CONFLICT (setting_name) DO UPDATE SET ${valueCol} = EXCLUDED.${valueCol}`, [name, value]);
  console.log(`  ✓ ${table}: ${name} = ${value}`);
}

async function wipe(c) {
  const { rows } = await c.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = ANY($1)`,
    [ALL_TABLES]);
  if (rows.length) await c.query(`TRUNCATE TABLE ${rows.map(r => r.table_name).join(', ')} RESTART IDENTITY CASCADE`);
  console.log(`Wiped ${rows.length} tables`);
}

/* ───────────── 7. SEEDING ───────────── */
async function seed(c, d) {
  await section(c, 'Settings', async () => {
    await upsertSetting(c, 'hostel_settings', 'leave_refund_per_day', REFUND_PER_DAY);
    await upsertSetting(c, 'mess_settings', 'refund_per_day', REFUND_PER_DAY);
  });

  console.log('Core hostel');
  await insertRows(c, 'students', d.students.map(s => only(s, ['bt_no', 'name', 'year', 'phone', 'email', 'branch', 'created_at'])));
  await insertRows(c, 'rooms', d.rooms);
  await insertRows(c, 'room_allocations', d.allocations);
  await c.query(`INSERT INTO room_occupancy (room_no, current_count)
                 SELECT room_no, 0 FROM rooms ON CONFLICT (room_no) DO NOTHING`);
  await insertRows(c, 'allocation_history', d.history);
  await insertRows(c, 'leave_log', d.leaves);
  await insertRows(c, 'complaints', d.complaints);
  await insertRows(c, 'payments', d.payments);
  await insertRows(c, 'visitors', d.visitors);

  console.log('Mess');
  await insertRows(c, 'mess_fees', d.messFees);
  await insertRows(c, 'mess_leaves', d.messLeaves);
  await insertRows(c, 'mess_refunds', d.messRefunds, {
    onConflict: 'ON CONFLICT (bt_no) DO UPDATE SET total_days = EXCLUDED.total_days, refund_amount = EXCLUDED.refund_amount',
  });
  if (d.messExpenses && d.messExpenses.length) {
    await insertRows(c, 'mess_expenses', d.messExpenses);
  }
  const dishId = await idMap(c, 'menu_dishes', d.dishes.map(x => ({ dish_name: x.name, meal_type: x.type })), 'dish_id', 'dish_name');
  await insertRows(c, 'weekly_menu', d.weeklyMenu.map(m => ({ day_name: m.day_name, meal_type: m.meal_type, dish_id: dishId.get(m.dish) })));

  const roleId = await idMap(c, 'staff_roles', d.roles, 'role_id', 'role_name');
  await insertRows(c, 'mess_staff', d.staff.map(s => ({
    name: s.name, role_id: roleId.get(s.role), phone: s.phone, joining_date: s.joining_date, status: s.status,
  })));

  await section(c, 'Vendors', async () => {
    await insertRows(c, 'vendors', d.vendors);
  });

  console.log('Sports');
  const sportId = await idMap(c, 'sports_items', d.sportsItems, 'item_id', 'item_name');
  for (const s of d.sportsIssues) {
    const [{ issue_id }] = await insertRows(c, 'sports_issues', [{
      bt_no: s.bt_no, item_id: sportId.get(s.item), quantity: s.quantity,
      issue_date: s.issue_date, due_date: s.due_date, return_date: null, status: STATUS.ISSUED,
    }], { returning: 'issue_id', quiet: true });
    if (s.return_date) {
      await c.query('UPDATE sports_issues SET status = $1, return_date = $2 WHERE issue_id = $3',
        [STATUS.RETURNED, s.return_date, issue_id]);
    }
  }
  console.log(`  ✓ sports_issues: ${d.sportsIssues.length} rows`);
  await c.query(
    `UPDATE sports_items si SET available_quantity = si.total_quantity -
       COALESCE((SELECT SUM(i.quantity) FROM sports_issues i WHERE i.item_id = si.item_id AND i.status = $1), 0)`,
    [STATUS.ISSUED]);
}

async function summary(c) {
  const counts = {};
  for (const t of [...ALL_TABLES].reverse()) {
    try { counts[t] = Number((await c.query(`SELECT COUNT(*) FROM ${t}`)).rows[0].count); } catch (_) { /* table missing */ }
  }
  console.log('\nRow counts in DB (includes trigger-generated rows):');
  console.table(counts);
  try {
    const { rows } = await c.query(
      `SELECT r.floor_no, COUNT(*) AS rooms, SUM(r.max_capacity) AS beds, COALESCE(SUM(o.current_count), 0) AS filled
       FROM rooms r LEFT JOIN room_occupancy o USING (room_no) GROUP BY r.floor_no ORDER BY r.floor_no`);
    console.log('Floor occupancy from room_occupancy (trigger-maintained):');
    console.table(rows);
  } catch (_) { /* optional check */ }
}

/* ───────────── 8. MAIN ───────────── */
async function main() {
  const args = process.argv.slice(2);
  const d = generate();
  report(d);
  if (args.includes('--dry')) { console.log('\nDry run only - nothing written to the database.'); return; }

  const { Pool } = require('pg');
  const env = (...names) => names.map(k => process.env[k]).find(Boolean);
  const pool = new Pool(process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: env('DB_HOST', 'PGHOST') || 'localhost',
        port: Number(env('DB_PORT', 'PGPORT') || 5432),
        user: env('DB_USER', 'PGUSER') || 'postgres',
        password: env('DB_PASSWORD', 'DB_PASS', 'PGPASSWORD') || 'admin123',
        database: env('DB_NAME', 'DB_DATABASE', 'PGDATABASE') || 'hostel_management',
      });
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    if (args.includes('--reset')) await wipe(c);
    else {
      const { rows: [{ n }] } = await c.query('SELECT COUNT(*)::int AS n FROM students');
      if (n > 0) throw new Error('students table is not empty. Run with --reset to wipe and reseed.');
    }
    await seed(c, d);
    await c.query('COMMIT');
    console.log('\n✓ Seeding complete');
    await summary(c);
  } catch (e) {
    await c.query('ROLLBACK');
    console.error('\n✗ Seeding failed, nothing was saved:', e.message);
    process.exitCode = 1;
  } finally {
    c.release();
    await pool.end();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
