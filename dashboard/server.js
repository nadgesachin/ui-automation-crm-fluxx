import express from 'express';
import { exec } from 'child_process';
import { readFileSync, existsSync, readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Current running process
let runningProcess = null;
let runStatus = { running: false, phase: null, startedAt: null, log: [] };

// --- API Routes ---

// Get test case definitions
app.get('/api/tests', (req, res) => {
  res.json({
    phases: [
      {
        id: 'phase1', name: 'Phase 1: CRM to Fluxx Sync',
        tests: [
          { id: 'P1_01', desc: 'Create Organisation in CRM (India, Grantee, FCRA)', creates: '1 Org' },
          { id: 'P1_02', desc: 'Create Contact in CRM linked to Organisation', creates: '1 Contact' },
          { id: 'P1_03', desc: 'Verify Organisation synced to Fluxx', creates: '-' },
          { id: 'P1_04', desc: 'Verify Contact synced to Fluxx (People tab)', creates: '-' },
        ],
      },
      {
        id: 'phase2', name: 'Phase 2: Field Mapping Verification',
        tests: [
          { id: 'P2_01', desc: 'Verify Organisation field mapping in Fluxx', creates: '-' },
          { id: 'P2_02', desc: 'Verify Contact field mapping in Fluxx', creates: '-' },
          { id: 'P2_03', desc: 'Verify Org-Contact relationship in Fluxx', creates: '-' },
        ],
      },
      {
        id: 'phase3', name: 'Phase 3: Fluxx to CRM (Investment + Co-Funding)',
        tests: [
          { id: 'P3_01', desc: 'Create Investment in Fluxx linked to Org', creates: '1 Investment' },
          { id: 'P3_02', desc: 'Create Co-Funding in Fluxx linked to Org', creates: '1 Co-Funding' },
          { id: 'P3_03', desc: 'Verify Investment tab under Org in Fluxx', creates: '-' },
          { id: 'P3_04', desc: 'Verify Co-Funding tab under Org in Fluxx', creates: '-' },
        ],
      },
      {
        id: 'phase4', name: 'Phase 4: Update + Re-verify',
        tests: [
          { id: 'P4_01', desc: 'Update Organisation in CRM, verify sync', creates: '-' },
          { id: 'P4_02', desc: 'Update Contact email in CRM, verify sync', creates: '-' },
        ],
      },
      {
        id: 'phase5', name: 'Phase 5: Negative Scenarios',
        tests: [
          { id: 'P5_01', desc: 'Org with Required in Fluxx = No should NOT sync', creates: '1 temp Org' },
          { id: 'P5_02', desc: 'Contact without Primary Org fails validation', creates: '-' },
        ],
      },
      {
        id: 'phase6', name: 'Phase 6: Cleanup',
        tests: [
          { id: 'P6_01', desc: 'Delete all AUTO_UI_ test data', creates: 'Deletes all' },
        ],
      },
    ],
  });
});

// Get latest test results
app.get('/api/results', (req, res) => {
  const resultsPath = path.join(ROOT, 'test-reports', 'results.json');
  if (!existsSync(resultsPath)) {
    return res.json({ hasResults: false, results: null, status: runStatus });
  }

  try {
    const raw = readFileSync(resultsPath, 'utf-8');
    const data = JSON.parse(raw);

    const tests = [];
    for (const suite of data.suites || []) {
      for (const innerSuite of suite.suites || []) {
        for (const spec of innerSuite.specs || []) {
          const lastResult = spec.tests?.[0]?.results?.slice(-1)[0];
          tests.push({
            id: spec.title.split(':')[0]?.trim() || spec.title,
            title: spec.title,
            status: spec.ok ? 'passed' : (lastResult?.status || 'failed'),
            duration: lastResult?.duration || 0,
            error: lastResult?.error?.message || null,
            retry: spec.tests?.[0]?.results?.length > 1,
          });
        }
      }
    }

    const passed = tests.filter(t => t.status === 'passed').length;
    const failed = tests.filter(t => t.status !== 'passed' && t.status !== 'skipped').length;
    const skipped = tests.filter(t => t.status === 'skipped').length;

    res.json({
      hasResults: true,
      summary: {
        total: tests.length,
        passed,
        failed,
        skipped,
        passRate: tests.length > 0 ? ((passed / tests.length) * 100).toFixed(1) : 0,
        duration: tests.reduce((sum, t) => sum + t.duration, 0),
      },
      tests,
      status: runStatus,
    });
  } catch (err) {
    res.json({ hasResults: false, error: err.message, status: runStatus });
  }
});

// Run tests
app.post('/api/run', (req, res) => {
  if (runStatus.running) {
    return res.status(409).json({ error: 'Tests already running' });
  }

  const { phase } = req.body;
  let cmd = 'npx playwright install firefox chromium && HEADLESS=true npm run test:e2e';

  if (phase && phase !== 'all') {
    cmd = `npx playwright install firefox chromium && HEADLESS=true npx playwright test --project=crm-setup --project=fluxx-setup --project=e2e-sync --grep "${phase}"`;
  }

  runStatus = { running: true, phase: phase || 'all', startedAt: new Date().toISOString(), log: [] };

  res.json({ message: 'Test run started', phase: phase || 'all' });

  runningProcess = exec(cmd, { cwd: ROOT, maxBuffer: 10 * 1024 * 1024, timeout: 1800000 }, (err, stdout, stderr) => {
    runStatus.running = false;
    runStatus.completedAt = new Date().toISOString();
    runStatus.exitCode = err ? err.code : 0;
    runStatus.log = (stdout + stderr).split('\n').slice(-50);
    runningProcess = null;
  });
});

// Get run status
app.get('/api/status', (req, res) => {
  res.json(runStatus);
});

// Stop running tests
app.post('/api/stop', (req, res) => {
  if (runningProcess) {
    runningProcess.kill('SIGTERM');
    runStatus.running = false;
    runStatus.log.push('Tests stopped by user');
    runningProcess = null;
    res.json({ message: 'Tests stopped' });
  } else {
    res.json({ message: 'No tests running' });
  }
});

// Download PDF report
app.get('/api/report/pdf', (req, res) => {
  const pdfDir = path.join(ROOT, 'test-reports');
  if (!existsSync(pdfDir)) return res.status(404).json({ error: 'No reports' });

  const files = readdirSync(pdfDir).filter(f => f.endsWith('.pdf')).sort().reverse();
  if (files.length === 0) return res.status(404).json({ error: 'No PDF report found' });

  res.download(path.join(pdfDir, files[0]));
});

// Serve test screenshots
app.use('/screenshots', express.static(path.join(ROOT, 'test-results')));

app.listen(PORT, () => {
  console.log(`\n  CIFF Test Dashboard running at: http://localhost:${PORT}\n`);
});
