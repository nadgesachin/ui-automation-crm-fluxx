/**
 * Fluxx Read-Only Page Object
 * Handles read-only verification across multiple Fluxx modules via the Quick Actions Hub.
 *
 * Used for verifying that list views load correctly, table headers are present,
 * records can be opened, and search returns expected results — without performing
 * any create/update/delete operations.
 */

import { BasePage } from './BasePage.js';
import { TIMEOUTS } from '../config/constants.js';

export class FluxxReadOnlyPage extends BasePage {
  constructor(page) {
    super(page, 'FluxxReadOnly');
  }

  /**
   * Switch the Quick Actions Hub to a specific module
   * @param {import('./FluxxQuickActionsPage.js').FluxxQuickActionsPage} quickActionsPage
   * @param {string} moduleName - e.g. 'Organisations', 'People', 'Grants'
   */
  async switchToModule(quickActionsPage, moduleName) {
    this.log.info(`Switching to: ${moduleName}`);
    await quickActionsPage.switchModel(moduleName);
  }

  /**
   * Verify the module list view has loaded with at least one row
   * @param {import('./FluxxQuickActionsPage.js').FluxxQuickActionsPage} quickActionsPage
   * @returns {Promise<boolean>} True if rows are visible
   */
  async verifyListViewLoaded(quickActionsPage) {
    const count = await quickActionsPage.getRowCount();
    this.log.info(`Module loaded with ${count} rows`);
    return count > 0;
  }

  /**
   * Verify table headers against expected values
   * @param {import('./FluxxQuickActionsPage.js').FluxxQuickActionsPage} quickActionsPage
   * @param {string[]} expectedHeaders - Header strings to check for (partial match)
   * @returns {Promise<{allPresent: boolean, headers: string[]}>}
   */
  async verifyTableHeaders(quickActionsPage, expectedHeaders) {
    const headers = await quickActionsPage.getTableHeaders();
    this.log.info(`Headers: ${headers.join(', ')}`);
    return {
      allPresent: expectedHeaders.every(h => headers.some(a => a.includes(h))),
      headers,
    };
  }

  /**
   * Open the first record in the current module's list view
   * @param {import('./FluxxQuickActionsPage.js').FluxxQuickActionsPage} quickActionsPage
   */
  async openFirstRecord(quickActionsPage) {
    await quickActionsPage.openRecordByIndex(0);
    await this.page.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);
  }

  /**
   * Verify the record detail page has loaded
   * @returns {Promise<boolean>}
   */
  async verifyDetailPageLoaded() {
    const card = this.page.locator('article, [class*="detail"], [class*="record"]').first();
    return await card
      .isVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE })
      .catch(() => false);
  }

  /**
   * Search within the current module and return the result count
   * @param {import('./FluxxQuickActionsPage.js').FluxxQuickActionsPage} quickActionsPage
   * @param {string} query - Search query
   * @returns {Promise<number>} Number of matching rows
   */
  async searchInModule(quickActionsPage, query) {
    await quickActionsPage.searchInHighlightFeed(query);
    return await quickActionsPage.getRowCount();
  }
}
