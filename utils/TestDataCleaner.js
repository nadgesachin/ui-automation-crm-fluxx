/**
 * Test Data Cleaner
 * Tracks and deletes AUTO_UI_ prefixed records created during a test run.
 * Handles deletion in reverse dependency order: co-funding → investment → contact → organisation.
 */

import { Logger } from './Logger.js';
import { AUTO_PREFIX } from '../config/constants.js';

/** Fluxx base URL for record navigation */
const FLUXX_BASE_URL = 'https://ciff.eu-preprod.fluxxlabs.com';

export class TestDataCleaner {
  constructor() {
    this.logger = new Logger('TestDataCleaner');
    /** @type {Array<{system: string, type: string, id: string, name: string, trackedAt: string}>} */
    this.trackedRecords = [];
  }

  /**
   * Track a created record for later cleanup
   * @param {string} system - System where record lives (e.g., 'fluxx', 'crm')
   * @param {string} type - Record type (e.g., 'organisation', 'contact', 'investment', 'co-funding')
   * @param {string} id - Record ID in the system
   * @param {string} name - Human-readable name for logging
   */
  trackRecord(system, type, id, name) {
    const record = {
      system,
      type,
      id,
      name,
      trackedAt: new Date().toISOString(),
    };
    this.trackedRecords.push(record);
    this.logger.debug(`Tracked ${type} record: "${name}" (id=${id}) in ${system}`);
  }

  /**
   * Delete all tracked records in reverse dependency order:
   * co-funding → investment → contact → organisation
   * @param {import('playwright').Page} page - Playwright page object (authenticated to Fluxx)
   */
  async cleanupAll(page) {
    this.logger.section('TestDataCleaner: Starting cleanup of all tracked records');

    const deletionOrder = ['co-funding', 'investment', 'contact', 'organisation'];

    for (const type of deletionOrder) {
      const records = this.trackedRecords.filter((r) => r.type === type);
      if (records.length === 0) continue;

      this.logger.subsection(`Deleting ${records.length} ${type} record(s)`);

      for (const record of records) {
        try {
          await this._deleteRecord(page, record);
          this.logger.success(`Deleted ${type}: "${record.name}" (id=${record.id})`);
        } catch (err) {
          this.logger.error(`Failed to delete ${type}: "${record.name}" (id=${record.id})`, err);
        }
      }
    }

    this.logger.section('TestDataCleaner: Cleanup complete');
  }

  /**
   * Navigate to a Fluxx record and delete it via the Delete link/button
   * @param {import('playwright').Page} page - Playwright page object
   * @param {{system: string, type: string, id: string, name: string}} record - Tracked record
   */
  async _deleteRecord(page, record) {
    const modelPath = this._getFluxxModelPath(record.type);
    const url = `${FLUXX_BASE_URL}/show/${modelPath}/${record.id}`;

    this.logger.info(`Navigating to ${url} to delete "${record.name}"`);
    await page.goto(url, { waitUntil: 'networkidle' });

    // Locate and click the Delete link/button
    const deleteLink = page.locator('a:has-text("Delete"), button:has-text("Delete")').first();
    await deleteLink.waitFor({ state: 'visible', timeout: 15000 });
    await deleteLink.click();

    // Confirm deletion in any dialog or confirmation prompt that appears
    const confirmButton = page.locator(
      'button:has-text("Confirm"), button:has-text("Yes"), button:has-text("OK"), input[value="OK"]'
    ).first();

    try {
      await confirmButton.waitFor({ state: 'visible', timeout: 5000 });
      await confirmButton.click();
    } catch {
      // Some delete actions confirm via browser dialog
      page.on('dialog', (dialog) => dialog.accept());
    }

    // Wait for navigation or confirmation that the record is gone
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    this.logger.debug(`Deletion request sent for "${record.name}"`);
  }

  /**
   * Map record type to Fluxx model path segment used in URLs
   * @param {string} type - Record type
   * @returns {string} Fluxx model path
   */
  _getFluxxModelPath(type) {
    const modelPaths = {
      organisation: 'organization',
      contact: 'user',
      investment: 'program',
      'co-funding': 'co_funding',
    };

    const path = modelPaths[type];
    if (!path) {
      this.logger.warn(`Unknown record type "${type}" — using type as model path`);
      return type;
    }
    return path;
  }

  /**
   * Verify that no AUTO_UI_ prefixed records remain (post-cleanup check)
   * @param {import('playwright').Page} page - Playwright page object
   * @param {Function} searchFn - Async function that searches for AUTO_PREFIX and returns result count
   * @returns {Promise<boolean>} true if no AUTO_UI_ records found
   */
  async verifyClean(page, searchFn) {
    this.logger.info(`Verifying no "${AUTO_PREFIX}" records remain...`);
    try {
      const count = await searchFn(page, AUTO_PREFIX);
      if (count === 0) {
        this.logger.success(`Verification passed: no "${AUTO_PREFIX}" records found`);
        return true;
      }
      this.logger.warn(`Verification failed: ${count} "${AUTO_PREFIX}" record(s) still exist`);
      return false;
    } catch (err) {
      this.logger.error('verifyClean encountered an error', err);
      return false;
    }
  }
}

/** Singleton instance for shared cleanup tracking across a test run */
export const testDataCleaner = new TestDataCleaner();
