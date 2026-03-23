# CIFF E2E Test Automation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing CRM-Fluxx Playwright framework to cover 132 test cases across CRM, Fluxx, and Fabric portals with full CRUD, cross-system sync validation, and automatic test data cleanup.

**Architecture:** Page Object Model with BasePage inheritance. Sequential test execution (1 worker). Three SSO auth setups (CRM, Fluxx, Fabric) saved as session state. Tests organized by portal, with integration tests depending on all portal test suites completing first.

**Tech Stack:** Playwright 1.46.1, JavaScript ES Modules, dotenv, Microsoft SSO

**Spec:** `docs/superpowers/specs/2026-03-23-ciff-e2e-test-automation-design.md`

---

## File Map

### Config (modify)
- `config/environments.js` — add Fabric URLs + `getFabricConfig()`
- `config/constants.js` — add `AUTH_STATE.FABRIC`, `FABRIC_SELECTORS`, Investment/Co-Funding selectors

### Auth (create)
- `globals/fabric-auth.setup.js` — Fabric SSO auth + session save

### Utilities (modify + create)
- `utils/TestDataManager.js` — add Investment/Co-Funding generators
- `utils/TestDataCleaner.js` — NEW: tracks + deletes AUTO_UI_ records

### Page Objects (create)
- `pages/FluxxPeoplePage.js` — replaces FluxxContactPage.js, adds Quick Actions Hub
- `pages/FluxxQuickActionsPage.js` — Highlight Feed, model switching, search
- `pages/FluxxInvestmentPage.js` — Investment CRUD
- `pages/FluxxCoFundingPage.js` — Co-Funding CRUD
- `pages/FluxxReadOnlyPage.js` — generic read-only module
- `pages/FabricLoginPage.js` — Fabric SSO
- `pages/FabricDashboardPage.js` — Overview KPIs, charts, filters
- `pages/FabricDetailedViewPage.js` — Detailed View tables, filters

### Page Objects (modify)
- `pages/CRMOrganisationPage.js` — add update/delete/search methods
- `pages/CRMContactPage.js` — add update/delete/search/linking methods
- `pages/FluxxOrganisationPage.js` — add workflow, detail sections, edit/delete

### Tests (create)
- `tests/fluxx/people.spec.js` — rename + extend from contact.spec.js
- `tests/fluxx/investment.spec.js` — Investment CRUD tests
- `tests/fluxx/co-funding.spec.js` — Co-Funding CRUD tests
- `tests/fluxx/read-only.spec.js` — Requests, Grants, Reports, Payments, Amendments
- `tests/fabric/dashboard.spec.js` — Overview + auth tests
- `tests/fabric/detailed-view.spec.js` — Detailed View tests
- `tests/fabric/filters.spec.js` — Filter interaction tests
- `tests/integration/fluxx-fabric-sync.spec.js` — Fluxx → Fabric validation
- `tests/integration/e2e-pipeline.spec.js` — CRM → Fluxx → Fabric pipeline

### Tests (modify)
- `tests/crm/organisation.spec.js` — add update, delete, search, negative tests
- `tests/crm/contact.spec.js` — add update, delete, search, linking tests
- `tests/fluxx/organisation.spec.js` — add search, update verification, workflow tests
- `tests/integration/crm-fluxx-sync.spec.js` — add contact sync, update/delete sync

### Test Data (create + modify)
- `test-data/investments.json` — Investment test data
- `test-data/co-funding.json` — Co-Funding test data

### Config (modify)
- `playwright.config.js` — add fabric-setup, fabric-tests projects
- `package.json` — add test:fabric script
- `.env.example` — add Fabric env vars

---

## Task 1: Config & Environment Setup

**Files:**
- Modify: `config/environments.js`
- Modify: `config/constants.js`
- Modify: `.env.example`
- Modify: `playwright.config.js`
- Modify: `package.json`

- [ ] **Step 1: Add Fabric config to environments.js**

Add Fabric URLs to the `dev` environment block and export `getFabricConfig()`:

```javascript
// Inside environments.dev, after fluxx block:
fabric: {
  workspaceUrl: process.env.FABRIC_WORKSPACE_URL || 'https://app.fabric.microsoft.com/groups/df124183-1f44-43bd-bbaa-fbe2f4cb662f/list?experience=fabric-developer',
  reportUrl: process.env.FABRIC_REPORT_URL || 'https://app.fabric.microsoft.com/groups/df124183-1f44-43bd-bbaa-fbe2f4cb662f/reports/65b6578f-7cf4-44ef-9cec-bd438139d9ff',
  workspaceName: 'DEV-Portfolio Ratings',
  reportName: 'Portfolio Rating Dashboard - DEV',
},

// New export function (follows getCRMConfig/getFluxxConfig pattern):
export function getFabricConfig() {
  const env = getEnvironment();
  return env.fabric;
}
```

- [ ] **Step 2: Add Fabric constants to constants.js**

Add after existing `AUTH_STATE` block:

```javascript
// Add to AUTH_STATE:
FABRIC: 'playwright/.auth/fabric-state.json',

// Add new exports:
export const FABRIC_SELECTORS = {
  REPORT_TITLE: 'Programme Rating Dashboard',
  KPI_TOTAL_INVESTMENTS: 'Total Investments / DA',
  KPI_TOTAL_RATED: 'Total Rated Investments / DA',
  FILTER_INVESTMENT_TYPE: 'investmenttype',
  FILTER_YEAR: 'Year',
  FILTER_PROGRAMME_TEAM: 'powerbiprogrammeteam',
  FILTER_CORE_STRATEGY: 'core_strategy',
  FILTER_MONTH: 'month',
  TAB_OVERVIEW: 'Overview',
  TAB_DETAILED_VIEW: 'Detailed View',
  RATING_COLORS: ['White - Too soon', 'Red - major issues', 'Amber - minor issues', 'Green - on track', 'Blue - Exceeding'],
  PROGRAMME_TEAMS: ['Africa', 'Climate', 'EME', 'India', 'Nutrition', 'SRHR'],
};

export const FLUXX_INVESTMENT_FIELDS = {
  // Will be populated during first implementation pass after exploring Investment form
  NAME: '',
  PROGRAMME_TEAM: '',
  INVESTMENT_TYPE: '',
  RATING: '',
};

export const FLUXX_COFUNDING_FIELDS = {
  // Will be populated during first implementation pass
  NAME: '',
  FUNDER: '',
  AMOUNT: '',
};
```

- [ ] **Step 3: Update .env.example**

Add after `SYNC_RETRY_DELAY_MS`:

```
# Fabric Settings
FABRIC_WORKSPACE_URL=https://app.fabric.microsoft.com/groups/df124183-1f44-43bd-bbaa-fbe2f4cb662f/list?experience=fabric-developer
FABRIC_REPORT_URL=https://app.fabric.microsoft.com/groups/df124183-1f44-43bd-bbaa-fbe2f4cb662f/reports/65b6578f-7cf4-44ef-9cec-bd438139d9ff
```

- [ ] **Step 4: Update playwright.config.js**

Add `fabric-setup` and `fabric-tests` projects. Update `integration` dependencies:

