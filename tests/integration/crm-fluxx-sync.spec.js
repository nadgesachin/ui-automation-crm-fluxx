/**
 * CRM-Fluxx Integration Sync Test Suite
 * End-to-end tests: Create organisation in CRM → Verify sync to Fluxx.
 *
 * Architecture:
 *   - Uses saved CRM session state (from crm-setup project)
 *   - Creates a fresh Fluxx context with inline SSO login
 *   - Handles sync delay with polling retry (up to 2 minutes)
 *
 * Scenarios covered:
 *   SYNC_001: Basic US organisation sync
 *   SYNC_002: India organisation with FCRA sync
 *   SYNC_003: India organisation with Non-FCRA sync
 *   SYNC_004: Verify detailed field mapping in Fluxx
 *   SYNC_005: Batch sync - multiple organisations
 */

import { test, expect } from '@playwright/test';
import { CRMLoginPage } from '../../pages/CRMLoginPage.js';
import { CRMOrganisationPage } from '../../pages/CRMOrganisationPage.js';
import { FluxxLoginPage } from '../../pages/FluxxLoginPage.js';
import { FluxxOrganisationPage } from '../../pages/FluxxOrganisationPage.js';
import { AUTO_PREFIX, FLUXX_DETAIL_FIELDS } from '../../config/constants.js';
import { Logger } from '../../utils/Logger.js';
import { TestHelper } from '../../pages/TestHelper.js';

const log = new Logger('Integration');

