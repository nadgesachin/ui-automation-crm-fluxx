import { test, expect } from '@playwright/test';
import { FluxxQuickActionsPage } from '../../pages/FluxxQuickActionsPage.js';
import { FluxxReadOnlyPage } from '../../pages/FluxxReadOnlyPage.js';
import { Logger } from '../../utils/Logger.js';

const log = new Logger('FluxxReadOnlyTests');

test.describe('Fluxx Read-Only Module Tests', () => {
  let quickActions, readOnly;

  test.beforeEach(async ({ page }) => {
    quickActions = new FluxxQuickActionsPage(page);
    readOnly = new FluxxReadOnlyPage(page);
    await quickActions.navigateToQuickActions();
  });

  test('FLUXX_RO_REQ_001: Verify Requests list view', async ({ page }) => {
    log.section('FLUXX_RO_REQ_001');
    log.step(1, 'Switch to Requests model');
    await readOnly.switchToModule(quickActions, 'Requests');
    log.step(2, 'Verify list view loaded');
    const loaded = await readOnly.verifyListViewLoaded(quickActions);
    log.info(`Requests list loaded: ${loaded}`);
    expect(loaded).toBeTruthy();
    log.success('FLUXX_RO_REQ_001 PASSED');
  });

  test('FLUXX_RO_REQ_002: Open Request record and verify detail', async ({ page }) => {
    log.section('FLUXX_RO_REQ_002');
    log.step(1, 'Switch to Requests');
    await readOnly.switchToModule(quickActions, 'Requests');
    log.step(2, 'Open first record');
    await readOnly.openFirstRecord(quickActions);
    log.step(3, 'Verify detail page');
    const detailLoaded = await readOnly.verifyDetailPageLoaded();
    log.info(`Request detail loaded: ${detailLoaded}`);
    expect.soft(detailLoaded).toBeTruthy();
    log.success('FLUXX_RO_REQ_002 PASSED');
  });

  test('FLUXX_RO_GRT_001: Verify Grants list view', async ({ page }) => {
    log.section('FLUXX_RO_GRT_001');
    log.step(1, 'Switch to Grants model');
    await readOnly.switchToModule(quickActions, 'Grants');
    log.step(2, 'Verify list view');
    const loaded = await readOnly.verifyListViewLoaded(quickActions);
    log.info(`Grants list loaded: ${loaded}`);
    expect(loaded).toBeTruthy();
    log.success('FLUXX_RO_GRT_001 PASSED');
  });

  test('FLUXX_RO_GRT_002: Open Grant record and verify detail', async ({ page }) => {
    log.section('FLUXX_RO_GRT_002');
    log.step(1, 'Switch to Grants');
    await readOnly.switchToModule(quickActions, 'Grants');
    log.step(2, 'Open first record');
    await readOnly.openFirstRecord(quickActions);
    log.step(3, 'Verify detail');
    const detailLoaded = await readOnly.verifyDetailPageLoaded();
    log.info(`Grant detail loaded: ${detailLoaded}`);
    expect.soft(detailLoaded).toBeTruthy();
    log.success('FLUXX_RO_GRT_002 PASSED');
  });

  test('FLUXX_RO_RPT_001: Verify Reports list view', async ({ page }) => {
    log.section('FLUXX_RO_RPT_001');
    log.step(1, 'Switch to Reports model');
    await readOnly.switchToModule(quickActions, 'Reports');
    log.step(2, 'Verify list view');
    const loaded = await readOnly.verifyListViewLoaded(quickActions);
    log.info(`Reports list loaded: ${loaded}`);
    expect(loaded).toBeTruthy();
    log.success('FLUXX_RO_RPT_001 PASSED');
  });

  test('FLUXX_RO_PAY_001: Verify Payments list view', async ({ page }) => {
    log.section('FLUXX_RO_PAY_001');
    log.step(1, 'Switch to Payments model');
    await readOnly.switchToModule(quickActions, 'Payments');
    log.step(2, 'Verify list view');
    const loaded = await readOnly.verifyListViewLoaded(quickActions);
    log.info(`Payments list loaded: ${loaded}`);
    expect(loaded).toBeTruthy();
    log.success('FLUXX_RO_PAY_001 PASSED');
  });

  test('FLUXX_RO_AMD_001: Verify Amendments list view', async ({ page }) => {
    log.section('FLUXX_RO_AMD_001');
    log.step(1, 'Switch to Amendments model');
    await readOnly.switchToModule(quickActions, 'Amendments');
    log.step(2, 'Verify list view');
    const loaded = await readOnly.verifyListViewLoaded(quickActions);
    log.info(`Amendments list loaded: ${loaded}`);
    expect(loaded).toBeTruthy();
    log.success('FLUXX_RO_AMD_001 PASSED');
  });
});
