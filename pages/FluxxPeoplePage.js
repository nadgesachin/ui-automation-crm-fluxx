/**
 * Fluxx People Page Object
 * Handles People (contacts) verification and search in Fluxx.
 *
 * Migrated from FluxxContactPage.js with additional Quick Actions Hub methods.
 *
 * Navigation flow:
 *   1. Search organisation in Quick Actions Hub
 *   2. Open organisation record detail (popup)
 *   3. Navigate to "People" tab within organisation
 *   4. Click specific contact link
 *   5. Verify contact fields in the contact detail card
 *
 * KT Doc Rules (Section 3):
 *   - Every contact MUST have a Primary Organization
 *   - All linked orgs MUST have Required in Fluxx = Yes for contact to sync
 *   - Contact fields verified: Name, Email, Role, Primary Organisation
 */

import { BasePage } from './BasePage.js';
import { TIMEOUTS, FLUXX_CONTACT_FIELDS } from '../config/constants.js';

export class FluxxPeoplePage extends BasePage {
  constructor(page) {
    super(page, 'FluxxPeople');
  }

  // ─── Migrated from FluxxContactPage ────────────────────────────────────────

  /**
   * Navigate to the People tab within an organisation detail page.
   * The detail page is a popup opened from the Quick Actions Hub.
   * @param {import('@playwright/test').Page} detailPage - The organisation detail popup
   * @returns {Promise<boolean>} True if People tab found and clicked
   */
  async navigateToPeopleTab(detailPage) {
    this.log.info('Navigating to People tab...');

    try {
      await detailPage.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);

      // Click emphasis element to reveal navigation (from reference test)
      // The Fluxx org detail page requires clicking an emphasis element to show tabs
      const emphasisEl = detailPage.getByRole('emphasis').first();
      if (await emphasisEl.isVisible({ timeout: 5000 }).catch(() => false)) {
        await emphasisEl.click();
        await detailPage.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);
        this.log.info('Clicked emphasis element to reveal tabs');
      }

      // Click the People tab (shows as "PeopleN" where N is count)
      const patterns = [
        detailPage.getByText('People', { exact: false }),
        detailPage.locator('text=/People\\d+/'),
        detailPage.locator('text=/People/').first(),
        detailPage.locator('a:has-text("People")').first(),
        detailPage.locator('h3:has-text("People")').first(),
        detailPage.locator('[data-tab*="people" i]').first(),
        detailPage.locator('li:has-text("People")').first(),
      ];

