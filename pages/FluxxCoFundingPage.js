/**
 * Fluxx Co-Funding Page Object
 * Handles Co-Funding tab navigation, creation, search, and verification in Fluxx.
 *
 * Note: Co-Funding creation form selectors are TBD and require exploration
 * during the first test run against the Fluxx environment.
 */

import { BasePage } from './BasePage.js';
import { TIMEOUTS } from '../config/constants.js';

export class FluxxCoFundingPage extends BasePage {
  constructor(page) {
    super(page, 'FluxxCoFunding');
  }

  /**
   * Navigate to the Co-Funding tab within an organisation detail page
   * @param {import('@playwright/test').Page} orgDetailPage - Organisation detail popup
   */
  async navigateToCoFundingTab(orgDetailPage) {
    this.log.info('Navigating to Co-Funding tab');
    const tab = orgDetailPage.locator('li').filter({ hasText: 'Co-Funding' });
    await tab.click();
    await this.page.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);
  }

  /**
   * Create a co-funding record via the Quick Actions Hub
   * @param {import('./FluxxQuickActionsPage.js').FluxxQuickActionsPage} quickActionsPage
   * @param {Object} data - Co-Funding data (fields TBD)
   * @returns {Promise<void>}
   */
  async createCoFunding(quickActionsPage, data) {
    this.log.section('CREATE CO-FUNDING');
    // Co-Funding creation form fields are TBD — needs exploration during first run
    this.log.warn('Co-Funding creation form needs exploration — selectors TBD');
  }

  /**
   * Search for a co-funding record by name in the Highlight Feed
   * @param {import('./FluxxQuickActionsPage.js').FluxxQuickActionsPage} quickActionsPage
   * @param {string} name - Co-Funding name to search
   * @returns {Promise<boolean>} True if any results found
   */
  async searchCoFunding(quickActionsPage, name) {
    this.log.info(`Searching co-funding: ${name}`);
    await quickActionsPage.searchInHighlightFeed(name);
    return (await quickActionsPage.getRowCount()) > 0;
  }

  /**
   * Verify a co-funding record appears under an organisation's Co-Funding tab
   * @param {import('@playwright/test').Page} orgDetailPage - Organisation detail popup
   * @param {string} cfName - Co-Funding name to verify
   * @returns {Promise<boolean>}
   */
  async verifyCoFundingUnderOrg(orgDetailPage, cfName) {
    this.log.info(`Verifying co-funding "${cfName}" under org`);
    await this.navigateToCoFundingTab(orgDetailPage);
    return await orgDetailPage
      .locator(`text=${cfName}`)
      .isVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE })
      .catch(() => false);
  }

  /**
   * Delete a co-funding record by navigating to its direct URL
   * @param {import('@playwright/test').Page} page - Browser page
   * @param {string|number} cfId - Co-Funding record ID
   */
  async deleteCoFunding(page, cfId) {
    this.log.info(`Deleting co-funding ID: ${cfId}`);
    await page.goto(`https://ciff.eu-preprod.fluxxlabs.com/show/co_funding/${cfId}`, {
      timeout: TIMEOUTS.NAVIGATION,
    });
    await page.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);
    const deleteLink = page.locator('a').filter({ hasText: 'Delete' }).first();
    if (await deleteLink.isVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE }).catch(() => false)) {
      await deleteLink.click();
      const confirm = page.getByRole('button', { name: /confirm|yes|ok|delete/i }).first();
      if (await confirm.isVisible({ timeout: 3000 }).catch(() => false)) {
        await confirm.click();
      }
    }
  }
}
