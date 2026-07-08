// ============================================================
// TESTHUB DATA LAYER — localStorage adapter
// To swap to Firebase/Supabase/API, rewrite the function bodies
// below. Nothing else in the app calls localStorage directly.
// ============================================================

const DB_KEY = 'testhub';

function defaultDB() {
  return {
    employees: [],       // { id, name, email, dept, joined }
    tests: [],           // { id, bank, categories, count, timeLimit, passPercent, mode, createdBy, createdAt }
    attempts: [],        // { id, employeeId, testId, score, total, percentage, passed, answers[], timeTaken, timestamp }
    questionBanks: [],   // pre-seeded from /data/*.json files
    meta: {
      orgName: 'My Organization',
      adminPassword: 'admin123',
      nextEmpId: 1,
      nextTestId: 1,
      nextAttemptId: 1
    }
  };
}

function loadDB() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      const db = JSON.parse(raw);
      // ensure meta exists
      if (!db.meta) db.meta = defaultDB().meta;
      if (!db.meta.adminPassword) db.meta.adminPassword = 'admin123';
      return db;
    }
  } catch (e) {}
  const def = defaultDB();
  saveDB(def);
  return def;
}

function saveDB(db) {
  try { localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch (e) {}
}

// ============================================================
// EMPLOYEES
// ============================================================

function addEmployee(name, email, dept) {
  const db = loadDB();
  const emp = { id: db.meta.nextEmpId++, name, email, dept, joined: Date.now() };
  db.employees.push(emp);
  saveDB(db);
  return emp;
}

function getEmployeeByEmail(email) {
  const db = loadDB();
  return db.employees.find(e => e.email.toLowerCase() === email.toLowerCase());
}

function getAllEmployees() {
  return loadDB().employees;
}

// ============================================================
// QUESTION BANKS
// ============================================================

function seedQuestionBanks() {
  const db = loadDB();
  if (db.questionBanks.length > 0) return; // already seeded
  // Attempt to load from /data/*.json — these are loaded via <script> tags
  // as global variables (set in index.html) or fetched via fetch.
  // We attempt synchronous XHR for simplicity (no build step).
  const banks = [];
  const files = [
    'data/questions-excel-vba.json',
    'data/questions-sql.json',
    'data/questions-javascript.json',
    'data/questions-workplace.json'
  ];
  for (const file of files) {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', file, false); // synchronous
      xhr.overrideMimeType('application/json');
      xhr.send();
      if (xhr.status === 200) {
        const bank = JSON.parse(xhr.responseText);
        banks.push(bank);
      }
    } catch (e) { console.warn('Could not load ' + file, e); }
  }
  if (banks.length) {
    db.questionBanks = banks;
    saveDB(db);
  }
}

function getQuestionBanks() {
  return loadDB().questionBanks;
}

function getQuestionsForTest(test) {
  const db = loadDB();
  const bank = db.questionBanks.find(b => b.id === test.bank);
  if (!bank) return [];
  let pool = bank.questions;
  if (test.categories && test.categories.length) {
    pool = pool.filter(q => test.categories.includes(q.category));
  }
  // Shuffle and slice
  pool = shuffle([...pool]);
  return pool.slice(0, test.count || pool.length);
}

function seedDefaultTests() {
  const db = loadDB();
  if (db.tests.length > 0) return;
  const banks = db.questionBanks;
  if (!banks.length) return;
  // Create one test per bank
  for (const bank of banks) {
    db.tests.push({
      id: db.meta.nextTestId++,
      bank: bank.id,
      categories: [],
      count: Math.min(10, bank.questions.length),
      timeLimit: 15, // minutes
      passPercent: 60,
      mode: 'timed',
      title: bank.title + ' Quick Test',
      createdBy: 'system',
      createdAt: Date.now()
    });
  }
  saveDB(db);
}

// ============================================================
// TESTS (admin CRUD)
// ============================================================

function createTest(data) {
  const db = loadDB();
  const test = {
    id: db.meta.nextTestId++,
    ...data,
    createdAt: Date.now()
  };
  db.tests.push(test);
  saveDB(db);
  return test;
}

function updateTest(id, data) {
  const db = loadDB();
  const idx = db.tests.findIndex(t => t.id === id);
  if (idx === -1) return null;
  db.tests[idx] = { ...db.tests[idx], ...data };
  saveDB(db);
  return db.tests[idx];
}

function deleteTest(id) {
  const db = loadDB();
  db.tests = db.tests.filter(t => t.id !== id);
  saveDB(db);
}

function getTest(id) {
  return loadDB().tests.find(t => t.id === id);
}

function getAllTests() {
  return loadDB().tests;
}

// ============================================================
// ATTEMPTS (employee quiz results)
// ============================================================

function saveAttempt(attempt) {
  const db = loadDB();
  attempt.id = db.meta.nextAttemptId++;
  db.attempts.push(attempt);
  saveDB(db);
  return attempt;
}

function getAttemptsByEmployee(empId) {
  return loadDB().attempts.filter(a => a.employeeId === empId)
    .sort((a, b) => b.timestamp - a.timestamp);
}

function getAttemptByTestEmployee(testId, empId) {
  return loadDB().attempts.find(
    a => a.testId === testId && a.employeeId === empId
  );
}

function getAttempt(id) {
  return loadDB().attempts.find(a => a.id === id);
}

function getAllAttempts() {
  return loadDB().attempts.sort((a, b) => b.timestamp - a.timestamp);
}

function getAttemptsByTest(testId) {
  return loadDB().attempts.filter(a => a.testId === testId)
    .sort((a, b) => b.timestamp - a.timestamp);
}

// ============================================================
// HELPERS
// ============================================================

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
