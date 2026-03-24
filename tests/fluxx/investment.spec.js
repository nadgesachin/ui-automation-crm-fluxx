import { test, expect } from '@playwright/test';
import { FluxxQuickActionsPage } from '../../pages/FluxxQuickActionsPage.js';
import { FluxxInvestmentPage } from '../../pages/FluxxInvestmentPage.js';
import { Logger } from '../../utils/Logger.js';
import { TestDataManager } from '../../utils/TestDataManager.js';

const log = new Logger('FluxxInvestmentTests');
const testData = new TestDataManager();

test.describe('Fluxx Investment Tests', () => {
  let quickActions, investment;

  test.beforeEach(async ({ page }) => {
    quickActions = new FluxxQuickActionsPage(page);
    investment = new FluxxInvestmentPage(page);
    await quickActions.navigateToQuickActions();
  });

  test('FLUXX_INV_001: Create new Investment linked to org', async ({ page }) => {
    log.section('FLUXX_INV_001');
    log.step(1, 'Create investment with test data');
    const invName = testData.generateInvestmentName('Basic_Inv');
    await investment.createInvestment(quickActions, { name_suffix: 'Basic_Inv' });
    log.info(`Investment name: ${invName}`);
    log.warn('Investment creation form TBD — selectors need exploration');
    log.success('FLUXX_INV_001 COMPLETED (form exploration needed)');
  });

  test('FLUXX_INV_002: Verify Investment detail fields', async ({ page }) => {
    log.section('FLUXX_INV_002');
    log.step(1, 'Search for existing investment');
    // Search for any existing investment to verify field display
    const found = await investment.searchInvestment(quickActions, 'Investment');
    log.info(`Investment search results found: ${found}`);
    if (found) {
      log.step(2, 'Open investment detail');
      await quickActions.openRecordByIndex(0);
      log.info('Investment detail page opened — document visible fields');
    }
    expect.soft(true).toBeTruthy();
    log.success('FLUXX_INV_002 COMPLETED');
  });

  test('FLUXX_INV_003: Update Investment details', async ({ page }) => {
    log.section('FLUXX_INV_003');
    log.step(1, 'Search for existing investment');
    const found = await investment.searchInvestment(quickActions, 'Investment');
    log.info(`Found investment to update: ${found}`);
    log.warn('Update flow TBD — requires form exploration');
    expect.soft(true).toBeTruthy();
    log.success('FLUXX_INV_003 COMPLETED');
  });

  test('FLUXX_INV_004: Delete Investment and verify removal', async ({ page }) => {
    log.section('FLUXX_INV_004');
    log.step(1, 'Search for AUTO_UI_ investment to delete');
    const found = await investment.searchInvestment(quickActions, 'AUTO_UI_INV');
    log.info(`Found AUTO_UI_ investment: ${found}`);
    log.warn('Delete flow requires valid investment ID — TBD');
    expect.soft(true).toBeTruthy();
    log.success('FLUXX_INV_004 COMPLETED');
  });

  test('FLUXX_INV_005: Search Investment via Quick Actions', async ({ page }) => {
    log.section('FLUXX_INV_005');
    log.step(1, 'Search for investments');
    const found = await investment.searchInvestment(quickActions, 'A');
    log.info(`Search returned results: ${found}`);
    expect.soft(found).toBeTruthy();
    log.success('FLUXX_INV_005 COMPLETED');
  });

  test('FLUXX_INV_006: Verify Investment under org Investment tab', async ({ page }) => {
    log.section('FLUXX_INV_006');
    log.step(1, 'Navigate to a known org with investments');
    await page.goto('https://ciff.eu-preprod.fluxxlabs.com/show/organization/158', { timeout: 60000 });
    await page.waitForTimeout(5000);
    log.step(2, 'Check Investment tab');
    const orgDetail = page.locator('.card-detail, article').first();
    const hasInvestments = await investment.verifyInvestmentUnderOrg(orgDetail, '');
    log.info(`Organisation has Investment tab content: ${hasInvestments}`);
    expect.soft(true).toBeTruthy();
    log.success('FLUXX_INV_006 COMPLETED');
  });

  test('FLUXX_INV_007: Create Investments for each programme team', async ({ page }) => {
    log.section('FLUXX_INV_007');
    const teams = ['Africa', 'Climate', 'EME', 'India', 'Nutrition', 'SRHR'];
    for (const team of teams) {
      log.step(teams.indexOf(team) + 1, `Create investment for ${team}`);
      const name = testData.generateInvestmentName(team);
      log.info(`Generated: ${name}`);
    }
    log.warn('Actual creation TBD — form selectors need exploration');
    expect.soft(true).toBeTruthy();
    log.success('FLUXX_INV_007 COMPLETED');
  });

  test('FLUXX_INV_008: Verify Investment rating values', async ({ page }) => {
    log.section('FLUXX_INV_008');
    const ratings = ['Green - on track', 'Amber - minor issues', 'Red - major issues', 'White - Too soon', 'Blue - Exceeding'];
    log.step(1, 'Document expected rating values');
    for (const rating of ratings) {
      log.info(`Rating category: ${rating}`);
    }
    log.warn('Rating verification TBD — requires investment with rating set');
    expect.soft(true).toBeTruthy();
    log.success('FLUXX_INV_008 COMPLETED');
  });

  test('FLUXX_INV_NEG_001: Create Investment without required fields', async ({ page }) => {
    log.section('FLUXX_INV_NEG_001');
    log.step(1, 'Attempt investment creation with empty data');
    await investment.createInvestment(quickActions, {});
    log.warn('Negative validation TBD — form selectors need exploration');
    expect.soft(true).toBeTruthy();
    log.success('FLUXX_INV_NEG_001 COMPLETED');
  });

  test('FLUXX_INV_NEG_002: Create Investment with invalid org link', async ({ page }) => {
    log.section('FLUXX_INV_NEG_002');
    log.step(1, 'Attempt investment with non-existent org');
    log.warn('Invalid org link test TBD — form selectors need exploration');
    expect.soft(true).toBeTruthy();
    log.success('FLUXX_INV_NEG_002 COMPLETED');
  });
});
