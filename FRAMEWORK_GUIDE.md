# CRM-Fluxx UI Automation Framework Guide

## Overview

Enterprise-grade UI automation framework for testing CRM (Dynamics 365) and Fluxx portal integration. Built with Playwright + JavaScript using the Page Object Model pattern.

**Key capabilities:**
- SSO login with session persistence (login once, reuse across tests)
- CRM organisation & contact CRUD operations
- CRM-to-Fluxx sync verification with retry polling
- AUTO_UI_ prefix on all test data for identification and cleanup
- HTML reports with screenshots and video on failure

---

## Project Structure

```
├── config/
│   ├── environments.js       # Environment URLs, credentials config
│   └── constants.js          # Timeouts, prefixes, field options
├── globals/
│   ├── auth.setup.js         # CRM SSO auth setup (saves session)
│   └── fluxx-auth.setup.js   # Fluxx SSO auth setup (saves session)
├── pages/
│   ├── BasePage.js           # Base class for all page objects
│   ├── CRMLoginPage.js       # CRM navigation & auth verification
│   ├── CRMOrganisationPage.js # CRM organisation CRUD
│   ├── CRMContactPage.js     # CRM contact management
│   ├── FluxxLoginPage.js     # Fluxx SSO login
│   └── FluxxOrganisationPage.js # Fluxx organisation search & verify
├── utils/
│   ├── Logger.js             # Structured logging utility
│   └── TestDataManager.js    # Test data generation with AUTO_UI_ prefix
├── test-data/
│   ├── organisations.json    # Organisation test scenarios
│   └── contacts.json         # Contact test scenarios
├── tests/
│   ├── crm/
│   │   ├── organisation.spec.js  # CRM org tests (9 scenarios)
│   │   └── contact.spec.js       # CRM contact tests (2 scenarios)
│   ├── fluxx/
│   │   └── organisation.spec.js  # Fluxx verification tests (3 scenarios)
│   └── integration/
│       └── crm-fluxx-sync.spec.js # E2E sync tests (5 scenarios)
├── playwright.config.js      # Playwright config with 5 projects
├── .env                      # Environment variables (not in git)
├── .env.example              # Template for .env
├── TEST_CASES.md             # Detailed test case document
└── FRAMEWORK_GUIDE.md        # This file
```

---

## How to Run Tests

### Prerequisites
```bash
npm install
npx playwright install    # Install browsers
```

### Configure Environment
```bash
cp .env.example .env
# Edit .env with your SSO credentials
```

### Run Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run ALL tests (setup + CRM + Fluxx + integration) |
| `npm run test:crm` | Run CRM tests only (with auth setup) |
| `npm run test:fluxx` | Run Fluxx tests only (with auth setup) |
| `npm run test:integration` | Run integration sync tests only |
| `npm run test:setup-only` | Run auth setup only (saves sessions) |
| `npm run test:headed` | Run in headed mode (visible browser) |
| `npm run test:debug` | Run with Playwright Inspector |
| `npm run report` | Open HTML report |

### Run Specific Tests
```bash
# Run a single test by grep
npx playwright test -g "SYNC_001"

# Run specific project
npx playwright test --project=crm-tests

# Run with specific browser
npx playwright test --project=crm-tests --headed
```

---

## How to Extend the Framework

### Adding a New Page Object

1. Create `pages/NewPage.js` extending `BasePage`:
```javascript
import { BasePage } from './BasePage.js';

export class NewPage extends BasePage {
  constructor(page) {
    super(page, 'NewPage');
    // Define selectors
    this.someField = page.getByLabel('Field Name');
  }

  async doSomething() {
    this.log.info('Doing something...');
    await this.safeClick(this.someField);
  }
}
```

2. Key patterns to follow:
   - Use `this.safeClick()` and `this.safeFill()` from BasePage for reliability
   - Use `this.selectDropdownOption()` for CRM dropdowns
   - Use `this.selectLookupValue()` for CRM lookup fields
   - Use `this.log` for structured logging
   - Use constants from `config/constants.js` for timeouts and prefixes

### Adding a New Test

1. Create `tests/module/newtest.spec.js`:
```javascript
import { test, expect } from '@playwright/test';
import { NewPage } from '../../pages/NewPage.js';
import { AUTO_PREFIX } from '../../config/constants.js';
import { Logger } from '../../utils/Logger.js';

const log = new Logger('NewTest');

test.describe('New Module Tests', () => {
  test('TEST_001: Description', async ({ page }) => {
    log.section('TEST_001');
    // Test logic using page objects
  });
});
```

2. Ensure test data uses `AUTO_UI_` prefix for identification

### Adding a New Environment

Edit `config/environments.js`:
```javascript
const environments = {
  dev: { /* existing */ },
  stage: {
    crm: { baseURL: 'https://ciffstage.crm4.dynamics.com', ... },
    fluxx: { baseURL: 'https://ciff.stage.fluxxlabs.com', ... },
  },
};
```

Then set `TEST_ENV=stage` in `.env`.

---

## How to Debug

### Visual Debugging
```bash
npm run test:debug              # Opens Playwright Inspector
npm run test:headed             # Visible browser
SLOW_MO=500 npm run test:headed # Slow motion (500ms between actions)
```

### Failure Artifacts
On test failure, the framework automatically captures:
- **Screenshot** - saved in `test-results/`
- **Video** - saved in `test-results/`
- **Trace** - viewable with `npx playwright show-trace path/to/trace.zip`

### HTML Report
```bash
npm run report    # Opens interactive HTML report
```

### Logs
All page objects use structured logging with timestamps:
```
12:34:56.789 INFO  [CRMOrganisation] Setting Organisation Name: AUTO_UI_Org_123456
12:34:57.123 INFO  [CRMOrganisation] Setting Required in Fluxx: Yes
```

Set `LOG_LEVEL=DEBUG` in `.env` for verbose output.

---

## Session Management

### How It Works
1. **Setup projects** (`crm-setup`, `fluxx-setup`) run first
2. They perform SSO login and save session to `playwright/.auth/*.json`
3. **Test projects** load saved session via `storageState` config
4. Tests run without needing to login again

### Refreshing Sessions
```bash
npm run test:setup-only     # Re-run auth setup
# Or delete session files:
npm run clean               # Clears reports and session files
```

### Session Files
- `playwright/.auth/crm-state.json` - CRM session (cookies + storage)
- `playwright/.auth/fluxx-state.json` - Fluxx session (cookies + storage)
- These are in `.gitignore` (never committed)

---

## Test Data Convention

All automation-created data uses the `AUTO_UI_` prefix:
- Organisation names: `AUTO_UI_US_Basic_123456`
- Contact names: `AUTO_UI_First Contact_123456`
- FCRA numbers: `AUTO_UI_FCRA_123456`
- Email addresses: `auto_ui_contact_123456@test.automation.com`

This enables:
- Easy identification of test data in CRM/Fluxx
- Bulk cleanup queries: filter by `AUTO_UI_*`
- No confusion with real production data

---

## Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| Firefox for auth setup | Handles Microsoft cookie issues better than Chromium |
| Chrome for tests | Closer to real user experience |
| Sequential execution | CRM/Fluxx don't support parallel sessions |
| Retry polling for sync | CRM-to-Fluxx sync has variable delay (up to 2 min) |
| Inline Fluxx login in integration tests | Session state can't be shared across browser contexts |
| AUTO_UI_ prefix | Enables test data identification and cleanup |
