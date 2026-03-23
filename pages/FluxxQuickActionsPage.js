/**
 * Fluxx Quick Actions Hub Page Object
 * Handles Highlight Feed model switching, search, and table interactions.
 *
 * The Quick Actions Hub is the central navigation point in Fluxx.
 * It provides a Highlight Feed that can be switched between models
 * (Organisations, People, Requests, Grants, Reports, Payments, Amendments).
 */

import { BasePage } from './BasePage.js';
import { getFluxxConfig } from '../config/environments.js';
import { TIMEOUTS } from '../config/constants.js';

export class FluxxQuickActionsPage extends BasePage {
  constructor(page) {
    super(page, 'FluxxQuickActions');
    const config = getFluxxConfig();
    this.quickActionsUrl = config.dashboardURL || 'https://ciff.eu-preprod.fluxxlabs.com/central/quick-actions';
  }

  /**
   * Navigate to Quick Actions Hub
   */
  async navigateToQuickActions() {
    this.log.step(1, 'Navigate to Quick Actions Hub');
    await this.navigate(this.quickActionsUrl);
    await this.page.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);
  }

  /**
   * Switch Highlight Feed to a different model
   * @param {string} modelName - Display name e.g. 'Organisations', 'People', 'Requests'
   */
  async switchModel(modelName) {
    this.log.info(`Switching Highlight Feed to: ${modelName}`);
    const trigger = this.page.locator('[data-testid="highlight-feed-model-dropdown-trigger"]');
    await trigger.click();
    await this.page.waitForTimeout(TIMEOUTS.SHORT_WAIT);
    const key = this._getModelKey(modelName);
    const option = this.page.locator(`[data-testid="highlight-feed-model-dropdown-item-${key}"]`);
    await option.click();
    await this.page.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);
  }

  /**
   * Map display model name to internal key used in data-testid attributes
   * @param {string} modelName - Display name
   * @returns {string} Internal key
   */
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

  /**
   * Search in Highlight Feed using the search input
   * @param {string} query - Search query
   */
  async searchInHighlightFeed(query) {
    this.log.info(`Searching: ${query}`);
    const input = this.page.getByPlaceholder('Search records');
    await input.fill(query);
    await this.page.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);
  }

  /**
   * Clear the Highlight Feed search input
   */
  async clearSearch() {
    const input = this.page.getByPlaceholder('Search records');
    await input.clear();
    await this.page.waitForTimeout(TIMEOUTS.SHORT_WAIT);
  }

  /**
   * Get table rows (excluding action rows)
   * @returns {import('@playwright/test').Locator}
   */
  async getTableRows() {
    return this.page.locator('table tbody tr').filter({ hasNot: this.page.locator('td [class*="action"]') });
  }

  /**
   * Get count of visible table rows
   * @returns {Promise<number>}
   */
  async getRowCount() {
    const rows = await this.getTableRows();
    return await rows.count();
  }

  /**
   * Open a record by index in the current table view
   * @param {number} [index=0] - Zero-based row index
   */
  async openRecordByIndex(index = 0) {
    this.log.info(`Opening record at index: ${index}`);
    const links = this.page.getByRole('link', { name: 'Open record' });
    await links.nth(index).click();
    await this.page.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);
  }

  /**
   * Get all visible table header texts
   * @returns {Promise<string[]>}
   */
  async getTableHeaders() {
    const headers = this.page.locator('table thead th');
    const count = await headers.count();
    const texts = [];
    for (let i = 0; i < count; i++) {
      texts.push((await headers.nth(i).textContent()).trim());
    }
    return texts.filter(h => h);
  }

  /**
   * Navigate to the next page of results
   * @returns {Promise<boolean>} True if navigation succeeded, false if button disabled
   */
  async navigateToNextPage() {
    const btn = this.page.getByRole('button', { name: 'Next Page' });
    if (await btn.isEnabled()) {
      await btn.click();
      await this.page.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);
      return true;
    }
    return false;
  }

  /**
   * Get pagination info text
   * @returns {Promise<string>}
   */
  async getPaginationInfo() {
    const el = this.page.locator('[class*="pagination"]').first();
    return await el.textContent().catch(() => '');
  }
}
