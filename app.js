// ===================== DATA =====================
const STORAGE_KEY = 'guclenme_planim_v1';

function loadData() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
      restSeconds: 60,
      workouts: [],      // { date, push: [reps], sit: [], pull: [] }
      maxTests: [],      // { date, push, sit, pull, runSeconds }
      runs: []           // { date, distance, timeSeconds, path: [[lat,lng],...] }
    };
  } catch {
    return { restSeconds: 60, workouts: [], maxTests: [], runs: [] };
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

let data = loadData();

// ===================== UI HELPERS =====================
function $(id) { return document.getElementById(id); }

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function formatPace(secondsPerKm) {
  if (!secondsPerKm || !isFinite(secondsPerKm)) return '--:--';
  return formatTime(secondsPerKm);
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function setTodayDate() {
  const d = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  $('today-date').textContent = d.toLocaleDateString('tr-TR', options);
}

// ===================== TABS =====================
document.querySelectorAll('nav button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('main > section').forEach(s => s.classList.add('hidden'));
    $(`tab-${btn.dataset.tab}`).classList.remove('hidden');
    if (btn.dataset.tab === 'progress') renderCharts();
    if (btn.dataset.tab === 'history') renderHistory();
    if (btn.dataset.tab === 'max') renderMaxHistory();
  });
});

// ===================== REST SETTINGS =====================
function saveRestSeconds() {
  const val = parseInt($('rest-seconds').value) || 60;
  data.restSeconds = Math.max(30, Math.min(180, val));
  $('rest-seconds').value = data.restSeconds;
  saveData(data);
  alert('Dinlenme süresi kaydedildi: ' + data.restSeconds + ' sn');
}

$('rest-seconds').value = data.restSeconds || 60;

// ===================== EXERCISE STATE =====================
const exercises = {
  push: { name: 'Şınav', set: 1, timer: null, seconds: 0, isResting: false, logs: [] },
  sit:  { name: 'Mekik', set: 1, timer: null, seconds: 0, isResting: false, logs: [] },
  pull: { name: 'Barfiks', set: 1, timer: null, seconds: 0, isResting: false, logs: [] }
};

function updateTimerDisplay(ex) {
  const el = $(`${ex}-timer`);
  el.textContent = formatTime(exercises[ex].seconds);
  el.classList.toggle('rest', exercises[ex].isResting);
}

function startSet(ex) {
  const e = exercises[ex];
  if (e.timer) return;

  e.isResting = false;
  e.seconds = 0;
  $(`${ex}-start`).classList.add('hidden');
  $(`${ex}-finish`).classList.remove('hidden');
  $(`${ex}-msg`).textContent = 'Set devam ediyor...';
  updateTimerDisplay(ex);

  e.timer = setInterval(() => {
    e.seconds++;
    updateTimerDisplay(ex);
  }, 1000);
}

function finishSet(ex) {
  const e = exercises[ex];
  if (e.timer) {
    clearInterval(e.timer);
    e.timer = null;
  }

  // Start rest
  e.isResting = true;
  e.seconds = data.restSeconds || 60;
  $(`${ex}-finish`).classList.add('hidden');
  $(`${ex}-msg`).textContent = `Dinlen! ${e.seconds} sn`;
  updateTimerDisplay(ex);

  // Optional vibration / beep
  if (navigator.vibrate) navigator.vibrate(200);

  e.timer = setInterval(() => {
    e.seconds--;
    updateTimerDisplay(ex);
    $(`${ex}-msg`).textContent = e.seconds > 0 ? `Dinlen! ${e.seconds} sn` : 'Dinlenme bitti!';

    if (e.seconds <= 0) {
      clearInterval(e.timer);
      e.timer = null;
      e.isResting = false;
      e.set++;
      $(`${ex}-set`).textContent = e.set;
      $(`${ex}-start`).classList.remove('hidden');
      $(`${ex}-msg`).textContent = `Set ${e.set} için hazırsın`;
      updateTimerDisplay(ex);
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      // Simple beep using Web Audio
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        osc.frequency.value = 880;
        osc.connect(ctx.destination);
        osc.start();
        setTimeout(() => osc.stop(), 150);
      } catch {}
    }
  }, 1000);
}

