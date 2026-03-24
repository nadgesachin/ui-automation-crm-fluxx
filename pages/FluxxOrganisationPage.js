/**
 * Fluxx Organisation Page Object
 * Handles organisation search, filtering, and detail verification in Fluxx.
 *
 * Important: Uses Quick Actions Hub with highlight-feed-quick-filter-input
 * (confirmed from working test), NOT AG Grid filter.
 */

import { BasePage } from './BasePage.js';
import { getFluxxConfig } from '../config/environments.js';
import { TIMEOUTS, SYNC_RETRY, FLUXX_DETAIL_FIELDS } from '../config/constants.js';

export class FluxxOrganisationPage extends BasePage {
  constructor(page) {
    super(page, 'FluxxOrganisation');

    const config = getFluxxConfig();
    this.fluxxBaseURL = config.baseURL;
    this.dashboardURL = config.dashboardURL;

    // Quick Actions Hub selectors (from working test)
    this.quickActionsHub = page.getByLabel('Open Quick Actions Hub');
    this.quickFilterInput = page.getByPlaceholder('Search records');
    this.quickFilterInputFallback = page.getByTestId('highlight-feed-quick-filter-input');
    this.openRecordButton = page.getByTestId('open-record-detail-button');

    // Grid/table selectors (fallback)
    this.organisationTable = page.locator('[role="grid"]');
    this.recordRows = page.locator('tr[role="row"]');
  }

