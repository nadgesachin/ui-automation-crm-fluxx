/**
 * CRM Contact Page Object
 * Handles contact creation and management in Dynamics 365 CRM.
 *
 * KT Document Rules:
 * - Every contact MUST have a Primary Organization (mandatory)
 * - Max 3 organizations per contact (including primary)
 * - All linked orgs MUST have 'Required in Fluxx' = Yes for contact to sync
 * - Grant Portal Access = Yes triggers Manager Requested Login (auto-populated)
 * - Grant Portal Access = Yes sends email to grantee for credentials
 */

import { BasePage } from './BasePage.js';
import { TIMEOUTS, AUTO_PREFIX } from '../config/constants.js';

export class CRMContactPage extends BasePage {
  constructor(page) {
    super(page, 'CRMContact');

    // Action buttons
    this.newButton = page.getByLabel('New', { exact: true });
    this.saveButton = page.getByLabel('Save (CTRL+S)');

    // Contact form fields
    this.firstNameField = page.getByRole('textbox', { name: 'First Name' });
    this.lastNameField = page.getByRole('textbox', { name: 'Last Name' });
    this.emailField = page.getByRole('textbox', { name: 'Email', exact: true });
    this.emailPlaceholder = page.getByPlaceholder('Provide an email');

    // Primary Organisation lookup (MANDATORY per KT doc)
    this.primaryOrgSearchButton = page.getByRole('button', { name: 'Search records for Primary' });
    this.lookForRecordsInput = page.getByPlaceholder('Look for records');

    // Grant Portal Access (KT doc: Yes/No boolean)
    this.grantPortalAccessField = page.getByLabel('Grant Portal Access');
    this.managerRequestedLoginField = page.getByLabel('Manager Requested Login');

    // Tabs
    this.summaryTab = page.getByRole('tab', { name: 'Summary' });

    // Verification
    this.formHeaderTitle = page.locator('#formHeaderTitle_2');

    // Sub-grid (contacts under organisation)
    this.moreCommandsContact = page.getByLabel('More commands for Contact');
    this.newContactSubgrid = page.getByLabel('New Contact. Add New Contact');
  }

