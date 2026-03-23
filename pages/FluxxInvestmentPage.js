/**
 * Fluxx Investment Page Object
 * Handles Investment tab navigation, creation, search, and verification in Fluxx.
 *
 * Note: Investment creation form selectors are TBD and require exploration
 * during the first test run against the Fluxx environment.
 */

import { BasePage } from './BasePage.js';
import { TIMEOUTS } from '../config/constants.js';

export class FluxxInvestmentPage extends BasePage {
  constructor(page) {
    super(page, 'FluxxInvestment');
  }

  /**
   * Navigate to the Investment tab within an organisation detail page
   * @param {import('@playwright/test').Page} orgDetailPage - Organisation detail popup
   */
  async navigateToInvestmentTab(orgDetailPage) {
    this.log.info('Navigating to Investment tab');
    const tab = orgDetailPage.locator('li').filter({ hasText: 'Investment' });
    await tab.click();
    await this.page.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);
  }

  /**
   * Create an investment via the Quick Actions Hub
   * @param {import('./FluxxQuickActionsPage.js').FluxxQuickActionsPage} quickActionsPage
   * @param {Object} data - Investment data (fields TBD)
   * @returns {Promise<void>}
   */
  async createInvestment(quickActionsPage, data) {
    this.log.section('CREATE INVESTMENT');
    // Investment creation form fields are TBD — needs exploration during first run
    this.log.warn('Investment creation form needs exploration — selectors TBD');
  }

  /**
   * Search for an investment by name in the Highlight Feed
   * @param {import('./FluxxQuickActionsPage.js').FluxxQuickActionsPage} quickActionsPage
   * @param {string} name - Investment name to search
   * @returns {Promise<boolean>} True if any results found
   */
  async searchInvestment(quickActionsPage, name) {
    this.log.info(`Searching investment: ${name}`);
    await quickActionsPage.searchInHighlightFeed(name);
    return (await quickActionsPage.getRowCount()) > 0;
  }

  /**
   * Verify an investment appears under an organisation's Investment tab
   * @param {import('@playwright/test').Page} orgDetailPage - Organisation detail popup
   * @param {string} investmentName - Investment name to verify
   * @returns {Promise<boolean>}
   */
  async verifyInvestmentUnderOrg(orgDetailPage, investmentName) {
    this.log.info(`Verifying investment "${investmentName}" under org`);
    await this.navigateToInvestmentTab(orgDetailPage);
    return await orgDetailPage
      .locator(`text=${investmentName}`)
      .isVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE })
      .catch(() => false);
  }

  /**
   * Delete an investment by navigating to its direct URL
   * @param {import('@playwright/test').Page} page - Browser page
   * @param {string|number} investmentId - Investment record ID
   */
  async deleteInvestment(page, investmentId) {
    this.log.info(`Deleting investment ID: ${investmentId}`);
    await page.goto(`https://ciff.eu-preprod.fluxxlabs.com/show/program/${investmentId}`, {
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
