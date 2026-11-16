'use strict';

// Online text source + optional remote score sync.
// Scores are always saved locally. Set scoreEndpoint to your own POST API to sync remotely.
const API_CONFIG = {
  quoteUrl: 'https://dummyjson.com/quotes/random',
  scoreEndpoint: ''
};
const passages = {
  easy: [
    'Small steps can lead to meaningful change. Take your time, stay curious, and enjoy learning something new every day.',
    'A good day begins with a clear mind and a simple plan. Focus on one thing, do it well, and keep moving forward.',
    'The best way to learn is to practice a little each day. Be patient with yourself and celebrate every small win.'
  ],
  medium: [
    'Great work is rarely the result of one perfect moment. It grows through steady practice, thoughtful decisions, and the willingness to try again.',
    'Creativity begins when we give ourselves room to explore. Ask better questions, notice the details, and stay open to unexpected ideas.',
    'Technology changes quickly, but clear communication remains valuable. Strong ideas become useful when people can understand and share them.'
  ],
  hard: [
    'Well-designed systems balance speed, clarity, and reliability; the smallest interaction can influence how confidently someone uses a product.',
    'A thoughtful developer does more than write instructions for a computer: they solve problems, consider edge cases, and make complexity feel simple.',
    'Precision matters: punctuation, numbers (like 2026), and symbols can change meaning. Slow down, verify each character, and avoid unnecessary shortcuts.'
  ]
};
const HISTORY_KEY = 'keyflow-history-v1';
const BEST_KEY = 'keyflow-best-v1';
const $ = s => document.querySelector(s);
const el = {
  input: $('#typing-input'), passage: $('#passage'), wpm: $('#wpm'), accuracy: $('#accuracy'),
  time: $('#time'), chars: $('#chars'), progress: $('#progress'), hint: $('#hint'), count: $('#count'),
  timerState: $('#timer-state'), source: $('#source'), finish: $('#finish'), results: $('#results'),
  restart: $('#restart'), newText: $('#new-text'), tryAgain: $('#try-again'), difficulty: $('#difficulty'),
  resultWpm: $('#result-wpm'), resultAccuracy: $('#result-accuracy'), resultCorrect: $('#result-correct'),
  resultErrors: $('#result-errors'), message: $('#message'), saveNote: $('#save-note'),
  best: $('#best'), bestDetail: $('#best-detail'), average: $('#average'), total: $('#total'),
  historyBody: $('#history-body'), clearHistory: $('#clear-history'), sessionId: $('#session-id')
};
let duration = 15, timeLeft = 15, timer = null, startedAt = null;
let running = false, finished = false, passage = '';