  /**
   * Navigate to Fluxx Quick Actions (organisation search)
   */
  async navigateToOrganisationSearch() {
    this.log.info('Navigating to Fluxx organisation search...');
    await this.navigate(this.dashboardURL);
    await this.page.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);
  }

  /**
   * Open Quick Actions Hub
   */
  async openQuickActions() {
    this.log.info('Ensuring Quick Actions Hub is ready...');
    try {
      // If we're already on Quick Actions Hub, just wait for it to be ready
      const url = this.page.url();
      if (url.includes('/central/quick-actions')) {
        this.log.debug('Already on Quick Actions Hub');
        await this.page.waitForTimeout(TIMEOUTS.SHORT_WAIT);
        return;
      }
      // Navigate directly instead of clicking link (which opens new tab)
      await this.navigateToOrganisationSearch();
    } catch (error) {
      this.log.debug('Quick Actions Hub navigation issue, continuing...');
    }
  }

  /**
   * Search for organisation using quick filter
   * @param {string} organisationName - Name to search for
   */
  async searchOrganisation(organisationName) {
    this.log.info(`Searching for: ${organisationName}`);

    await this.openQuickActions();

    try {
      // Ensure the Organisations tab is active in the Highlight Feed
      const orgTab = this.page.locator('text=/Organisati/').first();
      if (await orgTab.isVisible({ timeout: 5000 }).catch(() => false)) {
        await orgTab.click();
        await this.page.waitForTimeout(TIMEOUTS.SHORT_WAIT);
      }

      // Try primary selector (placeholder), then fallback (testid)
      let searchInput = this.quickFilterInput;
      if (!await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        this.log.info('Primary search input not found, trying fallback selector');
        searchInput = this.quickFilterInputFallback;
      }

      await this.waitForVisible(searchInput, TIMEOUTS.ELEMENT_VISIBLE);
      await searchInput.fill('');
      await searchInput.fill(organisationName);
      await searchInput.press('Enter');
      // Wait longer for search results to load
      await this.page.waitForTimeout(TIMEOUTS.LONG_WAIT);
    } catch (error) {
      this.log.error('Quick filter search failed', error);
      throw error;
    }
  }

  /**
   * Check if organisation exists in current search results
   * @param {string} organisationName - Name to look for
   * @returns {Promise<boolean>}
   */
  async organisationExists(organisationName) {
    try {
      // Strategy 1: Check if "Open record" link/button is visible (means search returned results)
      const openRecordLink = this.page.getByRole('link', { name: 'Open record' }).first();
      if (await this.openRecordButton.isVisible({ timeout: TIMEOUTS.ACTION }).catch(() => false)) {
        this.log.info('Search returned results (open-record button visible)');
        return true;
      }
      if (await openRecordLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        this.log.info('Search returned results (open-record link visible)');
        return true;
      }
      // Strategy 2: Check in the Highlight Feed table rows
      const tableCell = this.page.locator('td', { hasText: organisationName }).first();
      if (await tableCell.isVisible({ timeout: 3000 }).catch(() => false)) {
        return true;
      }
      // Strategy 3: Check for text anywhere on page
      const orgLocator = this.page.locator(`text=${organisationName}`);
      return await orgLocator.isVisible({ timeout: 3000 }).catch(() => false);
    } catch {
      return false;
    }
  }

  /**
   * Search for organisation with retry logic (handles CRM-Fluxx sync delay)
   * @param {string} organisationName - Name to search for
   * @param {number} [maxRetries] - Max retry attempts
   * @param {number} [delayMs] - Delay between retries in ms
   * @returns {Promise<boolean>} True if organisation found
   */
  async searchWithRetry(organisationName, options = {}) {
    const maxRetries = options.maxRetries || SYNC_RETRY.MAX_RETRIES;
    const delayMs = options.retryDelayMs || options.delayMs || SYNC_RETRY.DELAY_MS;
    this.log.subsection(`Searching with retry (max ${maxRetries} attempts, ${delayMs}ms delay)`);
    this.log.info(`Target: ${organisationName}`);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.log.info(`Attempt ${attempt}/${maxRetries}...`);

        // Navigate to Quick Actions for fresh search (avoid page.reload which loses context)
        await this.navigateToOrganisationSearch();

        // Search
        await this.searchOrganisation(organisationName);

        // Check result
        const exists = await this.organisationExists(organisationName);
        if (exists) {
          this.log.success(`Organisation found on attempt ${attempt}`);
          return true;
        }

        this.log.info(`Not found on attempt ${attempt}, waiting ${delayMs}ms...`);
        if (attempt < maxRetries) {
          await this.page.waitForTimeout(delayMs);
        }
      } catch (error) {
        this.log.warn(`Error on attempt ${attempt}: ${error.message}`);
        if (attempt < maxRetries) {
          await this.page.waitForTimeout(delayMs);
        }
      }
    }

    this.log.fail(`Organisation not found after ${maxRetries} attempts`);
    return false;
  }

  /**
   * Open organisation record detail (opens in popup)
   * @returns {Promise<import('@playwright/test').Page|null>} Detail page or null
   */
  async openRecordDetail() {
    this.log.info('Opening record detail...');

    try {
      // Strategy 1: Get the "Open record" link href and navigate directly
      const openLink = this.page.getByRole('link', { name: 'Open record' }).first();
      const linkVisible = await openLink.isVisible({ timeout: 5000 }).catch(() => false);

      if (linkVisible) {
        const href = await openLink.getAttribute('href');
        if (href) {
          this.log.info(`Navigating directly to record: ${href}`);
          const fullUrl = href.startsWith('http') ? href : `${this.fluxxBaseURL}${href}`;
          await this.page.goto(fullUrl, { timeout: TIMEOUTS.NAVIGATION });
          await this.page.waitForTimeout(TIMEOUTS.LONG_WAIT);
          // Wait for loading to finish
          try {
            await this.page.locator('text=Loading dashboard').waitFor({ state: 'hidden', timeout: 20000 });
          } catch {
            this.log.debug('No loading indicator or already loaded');
          }
          await this.page.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);
          return this.page;
        }
      }

      // Strategy 2: Try testid button with popup
      const isVisible = await this.isVisible(this.openRecordButton);
      if (!isVisible) {
        this.log.warn('Open record button/link not visible');
        return null;
      }

      const page1Promise = this.page.waitForEvent('popup', { timeout: 10000 });
      await this.openRecordButton.click();
      const detailPage = await page1Promise;

      // Wait for the detail page to fully load (past the "Loading dashboard" splash)
      this.log.info('Waiting for detail page to fully load...');
      await detailPage.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
      await detailPage.waitForTimeout(TIMEOUTS.LONG_WAIT);

      // Wait until "Loading dashboard" disappears
      try {
        await detailPage.locator('text=Loading dashboard').waitFor({ state: 'hidden', timeout: 20000 });
        this.log.info('Dashboard loading completed');
      } catch {
        this.log.debug('No loading indicator found or already loaded');
      }

      await detailPage.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);
      this.log.info('Record detail opened');
      return detailPage;
    } catch (error) {
      this.log.error('Error opening record detail', error);
      return null;
    }
  }

  /**
   * Verify organisation details on the detail page
   * @param {import('@playwright/test').Page} detailPage - The detail popup page
   * @param {Object} expectedDetails - Expected field values
   * @param {string} [expectedDetails.organisationName]
   * @param {string} [expectedDetails.organisationType]
   * @param {string} [expectedDetails.recipientType]
   * @param {string} [expectedDetails.fcraStatus]
   * @param {string} [expectedDetails.fcraRegistrationNumber]
   * @param {string} [expectedDetails.fcraExpiryDate]
   * @returns {Promise<Object>} Verification results { passed: boolean, details: {} }
   */
  async verifyOrganisationDetails(detailPage, expectedDetails = {}) {
    this.log.subsection('Verifying Organisation Details');

    if (!detailPage) {
      this.log.warn('Detail page not available');
      return { passed: false, details: {} };
    }

    const results = {};
    let allPassed = true;

    const verifyField = async (selector, expectedValue, fieldName) => {
      if (!expectedValue) return;

      try {
        const element = detailPage.locator(selector);
        const isVisible = await element.isVisible().catch(() => false);

        if (isVisible) {
          const text = await element.textContent();
          const match = text.includes(expectedValue);
          results[fieldName] = { expected: expectedValue, actual: text.trim(), match };

          if (match) {
            this.log.info(`  ${fieldName}: PASS (${expectedValue})`);
          } else {
            this.log.warn(`  ${fieldName}: FAIL (expected: ${expectedValue}, got: ${text.trim()})`);
            allPassed = false;
          }
        } else {
          this.log.warn(`  ${fieldName}: NOT VISIBLE`);
          results[fieldName] = { expected: expectedValue, actual: 'NOT VISIBLE', match: false };
          allPassed = false;
        }
      } catch (error) {
        this.log.error(`  ${fieldName}: ERROR - ${error.message}`);
        results[fieldName] = { expected: expectedValue, actual: 'ERROR', match: false };
        allPassed = false;
      }
    };

    // Verify each field
    if (expectedDetails.organisationName) {
      const nameVisible = await detailPage.locator(`text=${expectedDetails.organisationName}`).isVisible().catch(() => false);
      results.organisationName = { expected: expectedDetails.organisationName, match: nameVisible };
      if (nameVisible) {
        this.log.info(`  Organisation Name: PASS`);
      } else {
        this.log.warn(`  Organisation Name: NOT FOUND`);
        allPassed = false;
      }
    }

    await verifyField(FLUXX_DETAIL_FIELDS.ORG_TYPE, expectedDetails.organisationType, 'Organisation Type');
    await verifyField(FLUXX_DETAIL_FIELDS.RECIPIENT_TYPE, expectedDetails.recipientType, 'Recipient Type');
    await verifyField(FLUXX_DETAIL_FIELDS.FCRA_STATUS, expectedDetails.fcraStatus, 'FCRA Status');
    await verifyField(FLUXX_DETAIL_FIELDS.FCRA_REGISTRATION_NUMBER, expectedDetails.fcraRegistrationNumber, 'FCRA Reg Number');
    await verifyField(FLUXX_DETAIL_FIELDS.FCRA_CERTIFICATE_EXPIRY_DATE, expectedDetails.fcraExpiryDate, 'FCRA Expiry Date');

    this.log.info(`\n  Overall: ${allPassed ? 'ALL PASSED' : 'SOME FAILED'}`);
    return { passed: allPassed, details: results };
  }

  async verifyWorkflowStatus(expectedStatus) {
    this.log.info(`Verifying workflow status: ${expectedStatus}`);
    return await this.page.locator(`text=Status: ${expectedStatus}`).isVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE }).catch(() => false);
  }

  async verifyDetailSections(sections) {
    this.log.info('Verifying detail sections');
    const results = {};
    for (const s of sections) {
      results[s] = await this.page.locator(`text=${s}`).first().isVisible().catch(() => false);
    }
    return results;
  }

  async verifyRecipientTypeDisplay(expectedType) {
    this.log.info(`Verifying recipient type: ${expectedType}`);
    return await this.page.locator(`text=${expectedType}`).first().isVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE }).catch(() => false);
  }

  async editOrganisation() {
    this.log.info('Clicking Edit');
    const editLink = this.page.getByRole('link', { name: 'Edit' });
    await editLink.click();
    await this.page.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);
  }

  async deleteOrganisation() {
    this.log.info('Deleting organisation in Fluxx');
    const deleteLink = this.page.locator('a').filter({ hasText: 'Delete' }).first();
    if (await deleteLink.isVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE }).catch(() => false)) {
      await deleteLink.click();
      const confirm = this.page.getByRole('button', { name: /confirm|yes|ok|delete/i }).first();
      if (await confirm.isVisible({ timeout: 3000 }).catch(() => false)) await confirm.click();
      await this.page.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);
    }
  }
}