function resetExercise(ex) {
  const e = exercises[ex];
  if (e.timer) clearInterval(e.timer);
  e.timer = null;
  e.set = 1;
  e.seconds = 0;
  e.isResting = false;
  e.logs = [];
  $(`${ex}-set`).textContent = 1;
  $(`${ex}-start`).classList.remove('hidden');
  $(`${ex}-finish`).classList.add('hidden');
  $(`${ex}-msg`).textContent = 'Hazırsan başla';
  $(`${ex}-log`).textContent = '';
  updateTimerDisplay(ex);
}

function logWorkoutReps(ex) {
  const reps = prompt(`${exercises[ex].name} için kaç tekrar yaptın?`);
  if (reps === null) return;
  const n = parseInt(reps);
  if (isNaN(n) || n < 0) {
    alert('Geçerli bir sayı gir');
    return;
  }
  exercises[ex].logs.push(n);
  $(`${ex}-log`).textContent = 'Kaydedilen setler: ' + exercises[ex].logs.join(', ');
}

function completeWorkoutDay() {
  const entry = {
    date: todayStr(),
    push: exercises.push.logs.slice(),
    sit: exercises.sit.logs.slice(),
    pull: exercises.pull.logs.slice()
  };
  // Replace if same day exists
  data.workouts = data.workouts.filter(w => w.date !== entry.date);
  data.workouts.push(entry);
  data.workouts.sort((a,b) => a.date.localeCompare(b.date));
  saveData(data);
  alert('Bugünün antrenmanı kaydedildi!');
}

// ===================== MAX TEST =====================
function saveMaxTest() {
  const push = parseInt($('max-push').value) || 0;
  const sit  = parseInt($('max-sit').value) || 0;
  const pull = parseInt($('max-pull').value) || 0;
  const min  = parseInt($('max-run-min').value) || 0;
  const sec  = parseInt($('max-run-sec').value) || 0;
  const runSeconds = min * 60 + sec;

  if (push === 0 && sit === 0 && pull === 0 && runSeconds === 0) {
    alert('En az bir değer gir');
    return;
  }

  const entry = {
    date: todayStr(),
    push, sit, pull, runSeconds
  };
  data.maxTests = data.maxTests.filter(m => m.date !== entry.date);
  data.maxTests.push(entry);
  data.maxTests.sort((a,b) => a.date.localeCompare(b.date));
  saveData(data);
  alert('Max test kaydedildi!');
  renderMaxHistory();
  // clear inputs
  ['max-push','max-sit','max-pull','max-run-min','max-run-sec'].forEach(id => $(id).value = '');
}

function renderMaxHistory() {
  const container = $('max-history');
  if (!data.maxTests.length) {
    container.innerHTML = '<p style="color:var(--muted)">Henüz kayıt yok</p>';
    return;
  }
  container.innerHTML = data.maxTests.slice().reverse().map(m => {
    const runStr = m.runSeconds ? formatTime(m.runSeconds) : '-';
    return `<div class="history-item">
      <span>${m.date}</span>
      <span>Ş:${m.push} M:${m.sit} B:${m.pull} 🏃${runStr}</span>
    </div>`;
  }).join('');
}