```javascript
// After fluxx-setup project:
{
  name: 'fabric-setup',
  testMatch: '**/globals/fabric-auth.setup.js',
  use: {
    ...devices['Desktop Firefox'],
    launchOptions: {
      slowMo: slowMo,
      args: [
        '--disable-features=BlockThirdPartyCookies',
        '--disable-features=SameSiteByDefaultCookies,CookiesWithoutSameSiteMustBeSecure',
      ],
    },
  },
},
// After fluxx-tests project:
{
  name: 'fabric-tests',
  testDir: './tests/fabric',
  use: {
    ...devices['Desktop Chrome'],
    storageState: 'playwright/.auth/fabric-state.json',
    headless: isHeadless,
    launchOptions: { slowMo: slowMo },
    screenshot: 'on',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 60000,
  },
  dependencies: ['fabric-setup'],
},

// Update integration project dependencies:
dependencies: ['crm-tests', 'fluxx-tests', 'fabric-tests'],
```

- [ ] **Step 5: Update package.json scripts**

Add after `test:integration`:

```json
"test:fabric": "npx playwright test --project=fabric-setup --project=fabric-tests",
"test:all": "npx playwright test",
"test:cleanup": "npx playwright test --grep @cleanup"
```

- [ ] **Step 6: Commit**

```bash
git add config/environments.js config/constants.js .env.example playwright.config.js package.json
git commit -m "feat: add Fabric config, auth state, selectors, and playwright project setup"
```

---

## Task 2: Fabric Auth Setup

**Files:**
- Create: `globals/fabric-auth.setup.js`

- [ ] **Step 1: Create fabric-auth.setup.js**

Follow the exact same pattern as `globals/auth.setup.js` and `globals/fluxx-auth.setup.js`:

```javascript
import { test } from '@playwright/test';
import dotenv from 'dotenv';
import { AUTH_STATE, TIMEOUTS } from '../config/constants.js';

dotenv.config();

const authFile = AUTH_STATE.FABRIC;
const email = process.env.SSO_EMAIL;
const password = process.env.SSO_PASSWORD;

test('Fabric: Authenticate and save session', async ({ page, context }) => {
  test.setTimeout(120000);
  console.log('Starting Fabric authentication...');

  if (!email || !password) {
    throw new Error('SSO_EMAIL and SSO_PASSWORD must be set in .env');
  }

  // Pre-set Microsoft cookies
  await context.addCookies([
    { name: 'MSCC', value: '1', domain: '.login.microsoftonline.com', path: '/', httpOnly: false, secure: true, sameSite: 'None' },
    { name: 'MSPRequ', value: '0', domain: '.login.microsoftonline.com', path: '/', httpOnly: false, secure: true, sameSite: 'None' },
    { name: 'cookie_consent', value: 'accepted', domain: '.login.microsoftonline.com', path: '/', httpOnly: false, secure: true, sameSite: 'None' },
  ]);

  // Navigate to Fabric — triggers SSO
  const fabricUrl = process.env.FABRIC_WORKSPACE_URL || 'https://app.fabric.microsoft.com/groups/df124183-1f44-43bd-bbaa-fbe2f4cb662f/list?experience=fabric-developer';
  await page.goto(fabricUrl, { waitUntil: 'networkidle', timeout: TIMEOUTS.NAVIGATION });

  // Fabric shows its own sign-in page first — enter email and submit
  const emailInput = page.getByRole('textbox', { name: 'Enter email' });
  if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    await emailInput.fill(email);
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);
  }

  // Microsoft SSO password page
  const passwordInput = page.getByRole('textbox', { name: /password/i });
  await passwordInput.waitFor({ state: 'visible', timeout: TIMEOUTS.SSO_LOGIN });
  await passwordInput.evaluate((el, pwd) => { el.value = pwd; el.dispatchEvent(new Event('input', { bubbles: true })); }, password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);

  // Handle "Stay signed in?" prompt
  const staySignedIn = page.getByRole('button', { name: 'Yes' });
  if (await staySignedIn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await staySignedIn.click();
  }

  // Wait for Fabric to fully load
  await page.waitForURL(/app\.fabric\.microsoft\.com/, { timeout: TIMEOUTS.SSO_LOGIN });
  await page.waitForTimeout(TIMEOUTS.LONG_WAIT);

  console.log('Fabric authentication successful. Saving session...');
  await context.storageState({ path: authFile });
  console.log(`Session saved to ${authFile}`);
});
```

- [ ] **Step 2: Run fabric-setup to verify auth works**

```bash
npx playwright test --project=fabric-setup
```

Expected: PASS — session saved to `playwright/.auth/fabric-state.json`

- [ ] **Step 3: Commit**

```bash
git add globals/fabric-auth.setup.js
git commit -m "feat: add Fabric SSO auth setup with session persistence"
```

---

## Task 3: Utilities — TestDataManager Extension + TestDataCleaner

**Files:**
- Modify: `utils/TestDataManager.js`
- Create: `utils/TestDataCleaner.js`

- [ ] **Step 1: Extend TestDataManager with Investment/Co-Funding generators**

Add to `TestDataManager` class:

```javascript
// New tracking arrays in constructor:
this.createdInvestments = [];
this.createdCoFunding = [];

// New methods:
generateInvestmentName(suffix = 'Inv') {
  const timestamp = Date.now().toString().slice(-8);
  const name = `${AUTO_PREFIX}INV_${suffix}_${timestamp}`;
  this.createdInvestments.push(name);
  return name;
}

generateCoFundingName(suffix = 'CF') {
  const timestamp = Date.now().toString().slice(-8);
  const name = `${AUTO_PREFIX}CF_${suffix}_${timestamp}`;
  this.createdCoFunding.push(name);
  return name;
}

getCreatedInvestments() {
  return this.createdInvestments;
}

getCreatedCoFunding() {
  return this.createdCoFunding;
}

// Update logCreatedData to include new types
```

- [ ] **Step 2: Create TestDataCleaner utility**

```javascript
// utils/TestDataCleaner.js
import { Logger } from './Logger.js';
import { AUTO_PREFIX } from '../config/constants.js';

export class TestDataCleaner {
  constructor() {
    this.log = new Logger('TestDataCleaner');
    this.trackedRecords = [];
  }

  trackRecord(system, type, id, name) {
    this.trackedRecords.push({ system, type, id, name, timestamp: Date.now() });
    this.log.info(`Tracked: ${system}/${type} — ${name} (ID: ${id})`);
  }

  async cleanupAll(page) {
    this.log.section('TEST DATA CLEANUP');
    // Delete in reverse dependency order: Co-Funding → Investments → Contacts → Organisations
    const order = ['co-funding', 'investment', 'contact', 'organisation'];
    for (const type of order) {
      const records = this.trackedRecords
        .filter(r => r.type === type)
        .reverse();
      for (const record of records) {
        try {
          await this._deleteRecord(page, record);
          this.log.success(`Deleted: ${record.system}/${record.type} — ${record.name}`);
        } catch (err) {
          this.log.error(`Failed to delete: ${record.system}/${record.type} — ${record.name}`, err);
        }
      }
    }
    this.log.section('CLEANUP COMPLETE');
  }

  async _deleteRecord(page, record) {
    if (record.system === 'fluxx' && record.id) {
      // Navigate to record, click Edit, click Delete
      await page.goto(`https://ciff.eu-preprod.fluxxlabs.com/show/${this._getFluxxModelPath(record.type)}/${record.id}`, { timeout: 60000 });
      await page.waitForTimeout(3000);
      // Look for delete button in action bar
      const deleteBtn = page.locator('a').filter({ hasText: 'Delete' }).first();
      if (await deleteBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await deleteBtn.click();
        // Confirm deletion dialog
        const confirmBtn = page.getByRole('button', { name: /confirm|yes|ok|delete/i }).first();
        if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await confirmBtn.click();
        }
        await page.waitForTimeout(2000);
      }
    }
    // CRM deletion handled separately if supported (may use deactivate)
  }

  _getFluxxModelPath(type) {
    const paths = {
      organisation: 'organization',
      contact: 'user',
      investment: 'program', // Fluxx uses "program" for investments — verify during first run
      'co-funding': 'co_funding', // Verify during first run
    };
    return paths[type] || type;
  }

  async verifyClean(page, searchFn) {
    this.log.section('VERIFY CLEANUP');
    const remaining = await searchFn(AUTO_PREFIX);
    if (remaining > 0) {
      this.log.warn(`${remaining} AUTO_UI_ records still exist`);
    } else {
      this.log.success('All AUTO_UI_ records cleaned up');
    }
    return remaining === 0;
  }
}