function readHistory() {
  try { const value = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); return Array.isArray(value) ? value : []; }
  catch { return []; }
}
function writeHistory(history) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 30))); return true; }
  catch { toast('Browser storage is unavailable.'); return false; }
}
function readBest() {
  try { return JSON.parse(localStorage.getItem(BEST_KEY) || 'null'); } catch { return null; }
}
function toast(message) {
  const box = $('#toast'); box.textContent = message; box.classList.add('show');
  clearTimeout(toast.id); toast.id = setTimeout(() => box.classList.remove('show'), 2300);
}
function localPassage() {
  const list = passages[el.difficulty.value];
  return list[Math.floor(Math.random() * list.length)];
}
async function onlinePassage() {
  if (!navigator.onLine) throw new Error('offline');
  const response = await fetch(API_CONFIG.quoteUrl);
  if (!response.ok) throw new Error('API error');
  const data = await response.json();
  if (typeof data.quote !== 'string' || !data.quote.trim()) throw new Error('No quote');
  return data.quote.trim();
}
function stats() {
  const typed = el.input.value;
  let correct = 0;
  for (let i = 0; i < typed.length; i++) if (typed[i] === passage[i]) correct++;
  const errors = typed.length - correct;
  const seconds = startedAt ? Math.max((Date.now() - startedAt) / 1000, 1) : 0;
  const wpm = seconds ? Math.round((correct / 5) / (seconds / 60)) : 0;
  return { typed: typed.length, correct, errors, wpm, accuracy: typed.length ? Math.round(correct / typed.length * 100) : 100 };
}
function renderPassage() {
  const typed = el.input.value;
  const fragment = document.createDocumentFragment();
  [...passage].forEach((char, index) => {
    const span = document.createElement('span'); span.textContent = char;
    if (index < typed.length) span.className = typed[index] === char ? 'correct' : 'wrong';
    else if (index === typed.length && !finished) span.className = 'current';
    fragment.appendChild(span);
  });
  el.passage.replaceChildren(fragment);
}
function update() {
  const s = stats();
  el.wpm.textContent = s.wpm;
  el.accuracy.innerHTML = `${s.accuracy}<span>%</span>`;
  el.chars.innerHTML = `${s.correct} <small>/ ${s.typed}</small>`;
  el.count.textContent = `${s.typed} characters`;
  el.progress.style.width = `${Math.min(100, s.typed / Math.max(passage.length, 1) * 100)}%`;
  renderPassage();
}
function timerDisplay() { el.time.innerHTML = `${timeLeft}<span>s</span>`; }
function start() {
  if (running || finished) return;
  running = true; startedAt = Date.now(); el.timerState.textContent = 'timer is running';
  el.hint.textContent = 'Keep going — you are doing great.'; el.finish.disabled = false;
  timer = setInterval(() => {
    timeLeft = Math.max(0, timeLeft - 1); timerDisplay();
    if (timeLeft === 0) complete();
  }, 1000);
}
function reset(keepPassage = true) {
  clearInterval(timer); timer = null; running = false; finished = false; startedAt = null;
  timeLeft = duration; el.input.value = ''; el.input.disabled = false; el.finish.disabled = true;
  el.results.classList.add('hidden'); el.timerState.textContent = 'ready when you are';
  el.hint.textContent = 'Click here or start typing to begin.'; el.progress.style.width = '0%';
  if (!keepPassage || !passage) passage = localPassage();
  timerDisplay(); update();
}
function rank(wpm, accuracy) {
  if (wpm >= 80 && accuracy >= 97) return 'Outstanding rhythm — your accuracy and speed are excellent.';
  if (wpm >= 60 && accuracy >= 94) return 'Fantastic work — you are building a strong typing rhythm.';
  if (wpm >= 40 && accuracy >= 90) return 'Great progress — keep practicing to build consistency.';
  if (accuracy < 85) return 'Try slowing down slightly. Accuracy is the foundation of speed.';
  return 'A great start — consistency is the key to improvement.';
}
async function syncScore(result) {
  if (!API_CONFIG.scoreEndpoint) return;
  const response = await fetch(API_CONFIG.scoreEndpoint, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(result)
  });
  if (!response.ok) throw new Error('Remote sync failed');
}
async function complete() {
  if (finished || !startedAt) return;
  finished = true; running = false; clearInterval(timer); timer = null;
  el.input.disabled = true; el.finish.disabled = true; el.timerState.textContent = 'session complete';
  el.hint.textContent = 'Session complete. Review your results below.';
  const s = stats();
  const result = {
    id: `KF-${Date.now()}`, date: new Date().toISOString(), duration,
    difficulty: el.difficulty.value, wpm: s.wpm, accuracy: s.accuracy, correct: s.correct, errors: s.errors
  };
  const history = readHistory(); history.unshift(result);
  const saved = writeHistory(history);
  const best = readBest();
  if (!best || result.wpm > best.wpm) {
    try { localStorage.setItem(BEST_KEY, JSON.stringify(result)); } catch { }
  }
  el.resultWpm.textContent = result.wpm; el.resultAccuracy.textContent = `${result.accuracy}%`;
  el.resultCorrect.textContent = result.correct; el.resultErrors.textContent = result.errors;
  el.message.textContent = rank(result.wpm, result.accuracy);
  el.saveNote.textContent = saved ? 'Your result has been saved on this device.' : 'Could not save this result locally.';
  el.results.classList.remove('hidden'); dashboard();
  el.results.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  if (API_CONFIG.scoreEndpoint) {
    try { await syncScore(result); el.saveNote.textContent = 'Saved locally and synced to your configured score API.'; }
    catch { el.saveNote.textContent = 'Saved locally. Remote score sync was unavailable.'; }
  }
}
function dashboard() {
  const history = readHistory(), best = readBest(), recent = history.slice(0, 10);
  el.total.textContent = history.length;
  el.best.textContent = best ? best.wpm : '—';
  el.bestDetail.textContent = best ? `${best.accuracy}% accuracy · ${new Date(best.date).toLocaleDateString()}` : 'Complete a test to set your record.';
  el.average.textContent = recent.length ? Math.round(recent.reduce((n, x) => n + x.wpm, 0) / recent.length) : '—';
  const bars = [...$('#bars').children], max = Math.max(1, ...recent.map(x => x.wpm));
  bars.forEach((bar, i) => { const item = recent[recent.length - 1 - i]; bar.style.height = item ? `${Math.max(12, item.wpm / max * 100)}%` : '8%'; bar.style.opacity = item ? '1' : '.25'; });
  if (!history.length) {
    el.historyBody.innerHTML = '<tr><td colspan="5" class="empty">No sessions yet. Complete your first test to see your progress here.</td></tr>';
  } else {
    el.historyBody.innerHTML = history.slice(0, 8).map((x, i) => {
      const date = new Date(x.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      return `<tr><td>SESSION ${String(history.length - i).padStart(2, '0')}</td><td>${date}</td><td>${x.duration}s</td><td>${x.wpm}</td><td>${x.accuracy}%</td></tr>`;
    }).join('');
  }
}
function updateSession() { el.sessionId.textContent = `SESSION ${String(readHistory().length + 1).padStart(2, '0')}`; }

$('#durations').addEventListener('click', e => {
  const button = e.target.closest('[data-time]');
  if (!button || running) return;
  duration = Number(button.dataset.time);
  $('#durations').querySelectorAll('button').forEach(b => b.classList.toggle('selected', b === button));
  reset();
});
el.difficulty.addEventListener('change', () => {
  if (running) { toast('Restart the test before changing difficulty.'); return; }
  el.source.textContent = '● Practice library'; passage = localPassage(); reset();
});
el.input.addEventListener('input', () => {
  if (finished) return;
  if (!running && el.input.value.length) start();
  if (el.input.value.length > passage.length) el.input.value = el.input.value.slice(0, passage.length);
  update();
  if (el.input.value.length >= passage.length) complete();
});
$('#typing-box').addEventListener('click', () => { if (!finished) el.input.focus(); });
el.restart.addEventListener('click', () => { reset(); updateSession(); toast('Test restarted.'); });
el.tryAgain.addEventListener('click', () => { reset(); updateSession(); $('#typing-box').scrollIntoView({ behavior: 'smooth', block: 'center' }); });
el.finish.addEventListener('click', complete);
el.newText.addEventListener('click', async () => {
  el.newText.disabled = true; el.newText.textContent = 'Loading…';
  try { passage = await onlinePassage(); el.source.textContent = '● Online quote API'; toast('A fresh online passage is ready.'); }
  catch { passage = localPassage(); el.source.textContent = '● Practice library'; toast('Online text unavailable — using an offline passage.'); }
  finally { el.newText.disabled = false; el.newText.innerHTML = '↻ <span>New text</span>'; reset(); }
});
el.clearHistory.addEventListener('click', () => {
  if (!readHistory().length && !readBest()) { toast('There is no saved history to clear.'); return; }
  if (!confirm('Clear all saved typing sessions and your personal best on this device?')) return;
  localStorage.removeItem(HISTORY_KEY); localStorage.removeItem(BEST_KEY); dashboard(); updateSession(); toast('Local history cleared.');
});
window.addEventListener('online', () => toast('You are back online.'));
window.addEventListener('offline', () => toast('Offline mode: practice passages are still available.'));
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !finished) el.input.blur();
  if (e.key === 'Tab' && document.activeElement === el.input) return;
});
function init() { passage = localPassage(); timerDisplay(); update(); dashboard(); updateSession(); }
init();