  /**
   * Click New button to create new contact
   */
  async clickNewButton() {
    this.log.info('Clicking New button...');
    await this.safeClick(this.newButton);
    await this.page.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);
  }

  /**
   * Fill contact first name
   * @param {string} firstName
   */
  async setFirstName(firstName) {
    this.log.info(`Setting First Name: ${firstName}`);
    await this.firstNameField.click();
    await this.firstNameField.fill(firstName);
  }

  /**
   * Fill contact last name
   * @param {string} lastName
   */
  async setLastName(lastName) {
    this.log.info(`Setting Last Name: ${lastName}`);
    await this.lastNameField.click();
    await this.lastNameField.fill(lastName);
  }

  /**
   * Fill contact email
   * @param {string} email
   */
  async setEmail(email) {
    this.log.info(`Setting Email: ${email}`);
    const emailVisible = await this.isVisible(this.emailField);
    if (emailVisible) {
      await this.emailField.fill(email);
    } else {
      await this.emailPlaceholder.fill(email);
    }
  }

  /**
   * Link contact to Primary Organisation (MANDATORY per KT doc)
   * Every contact MUST have a primary organisation associated.
   * @param {string} orgSearchTerm - Search term for organisation
   */
  async linkToPrimaryOrganisation(orgSearchTerm) {
    this.log.info(`Linking to Primary Organisation: ${orgSearchTerm}`);
    await this.safeClick(this.primaryOrgSearchButton);
    await this.safeFill(this.lookForRecordsInput, orgSearchTerm);
    await this.lookForRecordsInput.press('Enter');
    await this.page.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);

    // Select the first result from the lookup dropdown
    const firstResult = this.page.locator('[data-id*="primaryOrganisation"] li, [aria-label*="Lookup results"] li, ul[aria-label*="Lookup results"] li').first();
    const resultVisible = await firstResult.isVisible({ timeout: 5000 }).catch(() => false);
    if (resultVisible) {
      await firstResult.click();
      this.log.info('Selected first organisation from lookup results');
    } else {
      // Fallback: try clicking any result that matches the search term
      const matchingResult = this.page.getByRole('option').first();
      if (await matchingResult.isVisible({ timeout: 3000 }).catch(() => false)) {
        await matchingResult.click();
        this.log.info('Selected organisation from role=option');
      } else {
        // Press Escape to close the lookup and continue
        this.log.warn('No lookup result found, pressing Escape');
        await this.page.keyboard.press('Escape');
      }
    }
    await this.page.waitForTimeout(TIMEOUTS.SHORT_WAIT);
  }

  /**
   * Select a specific organisation from lookup results
   * @param {string} orgName - Exact org name to select
   */
  async selectOrganisationFromResults(orgName) {
    this.log.info(`Selecting organisation: ${orgName}`);
    await this.page.getByLabel(orgName).click();
    await this.page.waitForTimeout(TIMEOUTS.SHORT_WAIT);
  }

  /**
   * Set Grant Portal Access field
   * KT Doc: If Yes -> Manager Requested Login becomes visible, email sent to grantee
   * @param {string} value - 'Yes' or 'No'
   */
  async setGrantPortalAccess(value) {
    this.log.info(`Setting Grant Portal Access: ${value}`);
    await this.selectDropdownOption(this.grantPortalAccessField, value);
  }

  /**
   * Check if Manager Requested Login field is visible
   * (Should only be visible when Grant Portal Access = Yes)
   * @returns {Promise<boolean>}
   */
  async isManagerRequestedLoginVisible() {
    return this.isVisible(this.managerRequestedLoginField);
  }

  /**
   * Save the contact form
   */
  async saveContact() {
    this.log.info('Saving contact...');
    await this.safeClick(this.saveButton);
    await this.page.waitForTimeout(TIMEOUTS.LONG_WAIT);
  }

  /**
   * Save contact using keyboard shortcut
   */
  async saveContactWithKeyboard() {
    this.log.info('Saving contact with Ctrl+S...');
    await this.page.keyboard.press('Control+s');
    await this.page.waitForTimeout(TIMEOUTS.LONG_WAIT);
  }

  /**
   * Verify contact was saved
   * @param {string} fullName - Expected full name
   * @returns {Promise<boolean>}
   */
  async verifySaved(fullName) {
    this.log.info(`Verifying save for: ${fullName}`);
    try {
      await this.page.waitForTimeout(TIMEOUTS.LONG_WAIT);
      const headerText = await this.formHeaderTitle.textContent({ timeout: TIMEOUTS.SAVE });
      const isSaved = headerText.includes(fullName);
      if (isSaved) {
        this.log.success(`Contact saved: ${fullName}`);
      }
      return isSaved;
    } catch (error) {
      this.log.error('Save verification failed', error);
      return false;
    }
  }

  /**
   * Create a contact with basic details
   * Per KT doc: Primary Organisation is MANDATORY
   * @param {Object} details - Contact details
   * @param {string} [details.firstName] - First name
   * @param {string} [details.lastName] - Last name
   * @param {string} [details.email] - Email
   * @param {string} details.organisationSearch - Organisation to link (MANDATORY)
   * @param {string} [details.grantPortalAccess] - 'Yes' or 'No'
   * @returns {Promise<string>} Full name of created contact
   */
  async createContact(details = {}) {
    const timestamp = Date.now().toString().slice(-6);
    const {
      firstName = `${AUTO_PREFIX}First`,
      lastName = `Contact_${timestamp}`,
      email = `${AUTO_PREFIX.toLowerCase()}contact_${timestamp}@test.automation.com`,
      organisationSearch,
      grantPortalAccess,
    } = details;

    if (!organisationSearch) {
      this.log.warn('No organisation specified - KT doc requires Primary Organisation for contacts');
    }

    const fullName = `${firstName} ${lastName}`;
    this.log.section(`Creating Contact: ${fullName}`);

    await this.clickNewButton();
    await this.summaryTab.click();
    await this.page.waitForTimeout(TIMEOUTS.SHORT_WAIT);

    await this.setFirstName(firstName);
    await this.setLastName(lastName);
    await this.setEmail(email);

    if (organisationSearch) {
      await this.linkToPrimaryOrganisation(organisationSearch);
    }

    if (grantPortalAccess) {
      await this.setGrantPortalAccess(grantPortalAccess);
    }

    await this.saveContact();
    this.log.success(`Contact created: ${fullName}`);
    return fullName;
  }

  /**
   * Create a contact from within an organisation's sub-grid
   * @param {Object} details - Contact details
   * @returns {Promise<string>} Full name
   */
  async createContactFromOrganisation(details = {}) {
    const timestamp = Date.now().toString().slice(-6);
    const {
      firstName = `${AUTO_PREFIX}First`,
      lastName = `Contact_${timestamp}`,
      email = `${AUTO_PREFIX.toLowerCase()}contact_${timestamp}@test.automation.com`,
    } = details;

    const fullName = `${firstName} ${lastName}`;
    this.log.section(`Creating Contact from Organisation: ${fullName}`);

    await this.safeClick(this.moreCommandsContact);
    await this.safeClick(this.newContactSubgrid);
    await this.page.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);

    await this.setFirstName(firstName);
    await this.setLastName(lastName);
    await this.setEmail(email);

    await this.saveContactWithKeyboard();
    this.log.success(`Contact created from org: ${fullName}`);
    return fullName;
  }

  async updateContactFields(data) {
    this.log.info('Updating contact fields');
    if (data.firstName) await this.setFirstName(data.firstName);
    if (data.lastName) await this.setLastName(data.lastName);
    if (data.email) await this.setEmail(data.email);
    await this.safeClick(this.saveButton);
    await this.page.waitForTimeout(TIMEOUTS.SAVE);
  }

  async changePrimaryOrganisation(newOrgName) {
    this.log.info(`Changing primary org to: ${newOrgName}`);
    await this.linkToPrimaryOrganisation(newOrgName);
    await this.safeClick(this.saveButton);
  }

  async deleteContact() {
    this.log.info('Attempting to delete contact');
    const deleteBtn = this.page.getByRole('button', { name: /Delete/i });
    const deactivateBtn = this.page.getByRole('button', { name: /Deactivate/i });
    if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await deleteBtn.click();
      const confirm = this.page.getByRole('button', { name: /Confirm|Delete|OK/i }).first();
      if (await confirm.isVisible({ timeout: 3000 }).catch(() => false)) await confirm.click();
    } else if (await deactivateBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      this.log.warn('Delete not available — using Deactivate');
      await deactivateBtn.click();
      const confirm = this.page.getByRole('button', { name: /Confirm|Deactivate|OK/i }).first();
      if (await confirm.isVisible({ timeout: 3000 }).catch(() => false)) await confirm.click();
    }
    await this.page.waitForTimeout(TIMEOUTS.SAVE);
  }
}