export const testDataCleaner = new TestDataCleaner();
```

- [ ] **Step 3: Commit**

```bash
git add utils/TestDataManager.js utils/TestDataCleaner.js
git commit -m "feat: extend TestDataManager and add TestDataCleaner utility"
```

---

## Task 4: Test Data Files

**Files:**
- Create: `test-data/investments.json`
- Create: `test-data/co-funding.json`

- [ ] **Step 1: Create investments.json**

```json
{
  "basic_investment": {
    "name_suffix": "Basic_Inv",
    "programme_team": "Climate",
    "investment_type": "Grant",
    "rating": "Green - on track"
  },
  "africa_investment": {
    "name_suffix": "Africa_Inv",
    "programme_team": "Africa",
    "investment_type": "Direct Agreement",
    "rating": "Amber - minor issues"
  },
  "rated_investment": {
    "name_suffix": "Rated_Inv",
    "programme_team": "India",
    "investment_type": "Grant",
    "rating": "Red - major issues"
  }
}
```

- [ ] **Step 2: Create co-funding.json**

```json
{
  "basic_cofunding": {
    "name_suffix": "Basic_CF",
    "funder": "Test Funder",
    "amount": "100000"
  },
  "large_cofunding": {
    "name_suffix": "Large_CF",
    "funder": "Major Foundation",
    "amount": "5000000"
  },
  "minimal_cofunding": {
    "name_suffix": "Min_CF",
    "funder": "Small Donor",
    "amount": "1000"
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add test-data/investments.json test-data/co-funding.json
git commit -m "feat: add Investment and Co-Funding test data files"
```

---

## Task 5: Fluxx Quick Actions Hub Page Object

**Files:**
- Create: `pages/FluxxQuickActionsPage.js`

This is a shared dependency for People, Investment, Co-Funding, and Read-Only pages.

- [ ] **Step 1: Create FluxxQuickActionsPage.js**

```javascript
import { BasePage } from './BasePage.js';
import { getFluxxConfig } from '../config/environments.js';
import { TIMEOUTS } from '../config/constants.js';

export class FluxxQuickActionsPage extends BasePage {
  constructor(page) {
    super(page, 'FluxxQuickActions');
    const config = getFluxxConfig();
    this.quickActionsUrl = config.dashboardURL || 'https://ciff.eu-preprod.fluxxlabs.com/central/quick-actions';

    // Selectors
    this.modelDropdown = '[data-testid="highlight-feed-model-dropdown-trigger"]';
    this.searchInput = '[data-testid="highlight-feed-search-input"]';
    this.quickSearchInput = page.getByPlaceholder('Search grants, applications and more');
    this.highlightFeedTable = page.locator('[data-testid="highlight-feed-table"]').first();
  }

  async navigateToQuickActions() {
    this.log.step(1, 'Navigate to Quick Actions Hub');
    await this.navigate(this.quickActionsUrl);
    await this.page.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);
  }

  async switchModel(modelName) {
    this.log.info(`Switching Highlight Feed to model: ${modelName}`);
    await this.page.click(this.modelDropdown);
    await this.page.waitForTimeout(TIMEOUTS.SHORT_WAIT);
    const modelOption = this.page.locator(`[data-testid="highlight-feed-model-dropdown-item-${this._getModelKey(modelName)}"]`);
    await modelOption.click();
    await this.page.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);
  }

  _getModelKey(modelName) {
    const keys = {
      'Organisations': 'organization',
      'People': 'user',
      'Requests': 'request',
      'Grants': 'grant',
      'Reports': 'report',
      'Payments': 'payment',
      'Amendments': 'amendment',
    };
    return keys[modelName] || modelName.toLowerCase();
  }

  async searchInHighlightFeed(query) {
    this.log.info(`Searching Highlight Feed for: ${query}`);
    const searchInput = this.page.getByPlaceholder('Search records');
    await searchInput.fill(query);
    await this.page.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);
  }

  async getTableRows() {
    const rows = this.page.locator('table tbody tr').filter({ hasNot: this.page.locator('[class*="action"]') });
    return rows;
  }

  async getRowCount() {
    const rows = await this.getTableRows();
    return await rows.count();
  }

  async openRecordByIndex(index = 0) {
    this.log.info(`Opening record at index: ${index}`);
    const openLinks = this.page.getByRole('link', { name: 'Open record' });
    await openLinks.nth(index).click();
    await this.page.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);
  }

  async getTableHeaders() {
    const headers = this.page.locator('table thead th');
    const count = await headers.count();
    const headerTexts = [];
    for (let i = 0; i < count; i++) {
      headerTexts.push(await headers.nth(i).textContent());
    }
    return headerTexts.map(h => h.trim()).filter(h => h);
  }

  async navigateToNextPage() {
    const nextBtn = this.page.getByRole('button', { name: 'Next Page' });
    if (await nextBtn.isEnabled()) {
      await nextBtn.click();
      await this.page.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);
      return true;
    }
    return false;
  }

  async getPaginationInfo() {
    const info = this.page.locator('[class*="pagination"]').first();
    return await info.textContent();
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add pages/FluxxQuickActionsPage.js
git commit -m "feat: add FluxxQuickActionsPage with Highlight Feed model switching and search"
```

---

## Task 6: Fluxx People Page Object (replaces FluxxContactPage)

**Files:**
- Create: `pages/FluxxPeoplePage.js`

- [ ] **Step 1: Create FluxxPeoplePage.js**

Migrate methods from `FluxxContactPage.js` and add Quick Actions Hub integration:

```javascript
import { BasePage } from './BasePage.js';
import { TIMEOUTS, FLUXX_CONTACT_FIELDS } from '../config/constants.js';

export class FluxxPeoplePage extends BasePage {
  constructor(page) {
    super(page, 'FluxxPeople');
  }

  // --- Migrated from FluxxContactPage.js ---

  async navigateToPeopleTab(detailPage) {
    this.log.info('Navigating to People tab on org detail');
    const peopleTab = detailPage.locator('li').filter({ hasText: 'People' });
    await peopleTab.click();
    await this.page.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);
  }

  async clickContact(detailPage, contactName) {
    this.log.info(`Clicking contact: ${contactName}`);
    const contactLink = detailPage.locator('a').filter({ hasText: contactName });
    await contactLink.click();
    await this.page.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);
  }

  async verifyContactDetails(detailPage, data) {
    this.log.info('Verifying contact details...');
    const results = {};
    if (data.firstName) {
      const nameVisible = await detailPage.locator(`text=${data.firstName}`).isVisible().catch(() => false);
      results.firstName = nameVisible;
    }
    if (data.email) {
      const emailVisible = await detailPage.locator(`text=${data.email}`).isVisible().catch(() => false);
      results.email = emailVisible;
    }
    return results;
  }

  async verifyContactDetailsWithRetry(detailPage, data, maxRetries = 12) {
    for (let i = 0; i < maxRetries; i++) {
      const result = await this.verifyContactDetails(detailPage, data);
      if (Object.values(result).every(v => v === true)) return result;
      this.log.info(`Retry ${i + 1}/${maxRetries}...`);
      await this.page.waitForTimeout(TIMEOUTS.LONG_WAIT);
    }
    return await this.verifyContactDetails(detailPage, data);
  }

  // --- New Quick Actions Hub methods ---

  async searchPeopleViaHighlightFeed(quickActionsPage, name) {
    this.log.info(`Searching People for: ${name}`);
    await quickActionsPage.switchModel('People');
    await quickActionsPage.searchInHighlightFeed(name);
  }

  async verifyPeopleTableColumns(quickActionsPage) {
    const headers = await quickActionsPage.getTableHeaders();
    const expected = ['ID', 'First Name', 'Last Name', 'Primary Organization', 'Title', 'Email', 'Phone'];
    this.log.info(`Table headers: ${headers.join(', ')}`);
    return expected.every(col => headers.some(h => h.includes(col)));
  }

  async openPersonRecord(quickActionsPage, index = 0) {
    await quickActionsPage.openRecordByIndex(index);
  }

  async personExists(quickActionsPage, name) {
    await quickActionsPage.searchInHighlightFeed(name);
    const count = await quickActionsPage.getRowCount();
    return count > 0;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add pages/FluxxPeoplePage.js
git commit -m "feat: add FluxxPeoplePage replacing FluxxContactPage with Quick Actions support"
```

---

## Task 7: Fluxx Investment & Co-Funding Page Objects

**Files:**
- Create: `pages/FluxxInvestmentPage.js`
- Create: `pages/FluxxCoFundingPage.js`

- [ ] **Step 1: Create FluxxInvestmentPage.js**

```javascript
import { BasePage } from './BasePage.js';
import { TIMEOUTS } from '../config/constants.js';

export class FluxxInvestmentPage extends BasePage {
  constructor(page) {
    super(page, 'FluxxInvestment');
  }

  async navigateToInvestmentTab(orgDetailPage) {
    this.log.info('Navigating to Investment tab');
    const investmentTab = orgDetailPage.locator('li').filter({ hasText: 'Investment' });
    await investmentTab.click();
    await this.page.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);
  }

  async createInvestment(quickActionsPage, data) {
    this.log.section('CREATE INVESTMENT');
    // Note: Investment creation flow will be discovered during first test run.
    // The form fields and buttons depend on the Fluxx configuration.
    // This method will be populated after exploring the Investment creation form.
    this.log.step(1, 'Search for Investment model via Quick Actions');
    await quickActionsPage.switchModel('Requests'); // Investments may be under Requests in Fluxx
    // TODO: Explore and implement investment creation form
    this.log.warn('Investment creation form needs to be explored — selectors TBD');
  }

  async searchInvestment(quickActionsPage, name) {
    this.log.info(`Searching for investment: ${name}`);
    await quickActionsPage.searchInHighlightFeed(name);
    const count = await quickActionsPage.getRowCount();
    return count > 0;
  }

  async verifyInvestmentUnderOrg(orgDetailPage, investmentName) {
    this.log.info(`Verifying investment "${investmentName}" under org`);
    await this.navigateToInvestmentTab(orgDetailPage);
    const visible = await orgDetailPage.locator(`text=${investmentName}`).isVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE }).catch(() => false);
    return visible;
  }

  async openInvestmentDetail(quickActionsPage, index = 0) {
    await quickActionsPage.openRecordByIndex(index);
  }

  async deleteInvestment(page, investmentId) {
    this.log.info(`Deleting investment ID: ${investmentId}`);
    await page.goto(`https://ciff.eu-preprod.fluxxlabs.com/show/program/${investmentId}`, { timeout: TIMEOUTS.NAVIGATION });
    await page.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);
    const deleteLink = page.locator('a').filter({ hasText: 'Delete' }).first();
    if (await deleteLink.isVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE }).catch(() => false)) {
      await deleteLink.click();
      await page.waitForTimeout(TIMEOUTS.SHORT_WAIT);
      const confirmBtn = page.getByRole('button', { name: /confirm|yes|ok|delete/i }).first();
      if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await confirmBtn.click();
      }
    }
  }
}
```

- [ ] **Step 2: Create FluxxCoFundingPage.js**

```javascript
import { BasePage } from './BasePage.js';
import { TIMEOUTS } from '../config/constants.js';

