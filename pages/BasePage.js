/**
 * Base Page Object
 * All page objects extend this class for shared functionality:
 * - Logging
 * - Common waits and navigation
 * - Screenshot capture
 * - Error handling wrappers
 */

import { Logger } from '../utils/Logger.js';
import { TIMEOUTS } from '../config/constants.js';

export class BasePage {
  /**
   * @param {import('@playwright/test').Page} page - Playwright page instance
   * @param {string} pageName - Name for logging context
   */
  constructor(page, pageName = 'BasePage') {
    this.page = page;
    this.log = new Logger(pageName);
  }

  /**
   * Navigate to a URL and wait for load
   * @param {string} url - Target URL
   * @param {Object} [options] - Navigation options
   */
  async navigate(url, options = {}) {
    const { waitUntil = 'domcontentloaded', timeout = TIMEOUTS.NAVIGATION } = options;
    this.log.debug(`Navigating to: ${url}`);
    await this.page.goto(url, { waitUntil, timeout });
    this.log.debug(`Navigation complete: ${url}`);
  }

  /**
   * Wait for element to be visible
   * @param {import('@playwright/test').Locator} locator - Element locator
   * @param {number} [timeout] - Timeout in ms
   */
  async waitForVisible(locator, timeout = TIMEOUTS.ELEMENT_VISIBLE) {
    await locator.waitFor({ state: 'visible', timeout });
  }

  /**
   * Click with retry - handles transient click failures
   * @param {import('@playwright/test').Locator} locator - Element to click
   * @param {Object} [options] - Click options
   */
  async safeClick(locator, options = {}) {
    const { timeout = TIMEOUTS.ACTION, retries = 2 } = options;
    let lastError;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await locator.waitFor({ state: 'visible', timeout });
        await locator.click({ timeout });
        return;
      } catch (error) {
        lastError = error;
        if (attempt < retries) {
          this.log.debug(`Click attempt ${attempt} failed, retrying...`);
          await this.page.waitForTimeout(TIMEOUTS.SHORT_WAIT);
        }
      }
    }

    throw lastError;
  }

  /**
   * Fill a field with retry
   * @param {import('@playwright/test').Locator} locator - Input locator
   * @param {string} value - Value to fill
   * @param {number} [timeout] - Timeout in ms
   */
  async safeFill(locator, value, timeout = TIMEOUTS.ACTION) {
    await locator.waitFor({ state: 'visible', timeout });
    await locator.fill(value);
  }

  /**
   * Select a dropdown option in CRM (click field then click option)
   * @param {import('@playwright/test').Locator} fieldLocator - Dropdown field
   * @param {string} optionName - Option text to select
   */
  async selectDropdownOption(fieldLocator, optionName) {
    await this.safeClick(fieldLocator);
    await this.page.getByRole('option', { name: optionName }).click();
    await this.page.waitForTimeout(TIMEOUTS.SHORT_WAIT);
  }

  /**
   * Select a lookup field in CRM (click, type search, select result)
   * @param {import('@playwright/test').Locator} lookupFieldLocator - Lookup field
   * @param {string} searchPlaceholder - Placeholder text of search input
   * @param {string} searchValue - Value to search
   * @param {string} resultLabel - Label of the result to click
   */
  async selectLookupValue(lookupFieldLocator, searchPlaceholder, searchValue, resultLabel) {
    await this.safeClick(lookupFieldLocator);
    const searchInput = this.page.getByPlaceholder(searchPlaceholder);
    await this.safeFill(searchInput, searchValue);
    await this.page.getByLabel(resultLabel).click();
    await this.page.waitForTimeout(TIMEOUTS.SHORT_WAIT);
  }

  /**
   * Check if element is visible (non-throwing)
   * @param {import('@playwright/test').Locator} locator - Element locator
   * @returns {Promise<boolean>}
   */
  async isVisible(locator) {
    try {
      return await locator.isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Get current page URL
   * @returns {string}
   */
  getCurrentURL() {
    return this.page.url();
  }

  /**
   * Take a screenshot
   * @param {string} name - Screenshot file name (without extension)
   * @returns {Promise<Buffer>}
   */
  async takeScreenshot(name) {
    return this.page.screenshot({
      path: `screenshots/${name}.png`,
      fullPage: true,
    });
  }
}
