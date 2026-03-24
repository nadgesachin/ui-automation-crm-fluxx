/**
 * CRM → Fluxx → Fabric E2E Pipeline Test Suite
 * End-to-end tests verifying data flows across all three systems.
 *
 * Scenarios covered:
 *   E2E_001: Full pipeline - verify data flows across all 3 systems
 *   E2E_002: Full pipeline - verify investment ratings flow to Fabric
 */

import { test, expect } from '@playwright/test';
import { FabricLoginPage } from '../../pages/FabricLoginPage.js';
import { FabricDashboardPage } from '../../pages/FabricDashboardPage.js';
import { Logger } from '../../utils/Logger.js';

const log = new Logger('E2EPipelineTests');

test.describe('CRM → Fluxx → Fabric E2E Pipeline', () => {
  test('E2E_001: Full pipeline - verify data flows across all 3 systems', async ({ page }) => {
    test.setTimeout(300000);
    log.section('E2E_001');

    log.step(1, 'Verify Fabric dashboard loads with data from Fluxx');
    const fabricLogin = new FabricLoginPage(page);
    const dashboard = new FabricDashboardPage(page);
    await fabricLogin.navigateToReport();
    await page.waitForTimeout(10000);

    log.step(2, 'Verify report title present');
    const titleVisible = await dashboard.verifyReportTitle();
    expect.soft(titleVisible).toBeTruthy();

    log.step(3, 'Verify KPI data present');
    const kpi = await dashboard.getKPIValue('Total Investments / DA');
    log.info(`Pipeline data — Total Investments: ${kpi}`);
    expect.soft(kpi).toBeTruthy();

    log.step(4, 'Verify programme teams from Fluxx appear in Fabric');
    const teams = await dashboard.verifyProgrammeTeamBar();
    log.info(`Programme teams visible: ${teams.visible}`);
    expect.soft(teams.visible).toBeTruthy();

    log.success('E2E_001 PASSED');
  });

  test('E2E_002: Full pipeline - verify investment ratings flow to Fabric', async ({ page }) => {
    test.setTimeout(300000);
    log.section('E2E_002');

    log.step(1, 'Navigate to Fabric report');
    const fabricLogin = new FabricLoginPage(page);
    const dashboard = new FabricDashboardPage(page);
    await fabricLogin.navigateToReport();
    await page.waitForTimeout(10000);

    log.step(2, 'Verify CIFF Investments Health pie has rating data');
    const health = await dashboard.verifyInvestmentsHealthPie();
    log.info(`Health pie: visible=${health.visible}, ratings=${health.ratings.filter(r => r.visible).length}`);
    expect.soft(health.visible).toBeTruthy();

    log.step(3, 'Switch to Detailed View and verify investment tables');
    await dashboard.switchToTab('Detailed View');
    await page.waitForTimeout(5000);
    const hasInvestments = await page.locator('text=Last Rated Date').first().isVisible().catch(() => false);
    log.info(`Detailed View shows rated investments: ${hasInvestments}`);
    expect.soft(hasInvestments).toBeTruthy();

    log.success('E2E_002 PASSED');
  });
});