export class FluxxCoFundingPage extends BasePage {
  constructor(page) {
    super(page, 'FluxxCoFunding');
  }

  async navigateToCoFundingTab(orgDetailPage) {
    this.log.info('Navigating to Co-Funding tab');
    const cfTab = orgDetailPage.locator('li').filter({ hasText: 'Co-Funding' });
    await cfTab.click();
    await this.page.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);
  }

  async createCoFunding(quickActionsPage, data) {
    this.log.section('CREATE CO-FUNDING');
    // Co-Funding creation flow will be discovered during first test run.
    this.log.warn('Co-Funding creation form needs to be explored — selectors TBD');
  }

  async searchCoFunding(quickActionsPage, name) {
    this.log.info(`Searching for co-funding: ${name}`);
    await quickActionsPage.searchInHighlightFeed(name);
    const count = await quickActionsPage.getRowCount();
    return count > 0;
  }

  async verifyCoFundingUnderOrg(orgDetailPage, cfName) {
    this.log.info(`Verifying co-funding "${cfName}" under org`);
    await this.navigateToCoFundingTab(orgDetailPage);
    const visible = await orgDetailPage.locator(`text=${cfName}`).isVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE }).catch(() => false);
    return visible;
  }

  async deleteCoFunding(page, cfId) {
    this.log.info(`Deleting co-funding ID: ${cfId}`);
    await page.goto(`https://ciff.eu-preprod.fluxxlabs.com/show/co_funding/${cfId}`, { timeout: TIMEOUTS.NAVIGATION });
    await page.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);
    const deleteLink = page.locator('a').filter({ hasText: 'Delete' }).first();
    if (await deleteLink.isVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE }).catch(() => false)) {
      await deleteLink.click();
      const confirmBtn = page.getByRole('button', { name: /confirm|yes|ok|delete/i }).first();
      if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await confirmBtn.click();
      }
    }
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add pages/FluxxInvestmentPage.js pages/FluxxCoFundingPage.js
git commit -m "feat: add FluxxInvestmentPage and FluxxCoFundingPage objects"
```

---

## Task 8: Fluxx Read-Only Page Object

**Files:**
- Create: `pages/FluxxReadOnlyPage.js`

- [ ] **Step 1: Create FluxxReadOnlyPage.js**

```javascript
import { BasePage } from './BasePage.js';
import { TIMEOUTS } from '../config/constants.js';