      for (const pattern of patterns) {
        if (await pattern.isVisible({ timeout: 3000 }).catch(() => false)) {
          await pattern.click();
          await detailPage.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);
          this.log.info('People tab opened');
          return true;
        }
      }

      this.log.warn('People tab not found after trying all patterns');
      return false;
    } catch (error) {
      this.log.error('Error navigating to People tab', error);
      return false;
    }
  }

  /**
   * Click on a specific contact within the People tab
   * @param {import('@playwright/test').Page} detailPage - The organisation detail popup
   * @param {string} contactName - Full name of the contact to click
   * @returns {Promise<boolean>} True if contact found and clicked
   */
  async clickContact(detailPage, contactName) {
    this.log.info(`Clicking contact: ${contactName}`);

    try {
      const contactLink = detailPage.getByRole('link', { name: contactName });
      const isVisible = await contactLink.isVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE }).catch(() => false);

      if (isVisible) {
        await contactLink.click();
        await detailPage.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);
        this.log.info(`Contact "${contactName}" opened`);
        return true;
      }

      // Fallback: try text match
      const link = detailPage.locator('a').filter({ hasText: contactName });
      if (await link.isVisible({ timeout: 5000 }).catch(() => false)) {
        await link.click();
        await detailPage.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);
        this.log.info(`Contact "${contactName}" opened (text match)`);
        return true;
      }

      this.log.warn(`Contact "${contactName}" not found in People tab`);
      return false;
    } catch (error) {
      this.log.error(`Error clicking contact: ${contactName}`, error);
      return false;
    }
  }

  /**
   * Check if a contact exists in the People tab
   * @param {import('@playwright/test').Page} detailPage - The organisation detail popup
   * @param {string} contactName - Contact name to search for
   * @returns {Promise<boolean>}
   */
  async contactExistsInPeopleTab(detailPage, contactName) {
    try {
      const contactLocator = detailPage.locator(`text=${contactName}`);
      return await contactLocator.isVisible({ timeout: TIMEOUTS.ACTION }).catch(() => false);
    } catch {
      return false;
    }
  }

  /**
   * Verify contact details on the contact detail card.
   * @param {import('@playwright/test').Page} detailPage - The detail page containing contact card
   * @param {Object} data - Expected field values
   * @param {string} [data.firstName]
   * @param {string} [data.lastName]
   * @param {string} [data.fullName]
   * @param {string} [data.email]
   * @param {string} [data.role]
   * @param {string} [data.primaryOrganisation]
   * @returns {Promise<Object>} Verification results { passed: boolean, details: {} }
   */
  async verifyContactDetails(detailPage, data = {}) {
    this.log.subsection('Verifying Contact Details');

    const results = {};
    let allPassed = true;

    // Use contact card selector from constants if available
    const cardSelector = FLUXX_CONTACT_FIELDS?.CONTACT_CARD || '#fluxx-card-7';
    const contactCard = detailPage.locator(cardSelector);
    const cardVisible = await contactCard.isVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE }).catch(() => false);

    if (cardVisible) {
      const cardText = await contactCard.textContent().catch(() => '');

      if (data.fullName) {
        const match = cardText.includes(data.fullName);
        results.fullName = { expected: data.fullName, match };
        match
          ? this.log.info(`  Full Name: PASS (${data.fullName})`)
          : (this.log.warn(`  Full Name: FAIL (expected "${data.fullName}" in card)`), allPassed = false);
      }

      if (data.email) {
        const match = cardText.toLowerCase().includes(data.email.toLowerCase());
        results.email = { expected: data.email, match };
        match
          ? this.log.info(`  Email: PASS (${data.email})`)
          : (this.log.warn(`  Email: FAIL (expected "${data.email}" in card)`), allPassed = false);
      }

      if (data.role) {
        const match = cardText.includes(data.role);
        results.role = { expected: data.role, match };
        match
          ? this.log.info(`  Role: PASS (${data.role})`)
          : (this.log.warn(`  Role: FAIL (expected "${data.role}" in card)`), allPassed = false);
      }
    } else {
      // Fallback: check by text locators when card not found
      this.log.debug('Contact card not visible, falling back to text locators');

      if (data.firstName) {
        const visible = await detailPage.locator(`text=${data.firstName}`).isVisible().catch(() => false);
        results.firstName = { expected: data.firstName, match: visible };
        visible
          ? this.log.info(`  First Name: PASS`)
          : (this.log.warn(`  First Name: NOT FOUND`), allPassed = false);
      }

      if (data.lastName) {
        const visible = await detailPage.locator(`text=${data.lastName}`).isVisible().catch(() => false);
        results.lastName = { expected: data.lastName, match: visible };
        visible
          ? this.log.info(`  Last Name: PASS`)
          : (this.log.warn(`  Last Name: NOT FOUND`), allPassed = false);
      }

      if (data.email) {
        const visible = await detailPage.locator(`text=${data.email}`).isVisible().catch(() => false);
        results.email = { expected: data.email, match: visible };
        visible
          ? this.log.info(`  Email: PASS`)
          : (this.log.warn(`  Email: NOT FOUND`), allPassed = false);
      }
    }

    // Verify primary organisation (separate selector)
    if (data.primaryOrganisation) {
      try {
        const primaryOrgSelector = FLUXX_CONTACT_FIELDS?.PRIMARY_ORGANISATION || '[data-field="primary_org_id"]';
        const primaryOrgEl = detailPage.locator(primaryOrgSelector);
        const primaryOrgVisible = await primaryOrgEl.isVisible({ timeout: 5000 }).catch(() => false);

        if (primaryOrgVisible) {
          const primaryOrgText = await primaryOrgEl.textContent();
          const orgMatch = primaryOrgText.includes(data.primaryOrganisation);
          results.primaryOrganisation = { expected: data.primaryOrganisation, actual: primaryOrgText.trim(), match: orgMatch };
          orgMatch
            ? this.log.info(`  Primary Org: PASS (${data.primaryOrganisation})`)
            : (this.log.warn(`  Primary Org: FAIL (expected "${data.primaryOrganisation}", got "${primaryOrgText.trim()}")`), allPassed = false);
        } else {
          this.log.warn('  Primary Org: NOT VISIBLE');
          results.primaryOrganisation = { expected: data.primaryOrganisation, actual: 'NOT VISIBLE', match: false };
          allPassed = false;
        }
      } catch (error) {
        this.log.error(`  Primary Org: ERROR - ${error.message}`);
        results.primaryOrganisation = { expected: data.primaryOrganisation, actual: 'ERROR', match: false };
        allPassed = false;
      }
    }

    this.log.info(`\n  Overall: ${allPassed ? 'ALL PASSED' : 'SOME FAILED'}`);
    return { passed: allPassed, details: results };
  }

  /**
   * Verify contact details with retry (handles CRM-Fluxx sync delay)
   * @param {import('@playwright/test').Page} detailPage
   * @param {Object} data - Expected field values
   * @param {number} [maxRetries=12]
   * @returns {Promise<Object>}
   */
  async verifyContactDetailsWithRetry(detailPage, data, maxRetries = 12) {
    for (let i = 0; i < maxRetries; i++) {
      const result = await this.verifyContactDetails(detailPage, data);
      if (Object.values(result.details).every(v => v.match === true)) return result;
      this.log.info(`Retry ${i + 1}/${maxRetries}...`);
      await this.page.waitForTimeout(TIMEOUTS.LONG_WAIT);
    }
    return await this.verifyContactDetails(detailPage, data);
  }

  // ─── Quick Actions Hub methods ──────────────────────────────────────────────

  /**
   * Search for people via Highlight Feed (switches model to People first)
   * @param {import('./FluxxQuickActionsPage.js').FluxxQuickActionsPage} quickActionsPage
   * @param {string} name - Name to search for
   */
  async searchPeopleViaHighlightFeed(quickActionsPage, name) {
    this.log.info(`Searching People for: ${name}`);
    await quickActionsPage.switchModel('People');
    await quickActionsPage.searchInHighlightFeed(name);
  }

  /**
   * Verify the People table has expected columns
   * @param {import('./FluxxQuickActionsPage.js').FluxxQuickActionsPage} quickActionsPage
   * @returns {Promise<boolean>}
   */
  async verifyPeopleTableColumns(quickActionsPage) {
    const headers = await quickActionsPage.getTableHeaders();
    const expected = ['ID', 'First Name', 'Last Name', 'Primary Organization', 'Title', 'Email', 'Phone'];
    return expected.every(col => headers.some(h => h.includes(col)));
  }

  /**
   * Check if a person exists via Highlight Feed search
   * @param {import('./FluxxQuickActionsPage.js').FluxxQuickActionsPage} quickActionsPage
   * @param {string} name - Name to search for
   * @returns {Promise<boolean>}
   */
  async personExists(quickActionsPage, name) {
    await quickActionsPage.searchInHighlightFeed(name);
    return (await quickActionsPage.getRowCount()) > 0;
  }
}
