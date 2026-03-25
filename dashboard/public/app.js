let pollingInterval = null;
let testDefinitions = null;

// --- Init ---
document.addEventListener('DOMContentLoaded', async () => {
  await loadTestDefinitions();
  await refreshResults();
});

// --- Load test definitions ---
async function loadTestDefinitions() {
  try {
    const res = await fetch('/api/tests');
    testDefinitions = await res.json();
    renderPhases(testDefinitions.phases, []);
  } catch (err) {
    console.error('Failed to load test definitions:', err);
  }
}

// --- Render phases and test rows ---
function renderPhases(phases, results) {
  const container = document.getElementById('phases');
  container.innerHTML = '';

  for (const phase of phases) {
    const phaseResults = phase.tests.map(t => {
      const result = results.find(r => r.id === t.id || r.title?.startsWith(t.id));
      return { ...t, result };
    });

    const passCount = phaseResults.filter(t => t.result?.status === 'passed').length;
    const failCount = phaseResults.filter(t => t.result && t.result.status !== 'passed' && t.result.status !== 'skipped').length;
    const total = phase.tests.length;

    let badgeClass = 'badge-pending';
    let badgeText = 'Pending';
    if (passCount === total) { badgeClass = 'badge-pass'; badgeText = `${passCount}/${total} Passed`; }
    else if (failCount > 0) { badgeClass = 'badge-fail'; badgeText = `${passCount}/${total} Passed`; }
    else if (passCount > 0) { badgeClass = 'badge-pass'; badgeText = `${passCount}/${total} Passed`; }

    const phaseEl = document.createElement('div');
    phaseEl.className = 'phase';
    phaseEl.innerHTML = `
      <div class="phase-header" onclick="this.parentElement.classList.toggle('collapsed')">
        <h3>${phase.name}</h3>
        <div style="display:flex;align-items:center;gap:10px;">
          <span class="badge ${badgeClass}">${badgeText}</span>
          <button class="btn btn-sm btn-primary" onclick="event.stopPropagation();runTests('${phase.id}')">&#9654; Run</button>
        </div>
      </div>
      <div class="phase-body">
        ${phaseResults.map(t => renderTestRow(t)).join('')}
      </div>
    `;
    container.appendChild(phaseEl);
  }
}

function renderTestRow(t) {
  const status = t.result?.status || 'pending';
  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
  const statusClass = `status-${status}`;
  const duration = t.result?.duration ? formatDuration(t.result.duration) : '-';
  const hasError = t.result?.error;
  const errorId = `error-${t.id}`;

  return `
    <div class="test-row" ${hasError ? `style="cursor:pointer" onclick="document.getElementById('${errorId}').classList.toggle('show')"` : ''}>
      <span class="test-id">${t.id}</span>
      <span class="test-desc">${t.desc} ${hasError ? '<span style="color:#e63946;font-size:11px">&#9660; click for error</span>' : ''}</span>
      <span class="test-creates">${t.creates}</span>
      <span class="test-duration">${duration}</span>
      <span class="test-status ${statusClass}">${statusLabel}</span>
    </div>
    ${hasError ? `<div class="error-detail" id="${errorId}">${escapeHtml(t.result.error)}</div>` : ''}
  `;
}

// --- Run tests ---
async function runTests(phase) {
  try {
    const res = await fetch('/api/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phase }),
    });
    const data = await res.json();
    if (res.status === 409) {
      alert('Tests are already running!');
      return;
    }
    setRunningState(true, phase);
    startPolling();
  } catch (err) {
    alert('Failed to start tests: ' + err.message);
  }
}

async function stopTests() {
  try {
    await fetch('/api/stop', { method: 'POST' });
    setRunningState(false);
    stopPolling();
    await refreshResults();
  } catch (err) {
    console.error('Failed to stop:', err);
  }
}

// --- Polling ---
function startPolling() {
  stopPolling();
  pollingInterval = setInterval(async () => {
    try {
      const res = await fetch('/api/status');
      const status = await res.json();
      if (!status.running) {
        stopPolling();
        setRunningState(false);
        await refreshResults();
      } else {
        updateStatusBar('running', `Running tests... Phase: ${status.phase || 'all'}`);
      }
    } catch (err) {
      console.error('Poll error:', err);
    }
  }, 3000);
}

function stopPolling() {
  if (pollingInterval) { clearInterval(pollingInterval); pollingInterval = null; }
}

// --- Refresh results ---
async function refreshResults() {
  try {
    const res = await fetch('/api/results');
    const data = await res.json();

    if (data.hasResults && data.summary) {
      document.getElementById('s-total').textContent = data.summary.total;
      document.getElementById('s-passed').textContent = data.summary.passed;
      document.getElementById('s-failed').textContent = data.summary.failed;
      document.getElementById('s-skipped').textContent = data.summary.skipped;
      document.getElementById('s-rate').textContent = data.summary.passRate + '%';

      if (testDefinitions) {
        renderPhases(testDefinitions.phases, data.tests || []);
      }

      updateStatusBar('done', `Last run: ${data.summary.passed}/${data.summary.total} passed (${formatDuration(data.summary.duration)})`);
    } else {
      updateStatusBar('idle', 'No test results yet. Click "Run All Tests" to start.');
    }

    if (data.status?.running) {
      setRunningState(true, data.status.phase);
      startPolling();
    }
  } catch (err) {
    updateStatusBar('idle', 'Dashboard ready. No results loaded.');
  }
}

// --- PDF Download ---
function downloadPDF() {
  window.open('/api/report/pdf', '_blank');
}

// --- UI Helpers ---
function setRunningState(running, phase) {
  document.getElementById('btn-run-all').disabled = running;
  document.getElementById('btn-stop').style.display = running ? 'inline-flex' : 'none';
  if (running) {
    updateStatusBar('running', `Running tests... Phase: ${phase || 'all'}`);
  }
}

function updateStatusBar(type, text) {
  const bar = document.getElementById('status-bar');
  const icon = document.getElementById('status-icon');
  const textEl = document.getElementById('status-text');
  bar.className = `status-bar ${type}`;
  textEl.textContent = text;
  if (type === 'running') {
    icon.innerHTML = '<div class="spinner"></div>';
  } else if (type === 'done') {
    icon.innerHTML = '&#10003;';
  } else {
    icon.innerHTML = '&#9679;';
  }
}

function formatDuration(ms) {
  if (!ms) return '-';
  if (ms < 1000) return ms + 'ms';
  if (ms < 60000) return (ms / 1000).toFixed(1) + 's';
  const m = Math.floor(ms / 60000);
  const s = ((ms % 60000) / 1000).toFixed(0);
  return m + 'm ' + s + 's';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