export class FluxxReadOnlyPage extends BasePage {
  constructor(page) {
    super(page, 'FluxxReadOnly');
  }

  async switchToModule(quickActionsPage, moduleName) {
    this.log.info(`Switching to read-only module: ${moduleName}`);
    await quickActionsPage.switchModel(moduleName);
  }

  async verifyListViewLoaded(quickActionsPage) {
    const rowCount = await quickActionsPage.getRowCount();
    this.log.info(`Module loaded with ${rowCount} rows`);
    return rowCount > 0;
  }

  async verifyTableHeaders(quickActionsPage, expectedHeaders) {
    const headers = await quickActionsPage.getTableHeaders();
    this.log.info(`Headers found: ${headers.join(', ')}`);
    const allPresent = expectedHeaders.every(h => headers.some(actual => actual.includes(h)));
    return { allPresent, headers };
  }

  async openFirstRecord(quickActionsPage) {
    await quickActionsPage.openRecordByIndex(0);
    await this.page.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);
  }

  async verifyDetailPageLoaded() {
    // Check that a detail card/record is visible
    const detailCard = this.page.locator('article, [class*="detail"], [class*="record"]').first();
    return await detailCard.isVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE }).catch(() => false);
  }

  async searchInModule(quickActionsPage, query) {
    await quickActionsPage.searchInHighlightFeed(query);
    const count = await quickActionsPage.getRowCount();
    return count;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add pages/FluxxReadOnlyPage.js
git commit -m "feat: add FluxxReadOnlyPage for Requests, Grants, Reports, Payments, Amendments"
```

---

## Task 9: Fabric Page Objects

**Files:**
- Create: `pages/FabricLoginPage.js`
- Create: `pages/FabricDashboardPage.js`
- Create: `pages/FabricDetailedViewPage.js`

- [ ] **Step 1: Create FabricLoginPage.js**

```javascript
import { BasePage } from './BasePage.js';
import { getFabricConfig } from '../config/environments.js';
import { TIMEOUTS } from '../config/constants.js';

export class FabricLoginPage extends BasePage {
  constructor(page) {
    super(page, 'FabricLogin');
    const config = getFabricConfig();
    this.workspaceUrl = config.workspaceUrl;
    this.reportUrl = config.reportUrl;
    this.workspaceName = config.workspaceName;
  }

  async navigateToWorkspace() {
    this.log.step(1, 'Navigate to Fabric workspace');
    await this.navigate(this.workspaceUrl);
    await this.page.waitForTimeout(TIMEOUTS.LONG_WAIT);
  }

  async navigateToReport() {
    this.log.step(1, 'Navigate to Fabric report');
    await this.navigate(this.reportUrl);
    await this.page.waitForTimeout(TIMEOUTS.LONG_WAIT * 2);
  }

  async verifyWorkspaceLoaded() {
    const heading = this.page.getByRole('heading', { name: this.workspaceName });
    return await heading.isVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE }).catch(() => false);
  }

  async openReport(reportName) {
    this.log.info(`Opening report: ${reportName}`);
    const reportLink = this.page.getByRole('link', { name: reportName });
    await reportLink.click();
    await this.page.waitForTimeout(TIMEOUTS.LONG_WAIT * 2);
  }
}
```

- [ ] **Step 2: Create FabricDashboardPage.js**

```javascript
import { BasePage } from './BasePage.js';
import { TIMEOUTS, FABRIC_SELECTORS } from '../config/constants.js';

export class FabricDashboardPage extends BasePage {
  constructor(page) {
    super(page, 'FabricDashboard');
  }

  // --- Overview Page ---

  async verifyReportTitle() {
    this.log.info('Verifying report title');
    const title = this.page.locator('text=Programme Rating Dashboard');
    return await title.isVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE }).catch(() => false);
  }

  async getKPIValue(kpiName) {
    this.log.info(`Reading KPI: ${kpiName}`);
    // Power BI KPI cards use group elements with text content
    const kpiElement = this.page.locator(`text=${kpiName}`).first();
    if (await kpiElement.isVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE }).catch(() => false)) {
      const parent = kpiElement.locator('..');
      return await parent.textContent();
    }
    return null;
  }

  async verifyRatingStatusChart() {
    this.log.info('Verifying Rating Status chart');
    const chart = this.page.locator('text=Rating Status');
    return await chart.isVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE }).catch(() => false);
  }

  async verifyInvestmentsHealthPie() {
    this.log.info('Verifying CIFF Investments Health pie');
    const pie = this.page.locator('text=CIFF Investments Health');
    const visible = await pie.isVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE }).catch(() => false);
    if (!visible) return { visible: false, ratings: [] };

    const ratings = [];
    for (const rating of FABRIC_SELECTORS.RATING_COLORS) {
      const ratingEl = this.page.locator(`text=${rating}`).first();
      const exists = await ratingEl.isVisible().catch(() => false);
      ratings.push({ name: rating, visible: exists });
    }
    return { visible: true, ratings };
  }

  async verifyProgrammeTeamBar() {
    this.log.info('Verifying Portfolio Health Programme Team chart');
    const chart = this.page.locator('text=Portfolio Health Programme Team');
    const visible = await chart.isVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE }).catch(() => false);
    if (!visible) return { visible: false, teams: [] };

    const teams = [];
    for (const team of FABRIC_SELECTORS.PROGRAMME_TEAMS) {
      const teamEl = this.page.getByRole('option', { name: team }).first();
      const exists = await teamEl.isVisible().catch(() => false);
      teams.push({ name: team, visible: exists });
    }
    return { visible: true, teams };
  }

  // --- Filters ---

  async selectFilter(filterName, value) {
    this.log.info(`Setting filter ${filterName} to ${value}`);
    const combobox = this.page.getByRole('combobox', { name: filterName });
    await combobox.click();
    await this.page.waitForTimeout(TIMEOUTS.SHORT_WAIT);
    const option = this.page.getByRole('option', { name: value }).first();
    await option.click();
    await this.page.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);
  }

  async resetFilters() {
    this.log.info('Resetting all filters');
    const resetBtn = this.page.locator('text=Reset').first();
    if (await resetBtn.isVisible().catch(() => false)) {
      await resetBtn.click();
      await this.page.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);
    }
  }

  async clickBookmark(bookmarkName) {
    this.log.info(`Clicking bookmark: ${bookmarkName}`);
    const bookmark = this.page.locator(`text=${bookmarkName}`).first();
    await bookmark.click();
    await this.page.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);
  }

  // --- Navigation ---

  async switchToTab(tabName) {
    this.log.info(`Switching to tab: ${tabName}`);
    const tab = this.page.getByRole('tab', { name: tabName });
    await tab.click();
    await this.page.waitForTimeout(TIMEOUTS.LONG_WAIT);
  }

  async getCurrentTab() {
    const selectedTab = this.page.locator('[role="tab"][aria-selected="true"]');
    return await selectedTab.textContent();
  }
}
```

- [ ] **Step 3: Create FabricDetailedViewPage.js**

```javascript
import { BasePage } from './BasePage.js';
import { TIMEOUTS, FABRIC_SELECTORS } from '../config/constants.js';

export class FabricDetailedViewPage extends BasePage {
  constructor(page) {
    super(page, 'FabricDetailedView');
  }

