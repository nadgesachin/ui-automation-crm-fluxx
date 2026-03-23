/**
 * Fluxx Contact Page Object
 * Handles contact verification within Fluxx organisation records.
 *
 * Navigation flow (from reference test):
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

export class FluxxContactPage extends BasePage {
  constructor(page) {
    super(page, 'FluxxContact');
  }

  /**
   * Navigate to the People tab within an organisation detail page.
   * The detail page is a popup opened from the Quick Actions Hub.
   * @param {import('@playwright/test').Page} detailPage - The organisation detail popup
   * @returns {Promise<boolean>} True if People tab found and clicked
   */
  async navigateToPeopleTab(detailPage) {
    this.log.info('Navigating to People tab...');

    try {
      // Wait for detail page to fully load
      await detailPage.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);

      // Step 1: Click emphasis element to reveal navigation (from reference test)
      // The Fluxx org detail page requires clicking an emphasis element to show tabs
      const emphasisEl = detailPage.getByRole('emphasis').first();
      if (await emphasisEl.isVisible({ timeout: 5000 }).catch(() => false)) {
        await emphasisEl.click();
        await detailPage.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);
        this.log.info('Clicked emphasis element to reveal tabs');
      }

      // Step 2: Click the People tab (shows as "PeopleN" where N is count)
      // Try multiple patterns to match the People tab text
      // Reference code uses: page3.getByText('People5')
      const patterns = [
        detailPage.getByText('People', { exact: false }),  // Playwright getByText
        detailPage.locator('text=/People\\d+/'),           // "People5" regex
        detailPage.locator('text=/People/').first(),       // Any "People" text
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
  async openContact(detailPage, contactName) {
    this.log.info(`Opening contact: ${contactName}`);

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
      const textLink = detailPage.locator(`text=${contactName}`).first();
      if (await textLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await textLink.click();
        await detailPage.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);
        this.log.info(`Contact "${contactName}" opened (text match)`);
        return true;
      }

      this.log.warn(`Contact "${contactName}" not found in People tab`);
      return false;
    } catch (error) {
      this.log.error(`Error opening contact: ${contactName}`, error);
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
   * Uses the contact card selector (#fluxx-card-7) from the reference test.
   * @param {import('@playwright/test').Page} detailPage - The detail page containing contact card
   * @param {Object} expected - Expected contact field values
   * @param {string} [expected.fullName] - Expected full name
   * @param {string} [expected.email] - Expected email address
   * @param {string} [expected.role] - Expected role (e.g., 'Current Staff or Board Member', 'Grantee')
   * @param {string} [expected.primaryOrganisation] - Expected primary organisation name
   * @returns {Promise<Object>} Verification results { passed: boolean, details: {} }
   */
  async verifyContactDetails(detailPage, expected = {}) {
    this.log.subsection('Verifying Contact Details');

    const results = {};
    let allPassed = true;

    const contactCard = detailPage.locator(FLUXX_CONTACT_FIELDS.CONTACT_CARD);
    const cardVisible = await contactCard.isVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE }).catch(() => false);

    if (!cardVisible) {
      this.log.warn('Contact card (#fluxx-card-7) not visible');
      return { passed: false, details: { error: 'Contact card not visible' } };
    }

    const cardText = await contactCard.textContent().catch(() => '');

    // Verify full name
    if (expected.fullName) {
      const nameMatch = cardText.includes(expected.fullName);
      results.fullName = { expected: expected.fullName, match: nameMatch };
      if (nameMatch) {
        this.log.info(`  Full Name: PASS (${expected.fullName})`);
      } else {
        this.log.warn(`  Full Name: FAIL (expected "${expected.fullName}" in card)`);
        allPassed = false;
      }
    }

    // Verify email
    if (expected.email) {
      const emailMatch = cardText.toLowerCase().includes(expected.email.toLowerCase());
      results.email = { expected: expected.email, match: emailMatch };
      if (emailMatch) {
        this.log.info(`  Email: PASS (${expected.email})`);
      } else {
        this.log.warn(`  Email: FAIL (expected "${expected.email}" in card)`);
        allPassed = false;
      }
    }

    // Verify role
    if (expected.role) {
      const roleMatch = cardText.includes(expected.role);
      results.role = { expected: expected.role, match: roleMatch };
      if (roleMatch) {
        this.log.info(`  Role: PASS (${expected.role})`);
      } else {
        this.log.warn(`  Role: FAIL (expected "${expected.role}" in card)`);
        allPassed = false;
      }
    }

    // Verify primary organisation (separate selector)
    if (expected.primaryOrganisation) {
      try {
        const primaryOrgEl = detailPage.locator(FLUXX_CONTACT_FIELDS.PRIMARY_ORGANISATION);
        const primaryOrgVisible = await primaryOrgEl.isVisible({ timeout: 5000 }).catch(() => false);

        if (primaryOrgVisible) {
          const primaryOrgText = await primaryOrgEl.textContent();
          const orgMatch = primaryOrgText.includes(expected.primaryOrganisation);
          results.primaryOrganisation = { expected: expected.primaryOrganisation, actual: primaryOrgText.trim(), match: orgMatch };

          if (orgMatch) {
            this.log.info(`  Primary Org: PASS (${expected.primaryOrganisation})`);
          } else {
            this.log.warn(`  Primary Org: FAIL (expected "${expected.primaryOrganisation}", got "${primaryOrgText.trim()}")`);
            allPassed = false;
          }
        } else {
          this.log.warn('  Primary Org: NOT VISIBLE');
          results.primaryOrganisation = { expected: expected.primaryOrganisation, actual: 'NOT VISIBLE', match: false };
          allPassed = false;
        }
      } catch (error) {
        this.log.error(`  Primary Org: ERROR - ${error.message}`);
        results.primaryOrganisation = { expected: expected.primaryOrganisation, actual: 'ERROR', match: false };
        allPassed = false;
      }
    }

    this.log.info(`\n  Overall: ${allPassed ? 'ALL PASSED' : 'SOME FAILED'}`);
    return { passed: allPassed, details: results };
  }
}
