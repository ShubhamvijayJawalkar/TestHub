// ============================================================
// TESTHUB — Main Application Controller
// ============================================================

// ---------- STATE ----------
let currentUser = null;
let currentTest = null;
let quizQuestions = [];
let quizState = {};
let viewingResultId = null;
let sidebarLinks = [];

// ---------- DOM SHORTCUT ----------
function $(id) { return document.getElementById(id); }

// ---------- SCREEN ROUTER ----------
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(id).classList.add('active');
  updateSidebar(id);
}

function updateSidebar(activeScreen) {
  const map = {
    'employee-dashboard': 'nav-emp-dash',
    'my-history': 'nav-emp-history',
    'quiz-screen': 'nav-emp-dash',
    'results-screen': 'nav-emp-dash',
    'certificate-screen': 'nav-emp-dash',
    'admin-dashboard': 'nav-admin-dash',
    'admin-tests': 'nav-admin-tests',
    'admin-questions': 'nav-admin-questions',
    'admin-results': 'nav-admin-results',
    'admin-users': 'nav-admin-users',
    'admin-settings': 'nav-admin-settings',
  };
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const active = $(map[activeScreen]);
  if (active) active.classList.add('active');
}

function escHtml(s) {
  if (s == null) return '';
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function fmtTime(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m + 'm ' + ('0' + s).slice(-2) + 's';
}

// ============================================================
// SIDEBAR
// ============================================================

function renderSidebar(role) {
  const nav = $('sidebarNav');
  const footer = $('sidebarFooter');
  const brand = $('sidebarBrand');
  const sidebar = document.querySelector('.sidebar');
  const topbar = document.querySelector('.topbar');
  const main = document.querySelector('.main');

  if (!role || role === 'none') {
    sidebar.style.display = 'none';
    topbar.style.display = 'none';
    main.style.marginLeft = '0';
    main.style.marginTop = '0';
    return;
  }

  sidebar.style.display = 'flex';
  topbar.style.display = 'flex';
  main.style.marginLeft = 'var(--sidebar-w)';
  main.style.marginTop = 'var(--topbar-h)';

  if (role === 'admin') {
    brand.innerHTML = '<div class="logo-dot">T</div> Admin Panel';
    sidebarLinks = [
      { id: 'nav-admin-dash', icon: '📊', label: 'Dashboard', screen: 'admin-dashboard' },
      { id: 'nav-admin-tests', icon: '📝', label: 'Tests', screen: 'admin-tests' },
      { id: 'nav-admin-questions', icon: '❓', label: 'Questions', screen: 'admin-questions' },
      { id: 'nav-admin-results', icon: '📈', label: 'Results', screen: 'admin-results' },
      { id: 'nav-admin-users', icon: '👥', label: 'Users', screen: 'admin-users' },
      { id: 'nav-admin-settings', icon: '⚙️', label: 'Settings', screen: 'admin-settings' },
    ];
    footer.innerHTML = '<div class="nav-item" onclick="logout()"><span class="nav-icon">🚪</span> Logout</div>';
  } else {
    brand.innerHTML = '<div class="logo-dot">T</div> TestHub';
    sidebarLinks = [
      { id: 'nav-emp-dash', icon: '🏠', label: 'Dashboard', screen: 'employee-dashboard' },
      { id: 'nav-emp-history', icon: '📋', label: 'My History', screen: 'my-history' },
    ];
    footer.innerHTML = '<div class="nav-item" onclick="logout()"><span class="nav-icon">🚪</span> Logout</div>';
  }

  nav.innerHTML = sidebarLinks.map(l =>
    `<div class="nav-item" id="${l.id}" onclick="showScreen('${l.screen}'); render${l.screen === 'employee-dashboard' ? 'EmployeeDashboard' : l.screen === 'my-history' ? 'MyHistory' : l.screen === 'admin-dashboard' ? 'AdminDashboard' : l.screen === 'admin-tests' ? 'AdminTests' : l.screen === 'admin-questions' ? 'AdminQuestions' : l.screen === 'admin-results' ? 'AdminResults' : l.screen === 'admin-users' ? 'AdminUsers' : 'AdminSettings'}()">
      <span class="nav-icon">${l.icon}</span> ${l.label}
    </div>`
  ).join('');
}

function logout() {
  currentUser = null;
  currentTest = null;
  quizQuestions = [];
  quizState = {};
  viewingResultId = null;
  $('topbarUser').innerHTML = '';
  $('topbarTitle').innerText = 'TestHub';
  renderSidebar('none');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  showRoleSelect();
}

// ============================================================
// ROLE SELECT
// ============================================================

function showRoleSelect() {
  $('topbarUser').innerHTML = '';
  $('topbarTitle').innerText = 'TestHub';
  showScreen('role-select');
}

// ============================================================
// EMPLOYEE LOGIN
// ============================================================

function employeeLogin() {
  const name = $('empName').value.trim();
  const email = $('empEmail').value.trim();
  const dept = $('empDept').value.trim();
  if (!name || !email) { alert('Name and email are required.'); return; }

  let emp = getEmployeeByEmail(email);
  if (!emp) {
    emp = addEmployee(name, email, dept || 'General');
  } else {
    // Update name/dept if changed
    emp.name = name;
    emp.dept = dept || emp.dept;
    const db = loadDB();
    const idx = db.employees.findIndex(e => e.id === emp.id);
    if (idx > -1) db.employees[idx] = emp;
    saveDB(db);
  }
  currentUser = emp;

  $('topbarUser').innerHTML = `<div class="user-avatar">${emp.name.charAt(0).toUpperCase()}</div><span>${escHtml(emp.name)}</span>`;
  $('topbarTitle').innerText = 'Employee Dashboard';
  renderSidebar('employee');
  renderEmployeeDashboard();
  showScreen('employee-dashboard');
}

// ============================================================
// EMPLOYEE DASHBOARD
// ============================================================

function renderEmployeeDashboard() {
  const db = loadDB();
  const tests = db.tests;
  const myAttempts = db.attempts.filter(a => a.employeeId === currentUser.id);

  // Best score
  const best = myAttempts.length ? Math.max(...myAttempts.map(a => a.percentage)) : 0;
  $('empBestRing').innerHTML = '';
  scoreRing($('empBestRing'), { pct: best, size: 56, stroke: 5, label: best + '%' });
  $('empBestVal').innerText = myAttempts.length;
  $('empTestsTaken').innerText = myAttempts.length;

  // Stats
  const passed = myAttempts.filter(a => a.passed).length;
  const avg = myAttempts.length ? Math.round(myAttempts.reduce((s, a) => s + a.percentage, 0) / myAttempts.length) : 0;
  $('empPassRate').innerText = myAttempts.length ? Math.round((passed / myAttempts.length) * 100) + '%' : '-';
  $('empAvgScore').innerText = avg + '%';

  // Test cards
  const container = $('empTestGrid');
  if (!tests.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><h3>No tests available</h3><p>Check back later or contact your admin.</p></div>';
    return;
  }

  // Check which tests have been attempted
  const attemptedTestIds = new Set(myAttempts.map(a => a.testId));

  container.innerHTML = tests.map(t => {
    const bank = db.questionBanks.find(b => b.id === t.bank);
    const attempted = attemptedTestIds.has(t.id);
    const myBest = myAttempts.filter(a => a.testId === t.id)
      .sort((a, b) => b.percentage - a.percentage);
    const bestPct = myBest.length ? myBest[0].percentage : 0;
    const passedBest = myBest.length ? myBest[0].passed : false;
    return `<div class="test-card" onclick="${attempted ? 'renderTestResults(' + t.id + ')' : 'startTest(' + t.id + ')'}">
      <div class="test-card-icon">${bank ? bank.icon : '📝'}</div>
      <h4>${escHtml(t.title)}</h4>
      <p>${escHtml(t.bank)} ${t.categories.length ? '· ' + t.categories.join(', ') : ''}</p>
      <div class="test-card-meta">
        <span>${t.count} questions</span>
        <span>${t.timeLimit} min</span>
        <span>Pass: ${t.passPercent}%</span>
      </div>
      <div class="test-card-footer">
        ${attempted ? `<span class="result-badge ${passedBest ? 'pass' : 'fail'}">Best: ${bestPct}%</span>` : '<span class="result-badge pending">Not attempted</span>'}
        <span style="font-size:13px;color:var(--signal);font-weight:500;">${attempted ? 'View Results →' : 'Start Test →'}</span>
      </div>
    </div>`;
  }).join('');
}

function renderTestResults(testId) {
  const db = loadDB();
  const attempts = db.attempts.filter(a => a.employeeId === currentUser.id && a.testId === testId)
    .sort((a, b) => b.timestamp - a.timestamp);
  if (!attempts.length) return;

  // Show latest attempt details in a modal
  const latest = attempts[0];
  showAttemptModal(latest);
}

// ============================================================
// QUIZ ENGINE
// ============================================================

function startTest(testId) {
  const db = loadDB();
  const test = db.tests.find(t => t.id === testId);
  if (!test) return;

  currentTest = test;
  quizQuestions = getQuestionsForTest(test);

  if (!quizQuestions.length) {
    alert('No questions available for this test.');
    return;
  }

  // Shuffle options within each question
  quizQuestions = quizQuestions.map(q => {
    const optCopy = [...q.o];
    const correct = optCopy[q.a];
    // Shuffle options but track the correct answer text
    const shuffled = shuffle(optCopy);
    const newIdx = shuffled.indexOf(correct);
    return { ...q, o: shuffled, a: newIdx };
  });

  quizState = {
    currentIndex: 0,
    answers: [],
    score: 0,
    timeRemaining: (test.timeLimit || 15) * 60,
    timerId: null,
    startTime: Date.now(),
    answered: new Array(quizQuestions.length).fill(false),
    selectedAnswer: new Array(quizQuestions.length).fill(-1),
  };

  $('topbarTitle').innerText = escHtml(test.title);
  showScreen('quiz-screen');
  renderQuestion();
  startTimer();
}

function renderQuestion() {
  const idx = quizState.currentIndex;
  const q = quizQuestions[idx];
  if (!q) return;

  $('qProgress').innerText = `${idx + 1} / ${quizQuestions.length}`;
  $('qNumber').innerText = `Question ${idx + 1}`;
  $('qText').innerText = q.q;
  $('qCategory').innerText = q.category;

  // Progress fill
  const pct = ((idx + 1) / quizQuestions.length) * 100;
  $('qProgressFill').style.width = pct + '%';

  // Options
  const list = $('qOptions');
  list.innerHTML = q.o.map((opt, oi) => {
    const selected = quizState.selectedAnswer[idx] === oi;
    return `<div class="option-item${selected ? ' selected' : ''}" onclick="selectOption(${oi})">
      <div class="option-marker">${String.fromCharCode(65 + oi)}</div>
      <span>${escHtml(opt)}</span>
    </div>`;
  }).join('');

  // Nav buttons
  $('qPrevBtn').classList.toggle('hidden', idx === 0);
  const isLast = idx === quizQuestions.length - 1;
  $('qNextBtn').classList.toggle('hidden', isLast);
  $('qSubmitBtn').classList.toggle('hidden', !isLast);

  // Question pills
  renderQuestionPills();
}

function renderQuestionPills() {
  const container = $('qPills');
  container.innerHTML = quizQuestions.map((_, i) => {
    let cls = 'pill';
    if (i === quizState.currentIndex) cls += ' active';
    else if (quizState.answered[i]) cls += quizState.selectedAnswer[i] === quizQuestions[i].a ? ' correct' : ' wrong';
    return `<div class="${cls}" onclick="goToQuestion(${i})">${i + 1}</div>`;
  }).join('');
}

function goToQuestion(idx) {
  if (idx < 0 || idx >= quizQuestions.length) return;
  quizState.currentIndex = idx;
  renderQuestion();
}

function selectOption(optIdx) {
  const idx = quizState.currentIndex;
  if (quizState.answered[idx]) return; // already answered

  quizState.selectedAnswer[idx] = optIdx;
  quizState.answered[idx] = true;

  const q = quizQuestions[idx];
  const isCorrect = optIdx === q.a;
  if (isCorrect) quizState.score++;

  quizState.answers[idx] = {
    question: q.q,
    category: q.category,
    options: q.o,
    selected: optIdx,
    isCorrect,
    correctText: q.o[q.a]
  };

  renderQuestion();
}

function nextQuestion() {
  if (quizState.currentIndex < quizQuestions.length - 1) {
    quizState.currentIndex++;
    renderQuestion();
  }
}

function prevQuestion() {
  if (quizState.currentIndex > 0) {
    quizState.currentIndex--;
    renderQuestion();
  }
}

function submitQuiz() {
  const unanswered = quizState.answers.filter(a => !a).length;
  if (unanswered > 0) {
    if (!confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`)) return;
  }

  clearInterval(quizState.timerId);
  const result = buildAttempt();
  saveAttempt(result);
  showQuizResults(result);
}

function buildAttempt() {
  const total = quizQuestions.length;
  const pct = total > 0 ? Math.round((quizState.score / total) * 100) : 0;
  const timeTaken = Math.floor((Date.now() - quizState.startTime) / 1000);

  return {
    employeeId: currentUser.id,
    employeeName: currentUser.name,
    employeeEmail: currentUser.email,
    employeeDept: currentUser.dept,
    testId: currentTest.id,
    testTitle: currentTest.title,
    score: quizState.score,
    total: total,
    percentage: pct,
    passed: pct >= (currentTest.passPercent || 60),
    answers: quizState.answers.filter(a => a),
    timeTaken: timeTaken,
    timestamp: Date.now()
  };
}

// ============================================================
// TIMER
// ============================================================

function startTimer() {
  clearInterval(quizState.timerId);
  quizState.timerId = setInterval(() => {
    quizState.timeRemaining--;
    const mins = Math.floor(quizState.timeRemaining / 60);
    const secs = quizState.timeRemaining % 60;
    const display = $('qTimer');
    display.innerText = `${('0' + mins).slice(-2)}:${('0' + secs).slice(-2)}`;
    display.className = 'quiz-timer' + (quizState.timeRemaining <= 60 ? ' danger' : quizState.timeRemaining <= 180 ? ' warning' : '');

    // Timer bar
    const totalSecs = (currentTest.timeLimit || 15) * 60;
    const barPct = (quizState.timeRemaining / totalSecs) * 100;
    $('timerBarFill').style.width = barPct + '%';
    $('timerBarFill').style.background = quizState.timeRemaining <= 60 ? 'var(--crimson)' : quizState.timeRemaining <= 180 ? 'var(--amber)' : 'var(--verdant)';

    if (quizState.timeRemaining <= 0) {
      clearInterval(quizState.timerId);
      alert('Time is up!');
      const result = buildAttempt();
      saveAttempt(result);
      showQuizResults(result);
    }
  }, 1000);
}

// ============================================================
// QUIZ RESULTS (employee)
// ============================================================

function showQuizResults(attempt) {
  $('topbarTitle').innerText = 'Results';

  // Score ring
  const ringEl = $('resultRing');
  ringEl.innerHTML = '';
  const color = attempt.passed ? 'var(--verdant)' : 'var(--crimson)';
  scoreRing(ringEl, { pct: attempt.percentage, size: 140, stroke: 10, color: color, label: attempt.percentage + '%' });

  $('resultBanner').innerText = attempt.passed ? 'Congratulations! You Passed!' : 'Test Complete';
  $('resultBanner').style.color = attempt.passed ? 'var(--verdant)' : 'var(--crimson)';
  $('resultSub').innerHTML = `You scored <strong>${attempt.score}/${attempt.total}</strong> in ${fmtTime(attempt.timeTaken)}`;

  $('rScore').innerText = `${attempt.score}/${attempt.total}`;
  $('rTime').innerText = fmtTime(attempt.timeTaken);
  $('rAccuracy').innerText = attempt.percentage + '%';
  $('rStatus').innerText = attempt.passed ? 'PASS' : 'FAIL';
  $('rStatus').style.color = attempt.passed ? 'var(--verdant)' : 'var(--crimson)';

  // Category breakdown
  const cats = {};
  attempt.answers.forEach(a => {
    if (!cats[a.category]) cats[a.category] = { correct: 0, total: 0 };
    cats[a.category].total++;
    if (a.isCorrect) cats[a.category].correct++;
  });
  const catKeys = Object.keys(cats);
  const catData = catKeys.map(c => ({
    label: c,
    value: cats[c].total > 0 ? Math.round((cats[c].correct / cats[c].total) * 100) : 0
  }));
  const colors = ['#2F5DE3', '#1F9D6B', '#E8A33D', '#D64545', '#8B5CF6', '#0EA5E9'];
  catData.forEach((d, i) => d.color = colors[i % colors.length]);

  $('catBreakdown').innerHTML = catData.length
    ? '<h4 style="font-family:var(--font-display);font-size:15px;font-weight:600;margin-bottom:12px;">Category Breakdown</h4>'
    : '';
  if (catData.length) {
    barChart($('catBreakdown'), { data: catData, height: catData.length * 36 + 20 });
  }

  // Answer review
  $('reviewList').innerHTML = attempt.answers.map((a, i) => {
    const cls = a.isCorrect ? 'correct' : 'wrong';
    return `<div class="review-item ${cls}">
      <div class="review-q">${i + 1}. ${escHtml(a.question)}</div>
      <div class="review-a">Your answer: <span class="${a.isCorrect ? 'correct-text' : 'wrong-text'}">${escHtml(a.options[a.selected])}</span>
      ${!a.isCorrect ? ` · Correct: <span class="correct-text">${escHtml(a.correctText)}</span>` : ''}</div>
      <div class="review-cat">${a.category}</div>
    </div>`;
  }).join('');

  // Store last attempt for certificate/retry
  quizState.lastAttempt = attempt;

  // Reset back buttons to employee defaults
  $('resultBackContainer').innerHTML =
    '<button class="btn btn-primary" onclick="renderEmployeeDashboard(); showScreen(\'employee-dashboard\');">Back to Dashboard</button>' +
    '<button class="btn btn-outline" onclick="retryMissed()">Retry Missed</button>' +
    '<button class="btn btn-secondary" onclick="showCertificate()">View Certificate</button>';

  showScreen('results-screen');
}

function retryMissed() {
  const attempt = quizState.lastAttempt;
  if (!attempt) return;
  const missed = attempt.answers.filter(a => !a.isCorrect);
  if (!missed.length) { alert('No questions to retry!'); return; }

  const db = loadDB();
  const test = db.tests.find(t => t.id === attempt.testId);
  if (!test) return;

  // Create a synthetic test in memory
  currentTest = { ...test, title: test.title + ' (Retry Missed)' };
  quizQuestions = missed.map(a => {
    const q = { q: a.question, category: a.category, o: a.options, a: a.options.indexOf(a.correctText) };
    return q;
  });

  quizState = {
    currentIndex: 0,
    answers: [],
    score: 0,
    timeRemaining: Math.max(5, Math.ceil(quizQuestions.length * 60)),
    timerId: null,
    startTime: Date.now(),
    answered: new Array(quizQuestions.length).fill(false),
    selectedAnswer: new Array(quizQuestions.length).fill(-1),
  };

  $('topbarTitle').innerText = escHtml(currentTest.title);
  showScreen('quiz-screen');
  renderQuestion();
  startTimer();
}

function showCertificate() {
  const attempt = quizState.lastAttempt;
  if (!attempt) return;
  const db = loadDB();
  const orgName = db.meta.orgName || 'My Organization';

  $('certOrg').innerText = orgName;
  $('certName').innerText = attempt.employeeName;
  $('certTest').innerText = attempt.testTitle;
  $('certScore').innerText = attempt.percentage + '%';
  $('certResult').innerText = attempt.passed ? 'PASSED' : 'COMPLETED';
  $('certResult').style.color = attempt.passed ? 'var(--verdant)' : 'var(--slate)';
  $('certDate').innerText = new Date(attempt.timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  $('certDept').innerText = attempt.employeeDept || 'Employee';

  showScreen('certificate-screen');
}

function printCertificate() {
  window.print();
}

// ============================================================
// MY HISTORY
// ============================================================

function renderMyHistory() {
  const db = loadDB();
  const attempts = db.attempts.filter(a => a.employeeId === currentUser.id)
    .sort((a, b) => b.timestamp - a.timestamp);

  if (!attempts.length) {
    $('historyTableBody').innerHTML = '<tr><td colspan="5" class="table-empty">No attempts yet. Take a test to see your history.</td></tr>';
    $('historySparkline').innerHTML = '<div class="empty-state" style="padding:20px;">No data for trend</div>';
    return;
  }

  $('historyTableBody').innerHTML = attempts.map(a => {
    const d = new Date(a.timestamp);
    return `<tr style="cursor:pointer;" onclick="showAttemptModal(${JSON.stringify(a).replace(/"/g, '&quot;')})">
      <td>${escHtml(a.testTitle)}</td>
      <td>${d.toLocaleDateString()}</td>
      <td>${a.score}/${a.total}</td>
      <td>${a.percentage}%</td>
      <td><span class="badge ${a.passed ? 'badge-verdant' : 'badge-crimson'}">${a.passed ? 'PASS' : 'FAIL'}</span></td>
    </tr>`;
  }).join('');

  // Sparkline
  const trend = attempts.slice().reverse().map(a => a.percentage);
  $('historySparkline').innerHTML = '';
  sparkline($('historySparkline'), { data: trend, width: 300, height: 40, color: 'var(--signal)' });

  // Stats
  const avg = Math.round(attempts.reduce((s, a) => s + a.percentage, 0) / attempts.length);
  const best = Math.max(...attempts.map(a => a.percentage));
  const worst = Math.min(...attempts.map(a => a.percentage));
  $('historyAvg').innerText = avg + '%';
  $('historyBest').innerText = best + '%';
  $('historyWorst').innerText = worst + '%';
  $('historyTotal').innerText = attempts.length;
}

function showAttemptModal(attempt) {
  // Reuse the results screen to show any past attempt
  quizState.lastAttempt = attempt;

  const ringEl = $('resultRing');
  ringEl.innerHTML = '';
  const color = attempt.passed ? 'var(--verdant)' : 'var(--crimson)';
  scoreRing(ringEl, { pct: attempt.percentage, size: 140, stroke: 10, color: color, label: attempt.percentage + '%' });

  $('resultBanner').innerText = attempt.passed ? 'Passed!' : 'Did Not Pass';
  $('resultBanner').style.color = attempt.passed ? 'var(--verdant)' : 'var(--crimson)';
  $('resultSub').innerHTML = `Scored <strong>${attempt.score}/${attempt.total}</strong> on ${escHtml(attempt.testTitle)} in ${fmtTime(attempt.timeTaken)}`;

  $('rScore').innerText = `${attempt.score}/${attempt.total}`;
  $('rTime').innerText = fmtTime(attempt.timeTaken);
  $('rAccuracy').innerText = attempt.percentage + '%';
  $('rStatus').innerText = attempt.passed ? 'PASS' : 'FAIL';
  $('rStatus').style.color = attempt.passed ? 'var(--verdant)' : 'var(--crimson)';

  const cats = {};
  (attempt.answers || []).forEach(a => {
    if (!cats[a.category]) cats[a.category] = { correct: 0, total: 0 };
    cats[a.category].total++;
    if (a.isCorrect) cats[a.category].correct++;
  });
  const catKeys = Object.keys(cats);
  const catData = catKeys.map(c => ({
    label: c,
    value: cats[c].total > 0 ? Math.round((cats[c].correct / cats[c].total) * 100) : 0
  }));
  const colors = ['#2F5DE3', '#1F9D6B', '#E8A33D', '#D64545', '#8B5CF6', '#0EA5E9'];
  catData.forEach((d, i) => d.color = colors[i % colors.length]);

  $('catBreakdown').innerHTML = catData.length
    ? '<h4 style="font-family:var(--font-display);font-size:15px;font-weight:600;margin-bottom:12px;">Category Breakdown</h4>'
    : '';
  if (catData.length) {
    barChart($('catBreakdown'), { data: catData, height: catData.length * 36 + 20 });
  }

  $('reviewList').innerHTML = (attempt.answers || []).map((a, i) => {
    const cls = a.isCorrect ? 'correct' : 'wrong';
    return `<div class="review-item ${cls}">
      <div class="review-q">${i + 1}. ${escHtml(a.question)}</div>
      <div class="review-a">Your answer: <span class="${a.isCorrect ? 'correct-text' : 'wrong-text'}">${escHtml(a.options[a.selected])}</span>
      ${!a.isCorrect ? ` · Correct: <span class="correct-text">${escHtml(a.correctText)}</span>` : ''}</div>
      <div class="review-cat">${a.category}</div>
    </div>`;
  }).join('');

  // Reset back buttons to employee defaults
  $('resultBackContainer').innerHTML =
    '<button class="btn btn-primary" onclick="renderEmployeeDashboard(); showScreen(\'employee-dashboard\');">Back to Dashboard</button>' +
    '<button class="btn btn-outline" onclick="retryMissed()">Retry Missed</button>' +
    '<button class="btn btn-secondary" onclick="showCertificate()">View Certificate</button>';

  showScreen('results-screen');
}

// ============================================================
// ADMIN LOGIN
// ============================================================

function adminLogin() {
  const pass = $('adminPass').value;
  const db = loadDB();
  if (pass === db.meta.adminPassword) {
    $('topbarUser').innerHTML = '<div class="user-avatar">A</div><span>Admin</span>';
    $('topbarTitle').innerText = 'Admin Dashboard';
    renderSidebar('admin');
    renderAdminDashboard();
    showScreen('admin-dashboard');
  } else {
    alert('Incorrect password.');
  }
}

// ============================================================
// ADMIN DASHBOARD
// ============================================================

function renderAdminDashboard() {
  const db = loadDB();

  const totalEmployees = db.employees.length;
  const totalTests = db.tests.length;
  const totalAttempts = db.attempts.length;
  const passRate = totalAttempts
    ? Math.round((db.attempts.filter(a => a.passed).length / totalAttempts) * 100)
    : 0;

  // KPI rings
  scoreRing($('kpiEmployees'), { pct: Math.min(100, totalEmployees * 10), size: 56, stroke: 5, color: 'var(--signal)', label: totalEmployees });
  scoreRing($('kpiTests'), { pct: Math.min(100, totalTests * 20), size: 56, stroke: 5, color: 'var(--verdant)', label: totalTests });
  scoreRing($('kpiAttempts'), { pct: Math.min(100, totalAttempts * 5), size: 56, stroke: 5, color: 'var(--amber)', label: totalAttempts });
  scoreRing($('kpiPassRate'), { pct: passRate, size: 56, stroke: 5, color: passRate >= 60 ? 'var(--verdant)' : 'var(--crimson)', label: passRate + '%' });

  $('kpiEmpVal').innerText = totalEmployees;
  $('kpiTestVal').innerText = totalTests;
  $('kpiAttemptVal').innerText = totalAttempts;
  $('kpiPassVal').innerText = passRate + '%';

  // Pass rate by test chart
  if (totalTests > 0) {
    const testData = db.tests.map(t => {
      const atts = db.attempts.filter(a => a.testId === t.id);
      const rate = atts.length ? Math.round((atts.filter(a => a.passed).length / atts.length) * 100) : 0;
      return { label: t.title.length > 18 ? t.title.slice(0, 18) + '…' : t.title, value: rate };
    });
    $('adminChartContainer').innerHTML = '<h4 style="font-family:var(--font-display);font-size:15px;font-weight:600;margin-bottom:12px;">Pass Rate by Test</h4>';
    barChart($('adminChartContainer'), { data: testData, height: testData.length * 36 + 20 });
  } else {
    $('adminChartContainer').innerHTML = '<div class="empty-state">No tests created yet.</div>';
  }

  // Recent attempts
  const recent = db.attempts.slice(-5).reverse();
  $('adminRecentTable').innerHTML = recent.length
    ? recent.map(a =>
      `<tr><td>${escHtml(a.employeeName)}</td><td>${escHtml(a.testTitle)}</td><td>${a.score}/${a.total}</td><td>${a.percentage}%</td><td><span class="badge ${a.passed ? 'badge-verdant' : 'badge-crimson'}">${a.passed ? 'PASS' : 'FAIL'}</span></td></tr>`
    ).join('')
    : '<tr><td colspan="5" class="table-empty">No attempts yet.</td></tr>';
}

// ============================================================
// ADMIN TESTS
// ============================================================

function renderAdminTests() {
  const db = loadDB();
  const tests = db.tests;
  const banks = db.questionBanks;

  // Show warning if no banks exist
  const banner = $('adminTestBanner');
  if (!banks.length) {
    banner.innerHTML = '<div style="background:rgba(232,163,61,0.12);color:var(--amber);padding:12px 16px;border-radius:var(--radius-md);margin-bottom:16px;font-size:14px;">⚠️ No question banks exist. Go to <strong>Questions</strong> to create or import a bank first.</div>';
  } else {
    banner.innerHTML = '';
  }

  const container = $('adminTestList');
  if (!tests.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">📝</div><h3>No tests yet</h3><p>Create your first test using the button above.</p></div>';
    return;
  }

  container.innerHTML = tests.map(t => {
    const bank = banks.find(b => b.id === t.bank);
    const attCount = db.attempts.filter(a => a.testId === t.id).length;
    return `<tr>
      <td>${bank ? bank.icon : '📝'} ${escHtml(t.title)}</td>
      <td>${bank ? escHtml(bank.title) : 'Unknown'}</td>
      <td>${t.count}</td>
      <td>${t.timeLimit}m</td>
      <td>${t.passPercent}%</td>
      <td>${attCount}</td>
      <td>
        <button class="btn btn-sm btn-secondary" onclick="openTestEditor(${t.id})">Edit</button>
        <button class="btn btn-sm btn-danger" onclick="deleteTest(${t.id}); renderAdminTests();">Delete</button>
      </td>
    </tr>`;
  }).join('');
}

function showCreateTestModal() {
  const db = loadDB();
  const banks = db.questionBanks;

  if (!banks.length) {
    alert('No question banks available. Go to Questions page to create or import a bank first.');
    return;
  }

  let html = `<div class="modal-overlay" id="testModal" onclick="if(event.target===this)closeTestModal()">
    <div class="modal" onclick="event.stopPropagation()">
      <div class="modal-header">
        <h2>Create Test</h2>
        <button class="modal-close" onclick="closeTestModal()">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>Test Title</label>
          <input class="form-input" id="testTitle" placeholder="e.g. Excel Basics Assessment">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Question Bank</label>
            <select class="form-select" id="testBank" onchange="updateBankValidation()">
              ${banks.map(b => '<option value="' + b.id + '" data-count="' + b.questions.length + '">' + escHtml(b.title) + ' (' + b.questions.length + ' q)</option>').join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Question Count</label>
            <input class="form-input" id="testCount" type="number" value="10" min="1" oninput="updateBankValidation()">
            <small id="bankHint" style="display:block;margin-top:4px;color:var(--slate);font-size:12px;"></small>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Time Limit (minutes)</label>
            <input class="form-input" id="testTime" type="number" value="15" min="1" max="180">
          </div>
          <div class="form-group">
            <label>Pass Percentage</label>
            <input class="form-input" id="testPass" type="number" value="60" min="1" max="100">
          </div>
        </div>
        <div class="form-group">
          <label>Categories (comma-separated, leave empty for all)</label>
          <input class="form-input" id="testCats" placeholder="e.g. Core, VBA">
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeTestModal()">Cancel</button>
        <button class="btn btn-primary" onclick="createTestFromModal()">Create</button>
      </div>
    </div>
  </div>`;

  const existing = $('testModal');
  if (existing) existing.remove();
  document.body.insertAdjacentHTML('beforeend', html);
  updateBankValidation();
}

function updateBankValidation() {
  const sel = $('testBank');
  const countInput = $('testCount');
  const hint = $('bankHint');
  if (!sel || !countInput || !hint) return;
  const opt = sel.options[sel.selectedIndex];
  const available = opt ? parseInt(opt.dataset.count || 0) : 0;
  const requested = parseInt(countInput.value) || 0;
  countInput.max = available;
  if (requested > available) {
    hint.innerHTML = '<span style="color:var(--crimson);">Only ' + available + ' questions available in this bank.</span>';
  } else {
    hint.innerHTML = '<span style="color:var(--verdant);">Available: ' + available + ' questions</span>';
  }
}

function createTestFromModal() {
  const title = $('testTitle').value.trim();
  const bank = $('testBank').value;
  const count = parseInt($('testCount').value) || 10;
  const timeLimit = parseInt($('testTime').value) || 15;
  const passPercent = parseInt($('testPass').value) || 60;
  const cats = $('testCats').value.split(',').map(s => s.trim()).filter(Boolean);

  if (!title || !bank) { alert('Title and bank are required.'); return; }

  const db = loadDB();
  const bankData = db.questionBanks.find(b => b.id === bank);
  const maxCount = bankData ? bankData.questions.length : count;

  if (count > maxCount) {
    alert('Only ' + maxCount + ' questions available in "' + (bankData ? bankData.title : 'selected') + '" bank. Count adjusted to ' + maxCount + '.');
  }

  createTest({
    bank,
    title,
    categories: cats,
    count: Math.min(count, maxCount),
    timeLimit,
    passPercent,
    mode: 'timed',
    createdBy: 'admin',
  });

  closeTestModal();
  renderAdminTests();
}

function closeTestModal() {
  const el = $('testModal');
  if (el) el.remove();
}

function openTestEditor(testId) {
  const db = loadDB();
  const test = db.tests.find(t => t.id === testId);
  if (!test) return;
  const banks = db.questionBanks;

  const html = `<div class="modal-overlay" id="testModal" onclick="if(event.target===this)closeTestModal()">
    <div class="modal" onclick="event.stopPropagation()">
      <div class="modal-header">
        <h2>Edit Test</h2>
        <button class="modal-close" onclick="closeTestModal()">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>Test Title</label>
          <input class="form-input" id="testTitle" value="${escHtml(test.title)}">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Question Bank</label>
            <select class="form-select" id="testBank" onchange="updateBankValidation()">
              ${banks.map(b => '<option value="' + b.id + '" data-count="' + b.questions.length + '"' + (b.id === test.bank ? ' selected' : '') + '>' + escHtml(b.title) + ' (' + b.questions.length + ' q)</option>').join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Question Count</label>
            <input class="form-input" id="testCount" type="number" value="${test.count}" min="1" oninput="updateBankValidation()">
            <small id="bankHint" style="display:block;margin-top:4px;color:var(--slate);font-size:12px;"></small>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Time Limit (minutes)</label>
            <input class="form-input" id="testTime" type="number" value="${test.timeLimit}" min="1">
          </div>
          <div class="form-group">
            <label>Pass Percentage</label>
            <input class="form-input" id="testPass" type="number" value="${test.passPercent}" min="1">
          </div>
        </div>
        <div class="form-group">
          <label>Categories (comma separated, leave empty for all)</label>
          <input class="form-input" id="testCats" value="${(test.categories || []).join(', ')}">
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeTestModal()">Cancel</button>
        <button class="btn btn-primary" onclick="updateTestFromModal(${testId})">Save</button>
      </div>
    </div>
  </div>`;

  const existing = $('testModal');
  if (existing) existing.remove();
  document.body.insertAdjacentHTML('beforeend', html);
  updateBankValidation();
}

function updateTestFromModal(testId) {
  const title = $('testTitle').value.trim();
  const bank = $('testBank').value;
  const count = parseInt($('testCount').value) || 10;
  const timeLimit = parseInt($('testTime').value) || 15;
  const passPercent = parseInt($('testPass').value) || 60;
  const cats = $('testCats').value.split(',').map(s => s.trim()).filter(Boolean);

  if (!title) { alert('Title is required.'); return; }

  const db = loadDB();
  const bankData = db.questionBanks.find(b => b.id === bank);
  const maxCount = bankData ? bankData.questions.length : count;
  if (count > maxCount) {
    alert('Only ' + maxCount + ' questions available. Count adjusted to ' + maxCount + '.');
  }

  updateTest(testId, { title, bank, categories: cats, count: Math.min(count, maxCount), timeLimit, passPercent });
  closeTestModal();
  renderAdminTests();
}

// ============================================================
// ADMIN QUESTIONS
// ============================================================

function renderAdminQuestions() {
  const db = loadDB();
  const banks = db.questionBanks;

  // Render bank cards
  const container = $('bankListContainer');
  if (!banks.length) {
    container.innerHTML = '<div class="empty-state" style="width:100%;padding:20px;">No question banks. Create one or import a JSON file.</div>';
  } else {
    container.innerHTML = banks.map(b => `
      <div style="background:var(--card-bg);border:1px solid var(--border);border-radius:var(--radius-lg);padding:16px;min-width:200px;flex:1;">
        <div style="font-size:28px;margin-bottom:4px;">${b.icon || '📚'}</div>
        <h4 style="font-family:var(--font-display);font-weight:600;font-size:14px;">${escHtml(b.title)}</h4>
        <p style="font-size:12px;color:var(--slate);margin:4px 0 8px;">${b.questions.length} questions</p>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          <button class="btn btn-xs btn-secondary" onclick="showAddQuestionModal('${b.id}')">+ Add Q</button>
          <button class="btn btn-xs btn-danger" onclick="deleteBank('${b.id}')">Remove</button>
        </div>
      </div>
    `).join('');
  }

  // Populate bank filter
  const filter = $('adminQBankFilter');
  const prevFilter = filter.value;
  filter.innerHTML = '<option value="">All Banks</option>' + banks.map(b =>
    '<option value="' + b.id + '">' + escHtml(b.title) + '</option>'
  ).join('');
  filter.value = prevFilter || '';

  // Filter questions
  const selectedBank = filter.value;
  let allQuestions = banks.flatMap(b =>
    b.questions.map(q => ({ ...q, bankId: b.id, bankTitle: b.title, bankIcon: b.icon }))
  );
  if (selectedBank) allQuestions = allQuestions.filter(q => q.bankId === selectedBank);

  $('adminQuestionList').innerHTML = allQuestions.length
    ? allQuestions.map(q =>
      `<tr>
        <td>${q.bankIcon}</td>
        <td>${escHtml(q.q.length > 60 ? q.q.slice(0, 60) + '…' : q.q)}</td>
        <td>${escHtml(q.category)}</td>
        <td>${escHtml(q.bankTitle)}</td>
        <td>
          <button class="btn btn-xs btn-secondary" onclick="showEditQuestionModal('${q.bankId}','${q.id}')">Edit</button>
          <button class="btn btn-xs btn-danger" onclick="deleteQuestion('${q.bankId}','${q.id}')">Del</button>
        </td>
      </tr>`
    ).join('')
    : '<tr><td colspan="5" class="table-empty">No questions match the filter.</td></tr>';
}

// ============================================================
// CREATE BANK
// ============================================================

function showCreateBankModal() {
  const html = `<div class="modal-overlay" id="bankModal" onclick="if(event.target===this)closeBankModal()">
    <div class="modal" onclick="event.stopPropagation()" style="max-width:450px;">
      <div class="modal-header">
        <h2>Create Question Bank</h2>
        <button class="modal-close" onclick="closeBankModal()">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>Bank ID (unique, no spaces)</label>
          <input class="form-input" id="newBankId" placeholder="e.g. python">
        </div>
        <div class="form-group">
          <label>Title</label>
          <input class="form-input" id="newBankTitle" placeholder="e.g. Python">
        </div>
        <div class="form-group">
          <label>Icon (emoji)</label>
          <input class="form-input" id="newBankIcon" placeholder="e.g. 🐍" value="📚">
        </div>
        <div class="form-group">
          <label>Description (optional)</label>
          <input class="form-input" id="newBankDesc" placeholder="e.g. Python programming questions">
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeBankModal()">Cancel</button>
        <button class="btn btn-primary" onclick="createBankFromModal()">Create</button>
      </div>
    </div>
  </div>`;

  const existing = $('bankModal');
  if (existing) existing.remove();
  document.body.insertAdjacentHTML('beforeend', html);
}

function closeBankModal() {
  const el = $('bankModal');
  if (el) el.remove();
}

function createBankFromModal() {
  const id = $('newBankId').value.trim();
  const title = $('newBankTitle').value.trim();
  const icon = $('newBankIcon').value.trim() || '📚';
  const desc = $('newBankDesc').value.trim();
  if (!id || !title) { alert('Bank ID and title are required.'); return; }
  if (!/^[a-z0-9_-]+$/.test(id)) { alert('Bank ID must be lowercase alphanumeric (hyphens/underscores ok).'); return; }

  const db = loadDB();
  if (db.questionBanks.find(b => b.id === id)) { alert('Bank ID "' + id + '" already exists.'); return; }

  db.questionBanks.push({ id, title, icon, description: desc, questions: [] });
  saveDB(db);
  closeBankModal();
  renderAdminQuestions();
  alert('Bank "' + title + '" created.');
}

// ============================================================
// ADD / EDIT / DELETE QUESTIONS
// ============================================================

function showAddQuestionModal(bankId) {
  const db = loadDB();
  const banks = db.questionBanks;
  if (!banks.length) { alert('Create a question bank first.'); return; }

  const html = `<div class="modal-overlay" id="qModal" onclick="if(event.target===this)closeQModal()">
    <div class="modal" onclick="event.stopPropagation()" style="max-width:600px;">
      <div class="modal-header">
        <h2>Add Question</h2>
        <button class="modal-close" onclick="closeQModal()">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>Bank</label>
          <select class="form-select" id="mqBank">${banks.map(b => '<option value="' + b.id + '"' + (b.id === bankId ? ' selected' : '') + '>' + escHtml(b.title) + '</option>').join('')}</select>
        </div>
        <div class="form-group">
          <label>Category</label>
          <input class="form-input" id="mqCategory" placeholder="e.g. Basics">
        </div>
        <div class="form-group">
          <label>Question</label>
          <textarea class="form-textarea" id="mqText" placeholder="Enter question text" rows="3"></textarea>
        </div>
        <div class="form-group">
          <label>Option A</label>
          <input class="form-input" id="mqOpt0" placeholder="Option A">
        </div>
        <div class="form-group">
          <label>Option B</label>
          <input class="form-input" id="mqOpt1" placeholder="Option B">
        </div>
        <div class="form-group">
          <label>Option C</label>
          <input class="form-input" id="mqOpt2" placeholder="Option C">
        </div>
        <div class="form-group">
          <label>Option D</label>
          <input class="form-input" id="mqOpt3" placeholder="Option D">
        </div>
        <div class="form-group">
          <label>Correct Answer</label>
          <select class="form-select" id="mqCorrect">
            <option value="0">A</option>
            <option value="1">B</option>
            <option value="2">C</option>
            <option value="3">D</option>
          </select>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeQModal()">Cancel</button>
        <button class="btn btn-primary" onclick="addQuestionToBank()">Add Question</button>
      </div>
    </div>
  </div>`;

  const existing = $('qModal');
  if (existing) existing.remove();
  document.body.insertAdjacentHTML('beforeend', html);
}

function closeQModal() {
  const el = $('qModal');
  if (el) el.remove();
}

function addQuestionToBank() {
  const bankId = $('mqBank').value;
  const category = $('mqCategory').value.trim();
  const q = $('mqText').value.trim();
  const opts = [0,1,2,3].map(i => $('mqOpt' + i).value.trim());
  const correct = parseInt($('mqCorrect').value);

  if (!q || !category || opts.some(o => !o)) { alert('All fields are required.'); return; }

  const db = loadDB();
  const bank = db.questionBanks.find(b => b.id === bankId);
  if (!bank) { alert('Bank not found.'); return; }

  const num = bank.questions.length + 1;
  const id = bankId.slice(0, 3) + '-' + String(num).padStart(3, '0');
  bank.questions.push({ id, category, q, o: opts, a: correct });
  saveDB(db);
  closeQModal();
  renderAdminQuestions();
}

function showEditQuestionModal(bankId, questionId) {
  const db = loadDB();
  const bank = db.questionBanks.find(b => b.id === bankId);
  if (!bank) return;
  const q = bank.questions.find(x => x.id === questionId);
  if (!q) return;
  const banks = db.questionBanks;

  const html = `<div class="modal-overlay" id="qModal" onclick="if(event.target===this)closeQModal()">
    <div class="modal" onclick="event.stopPropagation()" style="max-width:600px;">
      <div class="modal-header">
        <h2>Edit Question</h2>
        <button class="modal-close" onclick="closeQModal()">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>Bank</label>
          <select class="form-select" id="mqBank">${banks.map(b => '<option value="' + b.id + '"' + (b.id === bankId ? ' selected' : '') + '>' + escHtml(b.title) + '</option>').join('')}</select>
        </div>
        <div class="form-group">
          <label>Category</label>
          <input class="form-input" id="mqCategory" value="${escHtml(q.category)}">
        </div>
        <div class="form-group">
          <label>Question</label>
          <textarea class="form-textarea" id="mqText" rows="3">${escHtml(q.q)}</textarea>
        </div>
        ${[0,1,2,3].map(i => `
          <div class="form-group">
            <label>Option ${String.fromCharCode(65 + i)}</label>
            <input class="form-input" id="mqOpt${i}" value="${escHtml(q.o[i] || '')}">
          </div>
        `).join('')}
        <div class="form-group">
          <label>Correct Answer</label>
          <select class="form-select" id="mqCorrect">
            <option value="0"${q.a === 0 ? ' selected' : ''}>A</option>
            <option value="1"${q.a === 1 ? ' selected' : ''}>B</option>
            <option value="2"${q.a === 2 ? ' selected' : ''}>C</option>
            <option value="3"${q.a === 3 ? ' selected' : ''}>D</option>
          </select>
        </div>
        <input type="hidden" id="editQuestionId" value="${q.id}">
        <input type="hidden" id="editBankId" value="${bankId}">
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeQModal()">Cancel</button>
        <button class="btn btn-primary" onclick="updateQuestionInBank()">Save</button>
      </div>
    </div>
  </div>`;

  const existing = $('qModal');
  if (existing) existing.remove();
  document.body.insertAdjacentHTML('beforeend', html);
}

function updateQuestionInBank() {
  const bankId = $('editBankId').value;
  const questionId = $('editQuestionId').value;
  const category = $('mqCategory').value.trim();
  const q = $('mqText').value.trim();
  const opts = [0,1,2,3].map(i => $('mqOpt' + i).value.trim());
  const correct = parseInt($('mqCorrect').value);

  if (!q || !category || opts.some(o => !o)) { alert('All fields are required.'); return; }

  const db = loadDB();
  const bank = db.questionBanks.find(b => b.id === bankId);
  if (!bank) { alert('Bank not found.'); return; }
  const question = bank.questions.find(x => x.id === questionId);
  if (!question) { alert('Question not found.'); return; }

  question.category = category;
  question.q = q;
  question.o = opts;
  question.a = correct;
  saveDB(db);
  closeQModal();
  renderAdminQuestions();
}

function deleteQuestion(bankId, questionId) {
  if (!confirm('Delete this question?')) return;
  const db = loadDB();
  const bank = db.questionBanks.find(b => b.id === bankId);
  if (!bank) return;
  bank.questions = bank.questions.filter(q => q.id !== questionId);
  saveDB(db);
  renderAdminQuestions();
}

function deleteBank(bankId) {
  const db = loadDB();
  const bank = db.questionBanks.find(b => b.id === bankId);
  if (!bank) return;
  const testCount = db.tests.filter(t => t.bank === bankId).length;
  let msg = 'Delete "' + bank.title + '" (' + bank.questions.length + ' questions)?';
  if (testCount > 0) msg += ' ' + testCount + ' test(s) use this bank and will be affected.';
  if (!confirm(msg)) return;
  db.questionBanks = db.questionBanks.filter(b => b.id !== bankId);
  saveDB(db);
  renderAdminQuestions();
  renderAdminTests();
}

function importBankFile() {
  $('bankFileInput').click();
}

function handleBankImport(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const bank = JSON.parse(e.target.result);
      if (!bank.id || !bank.title || !Array.isArray(bank.questions)) {
        alert('Invalid bank format. Expected: { id, title, questions: [...] }');
        return;
      }
      const db = loadDB();
      if (db.questionBanks.find(b => b.id === bank.id)) {
        if (!confirm('Bank "' + bank.title + '" already exists. Replace it?')) return;
        db.questionBanks = db.questionBanks.filter(b => b.id !== bank.id);
      }
      db.questionBanks.push(bank);
      saveDB(db);
      renderAdminQuestions();
      renderAdminTests();
      alert('Imported "' + bank.title + '" (' + bank.questions.length + ' questions).');
    } catch (err) {
      alert('Failed to parse JSON: ' + err.message);
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

// ============================================================
// ADMIN RESULTS
// ============================================================

function renderAdminResults() {
  const db = loadDB();
  const attempts = db.attempts.sort((a, b) => b.timestamp - a.timestamp);
  const testFilter = $('adminResultTestFilter');
  const prevVal = testFilter.value;

  // Populate filter
  const tests = db.tests;
  testFilter.innerHTML = '<option value="">All Tests</option>' + tests.map(t =>
    '<option value="' + t.id + '">' + escHtml(t.title) + '</option>'
  ).join('');
  testFilter.value = prevVal || '';

  const filtered = testFilter.value
    ? attempts.filter(a => a.testId === parseInt(testFilter.value))
    : attempts;

  $('adminResultTableBody').innerHTML = filtered.length
    ? filtered.map(a => {
      const d = new Date(a.timestamp);
      return `<tr>
        <td>${escHtml(a.employeeName)}</td>
        <td>${escHtml(a.testTitle)}</td>
        <td>${d.toLocaleDateString()}</td>
        <td>${a.score}/${a.total}</td>
        <td>${a.percentage}%</td>
        <td>${fmtTime(a.timeTaken)}</td>
        <td><span class="badge ${a.passed ? 'badge-verdant' : 'badge-crimson'}">${a.passed ? 'PASS' : 'FAIL'}</span></td>
        <td><button class="btn btn-xs btn-secondary" onclick='viewAdminAttempt(${JSON.stringify(a).replace(/'/g, "&#39;")})'>View</button></td>
      </tr>`;
    }).join('')
    : '<tr><td colspan="8" class="table-empty">No results found.</td></tr>';

  $('adminResultCount').innerText = filtered.length + ' attempt(s)';
}

function filterAdminResults() {
  renderAdminResults();
}

function viewAdminAttempt(attempt) {
  quizState.lastAttempt = attempt;

  const ringEl = $('resultRing');
  ringEl.innerHTML = '';
  const color = attempt.passed ? 'var(--verdant)' : 'var(--crimson)';
  scoreRing(ringEl, { pct: attempt.percentage, size: 140, stroke: 10, color: color, label: attempt.percentage + '%' });

  $('resultBanner').innerText = attempt.passed ? 'Passed!' : 'Did Not Pass';
  $('resultBanner').style.color = attempt.passed ? 'var(--verdant)' : 'var(--crimson)';
  $('resultSub').innerHTML = `Scored <strong>${attempt.score}/${attempt.total}</strong> on ${escHtml(attempt.testTitle)} by ${escHtml(attempt.employeeName)}`;

  $('rScore').innerText = `${attempt.score}/${attempt.total}`;
  $('rTime').innerText = fmtTime(attempt.timeTaken);
  $('rAccuracy').innerText = attempt.percentage + '%';
  $('rStatus').innerText = attempt.passed ? 'PASS' : 'FAIL';
  $('rStatus').style.color = attempt.passed ? 'var(--verdant)' : 'var(--crimson)';

  const cats = {};
  (attempt.answers || []).forEach(a => {
    if (!cats[a.category]) cats[a.category] = { correct: 0, total: 0 };
    cats[a.category].total++;
    if (a.isCorrect) cats[a.category].correct++;
  });
  const catKeys = Object.keys(cats);
  const catData = catKeys.map(c => ({
    label: c,
    value: cats[c].total > 0 ? Math.round((cats[c].correct / cats[c].total) * 100) : 0
  }));
  const colors = ['#2F5DE3', '#1F9D6B', '#E8A33D', '#D64545', '#8B5CF6', '#0EA5E9'];
  catData.forEach((d, i) => d.color = colors[i % colors.length]);

  $('catBreakdown').innerHTML = catData.length
    ? '<h4 style="font-family:var(--font-display);font-size:15px;font-weight:600;margin-bottom:12px;">Category Breakdown</h4>'
    : '';
  if (catData.length) {
    barChart($('catBreakdown'), { data: catData, height: catData.length * 36 + 20 });
  }

  $('reviewList').innerHTML = (attempt.answers || []).map((a, i) => {
    const cls = a.isCorrect ? 'correct' : 'wrong';
    return `<div class="review-item ${cls}">
      <div class="review-q">${i + 1}. ${escHtml(a.question)}</div>
      <div class="review-a">Your answer: <span class="${a.isCorrect ? 'correct-text' : 'wrong-text'}">${escHtml(a.options[a.selected])}</span>
      ${!a.isCorrect ? ` · Correct: <span class="correct-text">${escHtml(a.correctText)}</span>` : ''}</div>
      <div class="review-cat">${a.category}</div>
    </div>`;
  }).join('');

  // Change back behavior
  $('resultBackContainer').innerHTML = '<button class="btn btn-secondary" onclick="renderAdminResults(); showScreen(\'admin-results\')">Back to Results</button>';

  showScreen('results-screen');
}

function exportCSV() {
  const db = loadDB();
  const attempts = db.attempts.sort((a, b) => b.timestamp - a.timestamp);
  if (!attempts.length) { alert('No data to export.'); return; }

  const rows = [['Name','Email','Department','Test','Date','Score','Total','Percentage','Passed','Time (s)']];
  attempts.forEach(a => {
    rows.push([
      a.employeeName, a.employeeEmail, a.employeeDept || '',
      a.testTitle, new Date(a.timestamp).toISOString(),
      a.score, a.total, a.percentage, a.passed ? 'Yes' : 'No', a.timeTaken
    ]);
  });

  const csv = rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'testhub-results-' + new Date().toISOString().slice(0, 10) + '.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// ============================================================
// ADMIN USERS
// ============================================================

function renderAdminUsers() {
  const db = loadDB();
  const employees = db.employees;

  $('adminUserTableBody').innerHTML = employees.length
    ? employees.map(e => {
      const atts = db.attempts.filter(a => a.employeeId === e.id);
      const avg = atts.length ? Math.round(atts.reduce((s, a) => s + a.percentage, 0) / atts.length) : 0;
      const best = atts.length ? Math.max(...atts.map(a => a.percentage)) : 0;
      return `<tr>
        <td>${escHtml(e.name)}</td>
        <td>${escHtml(e.email)}</td>
        <td>${escHtml(e.dept || '-')}</td>
        <td>${atts.length}</td>
        <td>${avg}%</td>
        <td>${best}%</td>
        <td>${new Date(e.joined).toLocaleDateString()}</td>
      </tr>`;
    }).join('')
    : '<tr><td colspan="7" class="table-empty">No employees registered yet.</td></tr>';
}

// ============================================================
// ADMIN SETTINGS
// ============================================================

function renderAdminSettings() {
  const db = loadDB();
  $('settingsOrgName').value = db.meta.orgName || '';
}

function saveSettings() {
  const db = loadDB();
  db.meta.orgName = $('settingsOrgName').value.trim() || 'My Organization';
  const newPass = $('settingsNewPass').value;
  if (newPass) {
    db.meta.adminPassword = newPass;
    $('settingsNewPass').value = '';
  }
  saveDB(db);
  alert('Settings saved.');
}

function resetAppData() {
  if (!confirm('This will permanently delete ALL data (tests, employees, results). Are you sure?')) return;
  if (!confirm('Really? This cannot be undone.')) return;
  localStorage.removeItem(DB_KEY);
  alert('All data reset. Reloading...');
  location.reload();
}

// ============================================================
// KEYBOARD SHORTCUTS
// ============================================================

document.addEventListener('keydown', (e) => {
  if (!$('quiz-screen').classList.contains('active')) return;
  if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); nextQuestion(); }
  if (e.key === 'ArrowLeft') { e.preventDefault(); prevQuestion(); }
  if (e.key >= '1' && e.key <= '4') { selectOption(parseInt(e.key) - 1); }
  if (e.key === 'Enter') { submitQuiz(); }
});

// ============================================================
// INIT
// ============================================================

function init() {
  seedQuestionBanks();
  seedDefaultTests();
  renderSidebar('none');
  $('topbarTitle').innerText = 'TestHub';
  showScreen('role-select');
}

init();