  async verifyProgrammeTeamTables() {
    this.log.info('Verifying programme team tables');
    const teams = ['Africa', 'CEO', 'Climate'];
    const results = [];
    for (const team of teams) {
      const teamHeader = this.page.locator(`text=${team}`).first();
      const visible = await teamHeader.isVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE }).catch(() => false);
      results.push({ team, visible });
    }
    return results;
  }

  async verifyTableColumns() {
    this.log.info('Verifying Detailed View table columns');
    const expectedCols = ['Investment', 'Last Rated Date', 'Last Rating'];
    const results = [];
    for (const col of expectedCols) {
      const colHeader = this.page.locator(`text=${col}`).first();
      const visible = await colHeader.isVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE }).catch(() => false);
      results.push({ column: col, visible });
    }
    return results;
  }

  async verifyColorBars() {
    this.log.info('Verifying rating color bars legend');
    const legend = this.page.locator('text=Blue').first();
    const visible = await legend.isVisible().catch(() => false);
    return visible;
  }

  async filterByProgrammeManager(value) {
    this.log.info(`Filtering by Programme Manager: ${value}`);
    const filter = this.page.getByRole('combobox', { name: /Programme Manager/i });
    await filter.click();
    await this.page.waitForTimeout(TIMEOUTS.SHORT_WAIT);
    if (value !== 'All') {
      const option = this.page.getByRole('option', { name: value }).first();
      await option.click();
    }
    await this.page.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);
  }

  async filterByExecutiveDirector(value) {
    this.log.info(`Filtering by Executive Director: ${value}`);
    const filter = this.page.getByRole('combobox', { name: /Executive Director/i });
    await filter.click();
    await this.page.waitForTimeout(TIMEOUTS.SHORT_WAIT);
    if (value !== 'All') {
      const option = this.page.getByRole('option', { name: value }).first();
      await option.click();
    }
    await this.page.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);
  }

  async filterByInvestment(value) {
    this.log.info(`Filtering by Investment: ${value}`);
    const filter = this.page.getByRole('combobox', { name: /Investment/i });
    await filter.click();
    await this.page.waitForTimeout(TIMEOUTS.SHORT_WAIT);
    if (value !== 'All') {
      const option = this.page.getByRole('option', { name: value }).first();
      await option.click();
    }
    await this.page.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add pages/FabricLoginPage.js pages/FabricDashboardPage.js pages/FabricDetailedViewPage.js
git commit -m "feat: add Fabric page objects for Dashboard, DetailedView, and Login"
```

---

## Task 10: Extend CRM Page Objects (Update/Delete/Search)

**Files:**
- Modify: `pages/CRMOrganisationPage.js`
- Modify: `pages/CRMContactPage.js`

- [ ] **Step 1: Add update/delete/search methods to CRMOrganisationPage.js**

Read the file first, then add these methods to the class:

```javascript
async editOrganisation() {
  this.log.info('Clicking Edit on organisation');
  // CRM uses the form header area - click the name to enter edit mode
  // or look for an Edit button
  await this.page.keyboard.press('F2'); // CRM inline edit shortcut
  await this.page.waitForTimeout(TIMEOUTS.SHORT_WAIT);
}

async updateOrganisationName(newName) {
  this.log.info(`Updating org name to: ${newName}`);
  await this.fillOrganisationName(newName);
  await this.clickSaveButton();
  await this.page.waitForTimeout(TIMEOUTS.SAVE);
}

async updateFCRAFields(regNumber, expiryDate) {
  this.log.info('Updating FCRA fields');
  if (regNumber) await this.setFCRARegistrationNumber(regNumber);
  if (expiryDate) await this.setFCRAExpiryDate(expiryDate);
  await this.clickSaveButton();
}

async deleteOrganisation() {
  this.log.info('Attempting to delete organisation');
  // CRM may use Deactivate instead of Delete
  // Try Delete first, fall back to Deactivate
  const deleteBtn = this.page.getByRole('button', { name: /Delete/i });
  const deactivateBtn = this.page.getByRole('button', { name: /Deactivate/i });
  if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await deleteBtn.click();
    const confirmBtn = this.page.getByRole('button', { name: /Confirm|Delete|OK/i }).first();
    if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmBtn.click();
    }
  } else if (await deactivateBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    this.log.warn('Delete not available — using Deactivate');
    await deactivateBtn.click();
    const confirmBtn = this.page.getByRole('button', { name: /Confirm|Deactivate|OK/i }).first();
    if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmBtn.click();
    }
  } else {
    this.log.warn('Neither Delete nor Deactivate button found');
  }
  await this.page.waitForTimeout(TIMEOUTS.SAVE);
}
```

- [ ] **Step 2: Add update/delete/search methods to CRMContactPage.js**

Read the file first, then add similar methods:

```javascript
async updateContactFields(data) {
  this.log.info('Updating contact fields');
  if (data.firstName) await this.setFirstName(data.firstName);
  if (data.lastName) await this.setLastName(data.lastName);
  if (data.email) await this.setEmail(data.email);
  await this.clickSaveButton();
  await this.page.waitForTimeout(TIMEOUTS.SAVE);
}

async changePrimaryOrganisation(newOrgName) {
  this.log.info(`Changing primary org to: ${newOrgName}`);
  await this.setPrimaryOrganisation(newOrgName);
  await this.clickSaveButton();
}

async deleteContact() {
  this.log.info('Attempting to delete contact');
  const deleteBtn = this.page.getByRole('button', { name: /Delete/i });
  const deactivateBtn = this.page.getByRole('button', { name: /Deactivate/i });
  if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await deleteBtn.click();
    const confirmBtn = this.page.getByRole('button', { name: /Confirm|Delete|OK/i }).first();
    if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmBtn.click();
    }
  } else if (await deactivateBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    this.log.warn('Delete not available — using Deactivate');
    await deactivateBtn.click();
    const confirmBtn = this.page.getByRole('button', { name: /Confirm|Deactivate|OK/i }).first();
    if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmBtn.click();
    }
  }
  await this.page.waitForTimeout(TIMEOUTS.SAVE);
}
```

- [ ] **Step 3: Commit**

```bash
git add pages/CRMOrganisationPage.js pages/CRMContactPage.js
git commit -m "feat: add update/delete/search methods to CRM page objects"
```

---

## Task 11: Extend Fluxx Organisation Page Object

**Files:**
- Modify: `pages/FluxxOrganisationPage.js`

- [ ] **Step 1: Add workflow, detail sections, and edit/delete methods**

Read the file first, then add:

```javascript
async verifyWorkflowStatus(expectedStatus) {
  this.log.info(`Verifying workflow status: ${expectedStatus}`);
  const statusEl = this.page.locator(`text=Status: ${expectedStatus}`);
  return await statusEl.isVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE }).catch(() => false);
}

async verifyDetailSections(sections) {
  this.log.info('Verifying detail sections');
  const results = {};
  for (const section of sections) {
    const sectionEl = this.page.locator(`text=${section}`).first();
    results[section] = await sectionEl.isVisible().catch(() => false);
  }
  return results;
}

async verifyRecipientTypeDisplay(expectedType) {
  this.log.info(`Verifying recipient type: ${expectedType}`);
  const typeEl = this.page.locator(`text=${expectedType}`).first();
  return await typeEl.isVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE }).catch(() => false);
}