// ===================== RUN / GPS =====================
let watchId = null;
let runActive = false;
let runPaused = false;
let runStartTime = null;
let runElapsed = 0; // seconds while running
let runPath = [];
let lastPos = null;
let totalDistance = 0; // meters
let lastGPX = null;

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = x => x * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function updateRunUI() {
  const km = totalDistance / 1000;
  $('run-distance').textContent = km.toFixed(2);
  $('run-remaining').textContent = Math.max(0, 3 - km).toFixed(2);
  $('run-time').textContent = formatTime(runElapsed);
  const pace = km > 0.05 ? runElapsed / km : null;
  $('run-pace').textContent = formatPace(pace);

  if (km >= 3 && runActive) {
    $('run-msg').textContent = '🎉 3000 m tamamlandı!';
    if (navigator.vibrate) navigator.vibrate([200,100,200,100,200]);
  }
}

function startRun() {
  if (!navigator.geolocation) {
    alert('Bu cihaz GPS desteklemiyor');
    return;
  }

  runActive = true;
  runPaused = false;
  runStartTime = Date.now();
  runElapsed = 0;
  runPath = [];
  totalDistance = 0;
  lastPos = null;
  lastGPX = null;

  $('run-start-btn').classList.add('hidden');
  $('run-pause-btn').classList.remove('hidden');
  $('run-stop-btn').classList.remove('hidden');
  $('run-resume-btn').classList.add('hidden');
  $('gpx-btn').disabled = true;
  $('run-msg').textContent = 'GPS alınıyor...';
  $('run-map').textContent = 'Konum bekleniyor...';

  watchId = navigator.geolocation.watchPosition(
    pos => {
      if (runPaused) return;
      const { latitude, longitude, accuracy } = pos.coords;
      if (accuracy > 50) {
        $('run-msg').textContent = 'GPS zayıf, bekleyin...';
        return;
      }

      const point = [latitude, longitude];
      if (lastPos) {
        const d = haversine(lastPos[0], lastPos[1], latitude, longitude);
        if (d > 1 && d < 100) { // filter noise
          totalDistance += d;
          runPath.push(point);
        }
      } else {
        runPath.push(point);
      }
      lastPos = point;

      // elapsed
      runElapsed = Math.floor((Date.now() - runStartTime) / 1000);
      updateRunUI();
      $('run-msg').textContent = totalDistance >= 3000 ? '🎉 Hedef tamam!' : 'Koşuya devam...';
      $('run-map').textContent = `Nokta: ${runPath.length} • Doğruluk: ${Math.round(accuracy)}m`;
    },
    err => {
      $('run-msg').textContent = 'GPS hatası: ' + err.message;
    },
    { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
  );

  // timer tick even if GPS slow
  window._runTick = setInterval(() => {
    if (runActive && !runPaused) {
      runElapsed = Math.floor((Date.now() - runStartTime) / 1000);
      updateRunUI();
    }
  }, 1000);
}

function pauseRun() {
  runPaused = true;
  $('run-pause-btn').classList.add('hidden');
  $('run-resume-btn').classList.remove('hidden');
  $('run-msg').textContent = 'Duraklatıldı';
}

function resumeRun() {
  runPaused = false;
  // adjust start time so elapsed continues correctly
  runStartTime = Date.now() - runElapsed * 1000;
  $('run-resume-btn').classList.add('hidden');
  $('run-pause-btn').classList.remove('hidden');
  $('run-msg').textContent = 'Devam ediyor...';
}

function stopRun() {
  runActive = false;
  runPaused = false;
  if (watchId) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
  if (window._runTick) clearInterval(window._runTick);

  $('run-start-btn').classList.remove('hidden');
  $('run-pause-btn').classList.add('hidden');
  $('run-resume-btn').classList.add('hidden');
  $('run-stop-btn').classList.add('hidden');

  // save
  const entry = {
    date: todayStr() + 'T' + new Date().toTimeString().slice(0,8),
    distance: totalDistance,
    timeSeconds: runElapsed,
    path: runPath
  };
  data.runs.push(entry);
  saveData(data);

  // prepare GPX
  lastGPX = generateGPX(entry);
  $('gpx-btn').disabled = false;
  $('run-msg').textContent = `Kaydedildi: ${(totalDistance/1000).toFixed(2)} km • ${formatTime(runElapsed)}`;
  alert('Koşu kaydedildi! GPX indirebilirsin.');
}

function generateGPX(run) {
  const date = new Date().toISOString();
  let points = run.path.map(p => 
    `<trkpt lat="${p[0]}" lon="${p[1]}"><ele>0</ele></trkpt>`
  ).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Guclenme Planim" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata><time>${date}</time></metadata>
  <trk>
    <name>3000m Koşu ${run.date}</name>
    <trkseg>
${points}
    </trkseg>
  </trk>
</gpx>`;
}

function downloadGPX() {
  if (!lastGPX) {
    alert('Önce bir koşu bitir');
    return;
  }
  const blob = new Blob([lastGPX], { type: 'application/gpx+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `kosu_${todayStr()}.gpx`;
  a.click();
  URL.revokeObjectURL(url);
}

// ===================== CHARTS =====================
let charts = {};

function renderCharts() {
  const labels = data.maxTests.map(m => m.date.slice(5)); // MM-DD
  const pushData = data.maxTests.map(m => m.push);
  const sitData  = data.maxTests.map(m => m.sit);
  const pullData = data.maxTests.map(m => m.pull);
  const runData  = data.maxTests.map(m => m.runSeconds ? +(m.runSeconds / 60).toFixed(2) : null);

  const common = {
    type: 'line',
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
        x: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } }
      }
    }
  };

  function makeChart(id, dataArr, color, label) {
    if (charts[id]) charts[id].destroy();
    const ctx = $(id).getContext('2d');
    charts[id] = new Chart(ctx, {
      ...common,
      data: {
        labels,
        datasets: [{
          label,
          data: dataArr,
          borderColor: color,
          backgroundColor: color + '33',
          tension: 0.3,
          fill: true,
          pointRadius: 4
        }]
      }
    });
  }

  makeChart('chart-push', pushData, '#38bdf8', 'Şınav');
  makeChart('chart-sit',  sitData,  '#22c55e', 'Mekik');
  makeChart('chart-pull', pullData, '#f97316', 'Barfiks');
  makeChart('chart-run',  runData,  '#a78bfa', 'Süre (dk)');
}

// ===================== HISTORY =====================
function renderHistory() {
  // workouts
  const wh = $('workout-history');
  if (!data.workouts.length) {
    wh.innerHTML = '<p style="color:var(--muted)">Henüz antrenman kaydı yok</p>';
  } else {
    wh.innerHTML = data.workouts.slice().reverse().map(w => {
      const p = w.push.length ? w.push.join('+') : '-';
      const s = w.sit.length ? w.sit.join('+') : '-';
      const u = w.pull.length ? w.pull.join('+') : '-';
      return `<div class="history-item">
        <span>${w.date}</span>
        <span>Ş:${p} M:${s} B:${u}</span>
      </div>`;
    }).join('');
  }

  // runs
  const rh = $('run-history');
  if (!data.runs.length) {
    rh.innerHTML = '<p style="color:var(--muted)">Henüz koşu kaydı yok</p>';
  } else {
    rh.innerHTML = data.runs.slice().reverse().map((r, i) => {
      const km = (r.distance / 1000).toFixed(2);
      return `<div class="history-item">
        <span>${r.date.slice(0,16)}</span>
        <span>${km} km • ${formatTime(r.timeSeconds)}</span>
      </div>`;
    }).join('');
  }
}

// ===================== EXPORT / CLEAR =====================
function exportAllData() {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `guclenme_yedek_${todayStr()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function clearAllData() {
  if (!confirm('TÜM veriler silinecek. Emin misin?')) return;
  localStorage.removeItem(STORAGE_KEY);
  data = { restSeconds: 60, workouts: [], maxTests: [], runs: [] };
  alert('Veriler silindi. Sayfayı yenile.');
  location.reload();
}

// ===================== INIT =====================
setTodayDate();
renderMaxHistory();
