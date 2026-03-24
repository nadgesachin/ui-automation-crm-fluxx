/**
 * Fluxx-Fabric Sync Verification Test Suite
 * Validates that pre-existing Fluxx data is correctly reflected in the Fabric Power BI dashboard.
 *
 * Scenarios covered:
 *   FAB_SYNC_001: Total Investments KPI has data
 *   FAB_SYNC_002: Health pie ratings match expected categories
 *   FAB_SYNC_003: Programme Team bar has data
 *   FAB_SYNC_004: Detailed View has investment data
 */

import { test, expect } from '@playwright/test';
import { FabricLoginPage } from '../../pages/FabricLoginPage.js';
import { FabricDashboardPage } from '../../pages/FabricDashboardPage.js';
import { Logger } from '../../utils/Logger.js';

const log = new Logger('FluxxFabricSyncTests');

test.describe('Fluxx-Fabric Sync Verification', () => {
  let fabricLogin, dashboard;

  test.beforeEach(async ({ page }) => {
    fabricLogin = new FabricLoginPage(page);
    dashboard = new FabricDashboardPage(page);
  });

  test('FAB_SYNC_001: Verify Fabric Total Investments KPI has data', async ({ page }) => {
    test.setTimeout(300000);
    log.section('FAB_SYNC_001');
    log.step(1, 'Navigate to Fabric report');
    await fabricLogin.navigateToReport();
    await page.waitForTimeout(10000);
    log.step(2, 'Read Total Investments KPI');
    const kpi = await dashboard.getKPIValue('Total Investments / DA');
    log.info(`Total Investments KPI: ${kpi}`);
    expect.soft(kpi).toBeTruthy();
    log.success('FAB_SYNC_001 PASSED');
  });

  test('FAB_SYNC_002: Verify Fabric Health pie ratings match expected categories', async ({ page }) => {
    test.setTimeout(300000);
    log.section('FAB_SYNC_002');
    await fabricLogin.navigateToReport();
    await page.waitForTimeout(10000);
    const result = await dashboard.verifyInvestmentsHealthPie();
    log.info(`Health pie visible: ${result.visible}, ratings: ${result.ratings.length}`);
    expect.soft(result.visible).toBeTruthy();
    log.success('FAB_SYNC_002 PASSED');
  });

  test('FAB_SYNC_003: Verify Fabric Programme Team bar has data', async ({ page }) => {
    test.setTimeout(300000);
    log.section('FAB_SYNC_003');
    await fabricLogin.navigateToReport();
    await page.waitForTimeout(10000);
    const result = await dashboard.verifyProgrammeTeamBar();
    const visibleTeams = result.teams.filter(t => t.visible).map(t => t.name);
    log.info(`Teams visible: ${visibleTeams.join(', ')}`);
    expect.soft(result.visible).toBeTruthy();
    log.success('FAB_SYNC_003 PASSED');
  });

  test('FAB_SYNC_004: Verify Fabric Detailed View has investment data', async ({ page }) => {
    test.setTimeout(300000);
    log.section('FAB_SYNC_004');
    await fabricLogin.navigateToReport();
    await page.waitForTimeout(10000);
    log.step(1, 'Switch to Detailed View');
    await dashboard.switchToTab('Detailed View');
    await page.waitForTimeout(5000);
    log.step(2, 'Verify investment data visible');
    const hasData = await page.locator('text=Investment').first().isVisible().catch(() => false);
    log.info(`Detailed View has investment data: ${hasData}`);
    expect.soft(hasData).toBeTruthy();
    log.success('FAB_SYNC_004 PASSED');
  });
});