async editOrganisation(orgId) {
  this.log.info(`Editing organisation ID: ${orgId}`);
  const editLink = this.page.getByRole('link', { name: 'Edit' });
  await editLink.click();
  await this.page.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);
}

async deleteOrganisation(orgId) {
  this.log.info(`Deleting organisation ID: ${orgId}`);
  const deleteLink = this.page.locator('a').filter({ hasText: 'Delete' }).first();
  if (await deleteLink.isVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE }).catch(() => false)) {
    await deleteLink.click();
    const confirmBtn = this.page.getByRole('button', { name: /confirm|yes|ok|delete/i }).first();
    if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmBtn.click();
    }
    await this.page.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add pages/FluxxOrganisationPage.js
git commit -m "feat: add workflow, detail sections, edit/delete to FluxxOrganisationPage"
```

---

## Task 12: CRM Organisation Test Suite (extend with new tests)

**Files:**
- Modify: `tests/crm/organisation.spec.js`

- [ ] **Step 1: Read current file and add new test cases**

Add after existing tests. New tests: ORG_UPD_001-004, ORG_DEL_001-002, ORG_SEARCH_001-002, ORG_NEG_003-005. See spec Section 4.A for full descriptions.

Each test follows the existing pattern:
```javascript
test('ORG_UPD_001: Update organisation name', async ({ page }) => {
  log.section('ORG_UPD_001');
  // Create org first, then update
  log.step(1, 'Create org to update');
  const orgName = testData.generateOrgName('UpdTest');
  await crmOrg.createOrganisation({ name: orgName, requiredInFluxx: 'Yes', fluxxType: 'Individual' });

  log.step(2, 'Update org name');
  const newName = testData.generateOrgName('Updated');
  await crmOrg.updateOrganisationName(newName);

  log.step(3, 'Verify updated');
  await crmOrg.verifyOrganisationSaved(newName);
  log.success('ORG_UPD_001 PASSED');
});
```

- [ ] **Step 2: Run tests to verify**

```bash
npx playwright test --project=crm-setup --project=crm-tests --grep "ORG_UPD|ORG_DEL|ORG_SEARCH|ORG_NEG_003|ORG_NEG_004|ORG_NEG_005"
```

- [ ] **Step 3: Commit**

```bash
git add tests/crm/organisation.spec.js
git commit -m "feat: add update, delete, search, negative tests for CRM organisations"
```

---

## Task 13: CRM Contact Test Suite (extend with new tests)

**Files:**
- Modify: `tests/crm/contact.spec.js`

- [ ] **Step 1: Add new contact tests**

New tests: CONTACT_UPD_001-003, CONTACT_DEL_001, CONTACT_SEARCH_001-002, CONTACT_NEG_001-002, CONTACT_LINK_001-002. See spec Section 4.B.

- [ ] **Step 2: Run tests**

```bash
npx playwright test --project=crm-setup --project=crm-tests --grep "CONTACT_UPD|CONTACT_DEL|CONTACT_SEARCH|CONTACT_NEG|CONTACT_LINK"
```

- [ ] **Step 3: Commit**

```bash
git add tests/crm/contact.spec.js
git commit -m "feat: add update, delete, search, linking tests for CRM contacts"
```

---

## Task 14: Fluxx Organisation Test Suite (extend)

**Files:**
- Modify: `tests/fluxx/organisation.spec.js`

- [ ] **Step 1: Add new Fluxx org tests**

New tests: FLUXX_ORG_006-013. See spec Section 4.C. Tests cover partial search, empty results, update/delete verification, recipient types, org type display, detail sections, workflow status.

- [ ] **Step 2: Run tests**

```bash
npx playwright test --project=fluxx-setup --project=fluxx-tests --grep "FLUXX_ORG_0(0[6-9]|1[0-3])"
```

- [ ] **Step 3: Commit**

```bash
git add tests/fluxx/organisation.spec.js
git commit -m "feat: add search, update/delete verification, workflow tests for Fluxx orgs"
```

---

## Task 15: Fluxx People Test Suite (rename + extend)

**Files:**
- Rename: `tests/fluxx/contact.spec.js` → `tests/fluxx/people.spec.js`
- Modify: `tests/fluxx/people.spec.js`

- [ ] **Step 1: Rename file**

```bash
mv tests/fluxx/contact.spec.js tests/fluxx/people.spec.js
```

- [ ] **Step 2: Update imports and test IDs**

Replace `FluxxContactPage` imports with `FluxxPeoplePage`. Rename test IDs from `FLUXX_CONTACT_*` to `FLUXX_PEOPLE_*`.

- [ ] **Step 3: Add new People tests**

New tests: FLUXX_PEOPLE_006-011. See spec Section 4.D.

- [ ] **Step 4: Run tests**

```bash
npx playwright test --project=fluxx-setup --project=fluxx-tests --grep "FLUXX_PEOPLE"
```

- [ ] **Step 5: Commit**

```bash
git add tests/fluxx/people.spec.js
git rm tests/fluxx/contact.spec.js 2>/dev/null || true
git commit -m "feat: rename contact to people spec, add Quick Actions search and pagination tests"
```

---

## Task 16: Fluxx Investment Test Suite

**Files:**
- Create: `tests/fluxx/investment.spec.js`

- [ ] **Step 1: Create investment.spec.js**

10 tests: FLUXX_INV_001-008, FLUXX_INV_NEG_001-002. See spec Section 4.E. Follow existing test pattern with `test.describe`, `test.beforeEach`, `log.section/step/success`.

**Note:** Investment creation form fields are TBD. First run should explore the form and document selectors. Tests should be written with placeholder assertions that log discovered fields.

- [ ] **Step 2: Run tests**

```bash
npx playwright test --project=fluxx-setup --project=fluxx-tests --grep "FLUXX_INV"
```

- [ ] **Step 3: Commit**

```bash
git add tests/fluxx/investment.spec.js
git commit -m "feat: add Fluxx Investment CRUD test suite (10 tests)"
```

---

## Task 17: Fluxx Co-Funding Test Suite

**Files:**
- Create: `tests/fluxx/co-funding.spec.js`

- [ ] **Step 1: Create co-funding.spec.js**

7 tests: FLUXX_CF_001-006, FLUXX_CF_NEG_001. See spec Section 4.F. Same pattern as investment tests.

- [ ] **Step 2: Run tests**

```bash
npx playwright test --project=fluxx-setup --project=fluxx-tests --grep "FLUXX_CF"
```

- [ ] **Step 3: Commit**

```bash
git add tests/fluxx/co-funding.spec.js
git commit -m "feat: add Fluxx Co-Funding CRUD test suite (7 tests)"
```

---

## Task 18: Fluxx Read-Only Test Suite

**Files:**
- Create: `tests/fluxx/read-only.spec.js`

- [ ] **Step 1: Create read-only.spec.js**

7 tests: FLUXX_RO_REQ_001-002, FLUXX_RO_GRT_001-002, FLUXX_RO_RPT_001, FLUXX_RO_PAY_001, FLUXX_RO_AMD_001. See spec Section 4.G.

Each test switches to the module via Highlight Feed, verifies list view, opens a record, verifies detail.

- [ ] **Step 2: Run tests**

```bash
npx playwright test --project=fluxx-setup --project=fluxx-tests --grep "FLUXX_RO"
```

- [ ] **Step 3: Commit**

```bash
git add tests/fluxx/read-only.spec.js
git commit -m "feat: add Fluxx read-only test suite for Requests, Grants, Reports, Payments, Amendments"
```

---

## Task 19: Fabric Dashboard Test Suite

**Files:**
- Create: `tests/fabric/dashboard.spec.js`

- [ ] **Step 1: Create tests/fabric/ directory and dashboard.spec.js**

```bash
mkdir -p tests/fabric
```

11 tests: FAB_AUTH_001-002, FAB_OVW_001-006, FAB_NAV_001-002, FAB_NEG_001. See spec Sections 4.H Auth/Overview/Navigation.

```javascript
import { test, expect } from '@playwright/test';
import { FabricLoginPage } from '../../pages/FabricLoginPage.js';
import { FabricDashboardPage } from '../../pages/FabricDashboardPage.js';
import { Logger } from '../../utils/Logger.js';