test.describe('CRM-Fluxx Integration Sync Tests', () => {

  /**
   * Helper: Set up CRM and Fluxx pages
   * CRM uses saved session, Fluxx does inline SSO login
   */
  async function setupContexts(browser, context) {
    // CRM page (uses saved session from crm-setup)
    const crmPage = await context.newPage();

    // Fluxx page (fresh context, inline SSO login)
    const fluxxContext = await browser.newContext({
      bypassCSP: true,
      ignoreHTTPSErrors: true,
    });
    const fluxxPage = await fluxxContext.newPage();

    return { crmPage, fluxxPage, fluxxContext };
  }

  /**
   * Helper: Cleanup pages and contexts
   */
  async function cleanup({ crmPage, fluxxPage, fluxxContext }) {
    if (crmPage) await crmPage.close().catch(() => {});
    if (fluxxPage) await fluxxPage.close().catch(() => {});
    if (fluxxContext) await fluxxContext.close().catch(() => {});
  }

  // ===================== SYNC_001: Basic US Organisation =====================
  test('SYNC_001: Create US organisation in CRM and verify sync to Fluxx', async ({ browser, context }) => {
    log.section('SYNC_001: US Organisation Sync');
    const startTime = Date.now();

    const { crmPage, fluxxPage, fluxxContext } = await setupContexts(browser, context);

    try {
      // STEP 1: Create organisation in CRM
      log.step(1, 'Create organisation in CRM');
      const crmLogin = new CRMLoginPage(crmPage);
      const crmOrg = new CRMOrganisationPage(crmPage);

      await crmLogin.navigateToModule('organisation');

      const orgName = await crmOrg.createOrganisation({
        name: crmOrg.generateOrganisationName('US_Sync'),
        requiredInFluxx: 'Yes',
        fluxxType: 'Individual',
        country: 'United States',
        city: 'New York',
      });

      // Verify saved in CRM
      await expect(crmPage.locator('#formHeaderTitle_2')).toContainText(orgName, { timeout: 30000 });
      log.success(`Organisation created in CRM: ${orgName}`);

      // STEP 2: Login to Fluxx
      log.step(2, 'Login to Fluxx');
      const fluxxLogin = new FluxxLoginPage(fluxxPage);
      await fluxxLogin.login();

      // STEP 3: Search with retry (handles sync delay)
      log.step(3, 'Search for organisation in Fluxx (with sync polling)');
      const fluxxOrg = new FluxxOrganisationPage(fluxxPage);
      await fluxxOrg.navigateToOrganisationSearch();

      const found = await fluxxOrg.searchWithRetry(orgName);
      expect(found).toBe(true);
      log.success(`Organisation synced to Fluxx: ${orgName}`);

      // STEP 4: Verify details
      log.step(4, 'Verify organisation details');
      const detailPage = await fluxxOrg.openRecordDetail();

      if (detailPage) {
        await expect(detailPage.locator(FLUXX_DETAIL_FIELDS.ORG_TYPE)).toContainText('Individual');
        log.success('Organisation type verified');
        await detailPage.close();
      }

      log.success(`SYNC_001 PASSED (${TestHelper.getElapsedTime(startTime)})`);

    } finally {
      await cleanup({ crmPage, fluxxPage, fluxxContext });
    }
  });

  // ===================== SYNC_002: India + FCRA =====================
  test('SYNC_002: Create India organisation with FCRA and verify sync', async ({ browser, context }) => {
    log.section('SYNC_002: India FCRA Sync');
    const startTime = Date.now();

    const { crmPage, fluxxPage, fluxxContext } = await setupContexts(browser, context);

    try {
      // STEP 1: Create India org in CRM
      log.step(1, 'Create India organisation with FCRA in CRM');
      const crmLogin = new CRMLoginPage(crmPage);
      const crmOrg = new CRMOrganisationPage(crmPage);

      await crmLogin.navigateToModule('organisation');

      const fcraRegNumber = `${AUTO_PREFIX}FCRA_${Date.now().toString().slice(-6)}`;
      const orgName = await crmOrg.createIndiaOrganisationWithFCRA({
        name: crmOrg.generateOrganisationName('India_FCRA_Sync'),
        fluxxType: 'Individual',
        city: 'Mumbai',
        recipientType: 'Grantee',
        fcraStatus: 'FCRA',
        fcraRegNumber,
        fcraExpiryDate: '12-04-2027',
      });

      await expect(crmPage.locator('#formHeaderTitle_2')).toContainText(orgName, { timeout: 30000 });
      log.success(`India org created: ${orgName}`);

      // STEP 2: Login to Fluxx
      log.step(2, 'Login to Fluxx');
      const fluxxLogin = new FluxxLoginPage(fluxxPage);
      await fluxxLogin.login();

      // STEP 3: Search with retry
      log.step(3, 'Search for India org in Fluxx');
      const fluxxOrg = new FluxxOrganisationPage(fluxxPage);
      await fluxxOrg.navigateToOrganisationSearch();

      const found = await fluxxOrg.searchWithRetry(orgName);
      expect(found).toBe(true);

      // STEP 4: Verify FCRA details
      log.step(4, 'Verify FCRA details in Fluxx');
      const detailPage = await fluxxOrg.openRecordDetail();

      if (detailPage) {
        await expect(detailPage.locator(FLUXX_DETAIL_FIELDS.RECIPIENT_TYPE)).toContainText('Grantee');
        await expect(detailPage.locator(FLUXX_DETAIL_FIELDS.FCRA_STATUS)).toContainText('FCRA');
        await expect(detailPage.locator(FLUXX_DETAIL_FIELDS.FCRA_REGISTRATION_NUMBER)).toContainText(fcraRegNumber);
        await expect(detailPage.locator(FLUXX_DETAIL_FIELDS.ORG_TYPE)).toContainText('Individual');
        log.success('All FCRA fields verified');
        await detailPage.close();
      }

      log.success(`SYNC_002 PASSED (${TestHelper.getElapsedTime(startTime)})`);

    } finally {
      await cleanup({ crmPage, fluxxPage, fluxxContext });
    }
  });

  // ===================== SYNC_003: India + Non-FCRA =====================
  test('SYNC_003: Create India org with Non-FCRA and verify sync', async ({ browser, context }) => {
    log.section('SYNC_003: India Non-FCRA Sync');
    const startTime = Date.now();

    const { crmPage, fluxxPage, fluxxContext } = await setupContexts(browser, context);

    try {
      // Create India org with Non-FCRA
      const crmLogin = new CRMLoginPage(crmPage);
      const crmOrg = new CRMOrganisationPage(crmPage);
      await crmLogin.navigateToModule('organisation');

      const orgName = crmOrg.generateOrganisationName('India_NonFCRA_Sync');

      await crmOrg.clickNewButton();
      await crmOrg.waitForFormToLoad();
      await crmOrg.fillOrganisationName(orgName);
      await crmOrg.setRequiredInFluxx('Yes');
      await crmOrg.setCountry('India');
      await crmOrg.setFluxxOrganisationType('Individual');
      await crmOrg.setCity('Delhi');
      await crmOrg.setRecipientType('Grantee');
      await crmOrg.setFCRAStatus('Non-FCRA');
      await crmOrg.saveOrganisation();

      await expect(crmPage.locator('#formHeaderTitle_2')).toContainText(orgName, { timeout: 30000 });
      log.success(`India Non-FCRA org created: ${orgName}`);

      // Fluxx verification
      const fluxxLogin = new FluxxLoginPage(fluxxPage);
      await fluxxLogin.login();

      const fluxxOrg = new FluxxOrganisationPage(fluxxPage);
      await fluxxOrg.navigateToOrganisationSearch();

      const found = await fluxxOrg.searchWithRetry(orgName);
      expect(found).toBe(true);

      const detailPage = await fluxxOrg.openRecordDetail();
      if (detailPage) {
        await expect(detailPage.locator(FLUXX_DETAIL_FIELDS.RECIPIENT_TYPE)).toContainText('Grantee');
        await expect(detailPage.locator(FLUXX_DETAIL_FIELDS.FCRA_STATUS)).toContainText('Non-FCRA');
        log.success('Non-FCRA status verified in Fluxx');
        await detailPage.close();
      }

      log.success(`SYNC_003 PASSED (${TestHelper.getElapsedTime(startTime)})`);

    } finally {
      await cleanup({ crmPage, fluxxPage, fluxxContext });
    }
  });

  // ===================== SYNC_004: Full Field Verification =====================
  test('SYNC_004: Verify complete field mapping between CRM and Fluxx', async ({ browser, context }) => {
    log.section('SYNC_004: Complete Field Mapping');
    const startTime = Date.now();

    const { crmPage, fluxxPage, fluxxContext } = await setupContexts(browser, context);

    try {
      const crmLogin = new CRMLoginPage(crmPage);
      const crmOrg = new CRMOrganisationPage(crmPage);
      await crmLogin.navigateToModule('organisation');

      const fcraRegNumber = `${AUTO_PREFIX}FCRA_FULL_${Date.now().toString().slice(-6)}`;
      const orgName = await crmOrg.createIndiaOrganisationWithFCRA({
        name: crmOrg.generateOrganisationName('FullField_Sync'),
        fluxxType: 'Individual',
        city: 'Bangalore',
        recipientType: 'Grantee',
        fcraStatus: 'FCRA',
        fcraRegNumber,
        fcraExpiryDate: '15-06-2027',
      });

      await expect(crmPage.locator('#formHeaderTitle_2')).toContainText(orgName, { timeout: 30000 });

      // Fluxx verification
      const fluxxLogin = new FluxxLoginPage(fluxxPage);
      await fluxxLogin.login();

      const fluxxOrg = new FluxxOrganisationPage(fluxxPage);
      await fluxxOrg.navigateToOrganisationSearch();

      const found = await fluxxOrg.searchWithRetry(orgName);
      expect(found).toBe(true);

      const detailPage = await fluxxOrg.openRecordDetail();
      if (detailPage) {
        // Full field verification
        const verification = await fluxxOrg.verifyOrganisationDetails(detailPage, {
          organisationName: orgName,
          organisationType: 'Individual',
          recipientType: 'Grantee',
          fcraStatus: 'FCRA',
          fcraRegistrationNumber: fcraRegNumber,
        });

        expect(verification.passed).toBe(true);
        log.success('All fields verified in Fluxx');
        await detailPage.close();
      }

      log.success(`SYNC_004 PASSED (${TestHelper.getElapsedTime(startTime)})`);

    } finally {
      await cleanup({ crmPage, fluxxPage, fluxxContext });
    }
  });

  // ===================== SYNC_005: Batch Sync =====================
  test('SYNC_005: Batch sync - create multiple orgs and verify all in Fluxx', async ({ browser, context }) => {
    log.section('SYNC_005: Batch Sync');
    const startTime = Date.now();

    const { crmPage, fluxxPage, fluxxContext } = await setupContexts(browser, context);

    try {
      const crmLogin = new CRMLoginPage(crmPage);
      const crmOrg = new CRMOrganisationPage(crmPage);
      await crmLogin.navigateToModule('organisation');

      // Create org 1: US Individual
      const orgName1 = await crmOrg.createOrganisation({
        name: crmOrg.generateOrganisationName('Batch_US'),
        requiredInFluxx: 'Yes',
        fluxxType: 'Individual',
        country: 'United States',
        city: 'San Francisco',
      });
      await expect(crmPage.locator('#formHeaderTitle_2')).toContainText(orgName1, { timeout: 30000 });

      // Navigate back to org list for second creation
      await crmLogin.navigateToOrganisation();

      // Create org 2: India Grantee FCRA
      const orgName2 = await crmOrg.createIndiaOrganisationWithFCRA({
        name: crmOrg.generateOrganisationName('Batch_India'),
        fluxxType: 'Individual',
        city: 'Hyderabad',
        recipientType: 'Grantee',
        fcraStatus: 'FCRA',
        fcraExpiryDate: '01-01-2028',
      });
      await expect(crmPage.locator('#formHeaderTitle_2')).toContainText(orgName2, { timeout: 30000 });

      log.success(`Created 2 organisations: ${orgName1}, ${orgName2}`);

      // Fluxx verification
      const fluxxLogin = new FluxxLoginPage(fluxxPage);
      await fluxxLogin.login();

      const fluxxOrg = new FluxxOrganisationPage(fluxxPage);
      await fluxxOrg.navigateToOrganisationSearch();

      // Verify org 1
      log.info(`Verifying org 1: ${orgName1}`);
      const found1 = await fluxxOrg.searchWithRetry(orgName1);
      expect(found1).toBe(true);

      // Verify org 2
      log.info(`Verifying org 2: ${orgName2}`);
      const found2 = await fluxxOrg.searchWithRetry(orgName2);
      expect(found2).toBe(true);

      log.success(`SYNC_005 PASSED: Both orgs synced (${TestHelper.getElapsedTime(startTime)})`);

    } finally {
      await cleanup({ crmPage, fluxxPage, fluxxContext });
    }
  });
});