const log = new Logger('FabricDashboardTests');

test.describe('Fabric Dashboard Tests', () => {
  let fabricLogin;
  let dashboard;

  test.beforeEach(async ({ page }) => {
    fabricLogin = new FabricLoginPage(page);
    dashboard = new FabricDashboardPage(page);
  });

  test('FAB_AUTH_001: SSO login to Fabric', async ({ page }) => {
    log.section('FAB_AUTH_001');
    await fabricLogin.navigateToWorkspace();
    const loaded = await fabricLogin.verifyWorkspaceLoaded();
    expect(loaded).toBeTruthy();
    log.success('FAB_AUTH_001 PASSED');
  });

  test('FAB_OVW_001: Overview page loads with title', async ({ page }) => {
    log.section('FAB_OVW_001');
    await fabricLogin.navigateToReport();
    await page.waitForTimeout(5000);
    const titleVisible = await dashboard.verifyReportTitle();
    expect(titleVisible).toBeTruthy();
    log.success('FAB_OVW_001 PASSED');
  });
  // ... remaining tests follow same pattern
});
```

- [ ] **Step 2: Run tests**

```bash
npx playwright test --project=fabric-setup --project=fabric-tests
```

- [ ] **Step 3: Commit**

```bash
git add tests/fabric/dashboard.spec.js
git commit -m "feat: add Fabric dashboard test suite (auth, overview, navigation)"
```

---

## Task 20: Fabric Filters + Detailed View Test Suites

**Files:**
- Create: `tests/fabric/filters.spec.js`
- Create: `tests/fabric/detailed-view.spec.js`

- [ ] **Step 1: Create filters.spec.js**

7 tests: FAB_FLT_001-007. See spec Section 4.H Filters.

- [ ] **Step 2: Create detailed-view.spec.js**

7 tests: FAB_DTV_001-007. See spec Section 4.H Detailed View.

- [ ] **Step 3: Run tests**

```bash
npx playwright test --project=fabric-setup --project=fabric-tests
```

- [ ] **Step 4: Commit**

```bash
git add tests/fabric/filters.spec.js tests/fabric/detailed-view.spec.js
git commit -m "feat: add Fabric filter and detailed view test suites"
```

---

## Task 21: Integration Tests — CRM-Fluxx Sync Extension

**Files:**
- Modify: `tests/integration/crm-fluxx-sync.spec.js`

- [ ] **Step 1: Add new sync tests**

7 new tests: SYNC_006-011, SYNC_NEG_001. See spec Section 4.I. Covers contact sync, update sync, delete sync, negative sync.

- [ ] **Step 2: Run tests**

```bash
npx playwright test --project=crm-setup --project=fluxx-setup --project=integration --grep "SYNC_0(0[6-9]|1[01])|SYNC_NEG"
```

- [ ] **Step 3: Commit**

```bash
git add tests/integration/crm-fluxx-sync.spec.js
git commit -m "feat: add contact sync, update/delete sync, negative sync to integration tests"
```

---

## Task 22: Integration Tests — Fluxx-Fabric Sync + E2E Pipeline

**Files:**
- Create: `tests/integration/fluxx-fabric-sync.spec.js`
- Create: `tests/integration/e2e-pipeline.spec.js`

- [ ] **Step 1: Create fluxx-fabric-sync.spec.js**

4 tests: FAB_SYNC_001-004. See spec Section 4.I. These validate pre-existing/last-refreshed Fabric data against Fluxx.

```javascript
test('FAB_SYNC_001: Fluxx Investment count matches Fabric KPI', async ({ page }) => {
  test.setTimeout(300000); // 5 minutes for cross-system
  log.section('FAB_SYNC_001');
  // ... navigate Fabric, read KPI, compare with expected
});
```

- [ ] **Step 2: Create e2e-pipeline.spec.js**

2 tests: E2E_001, E2E_002. See spec Section 4.I. Full CRM → Fluxx → Fabric pipeline.

```javascript
test('E2E_001: Full pipeline - org CRM → Fluxx → Fabric', async ({ page }) => {
  test.setTimeout(300000);
  log.section('E2E_001');
  // Step 1: Create org in CRM
  // Step 2: Wait for sync, verify in Fluxx
  // Step 3: Navigate to Fabric, verify dashboard loads with expected structure
});
```

- [ ] **Step 3: Run tests**

```bash
npx playwright test --project=integration --grep "FAB_SYNC|E2E"
```

- [ ] **Step 4: Commit**

```bash
git add tests/integration/fluxx-fabric-sync.spec.js tests/integration/e2e-pipeline.spec.js
git commit -m "feat: add Fluxx-Fabric sync and E2E pipeline tests"
```

---

## Task 23: Test Data Cleanup Integration

**Files:**
- Modify: All spec files that create data — add `afterAll` cleanup hooks

- [ ] **Step 1: Add cleanup hooks to each CRUD spec**

In every spec file that creates AUTO_UI_ data, add:

```javascript
import { testDataCleaner } from '../../utils/TestDataCleaner.js';

test.afterAll(async ({ browser }) => {
  const page = await browser.newPage();
  await testDataCleaner.cleanupAll(page);
  await page.close();
});
```

Track records during creation:
```javascript
// After successful creation, track the record:
testDataCleaner.trackRecord('fluxx', 'organisation', orgId, orgName);
```

- [ ] **Step 2: Add CLEANUP_005 verification test**

Add to `tests/integration/e2e-pipeline.spec.js` or a dedicated cleanup spec:

```javascript
test('CLEANUP_005: Verify no AUTO_UI_ records remain @cleanup', async ({ page }) => {
  // Search Fluxx for AUTO_UI_ prefix
  // Assert 0 results
});
```

- [ ] **Step 3: Run full suite to verify cleanup works**

```bash
npx playwright test
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: integrate test data cleanup hooks across all CRUD test suites"
```

---

## Task 24: Final Verification & Documentation

- [ ] **Step 1: Run the full test suite**

```bash
npm test
```

Verify all projects execute in order: crm-setup → fluxx-setup → fabric-setup → crm-tests → fluxx-tests → fabric-tests → integration

- [ ] **Step 2: Update .env.example with any new vars discovered**

- [ ] **Step 3: Update package.json version to 3.0.0**

```json
"version": "3.0.0"
```

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete CIFF E2E test automation suite v3.0.0 — 132 test cases across CRM, Fluxx, Fabric"
```
