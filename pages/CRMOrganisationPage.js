/**
 * CRM Organisation Page Object
 * Handles organisation creation, editing, and field management in Dynamics 365 CRM.
 *
 * Important selector notes (from working tests):
 * - Country uses a Lookup field (search + select), NOT a simple dropdown
 * - FCRA Status options are 'FCRA' / 'Non-FCRA' (NOT 'Yes' / 'No')
 * - FCRA fields: 'FCRA Registration number', 'Date of FCRA certificate'
 * - Save button: 'Save (CTRL+S)'
 * - Saved verification: #formHeaderTitle_2 contains 'orgName- Saved'
 */

import { BasePage } from './BasePage.js';
import { TIMEOUTS, AUTO_PREFIX } from '../config/constants.js';

export class CRMOrganisationPage extends BasePage {
  constructor(page) {
    super(page, 'CRMOrganisation');

    // Action buttons
    this.newButton = page.getByLabel('New', { exact: true });
    this.saveButton = page.getByLabel('Save (CTRL+S)');

    // Form fields
    this.organisationNameField = page.getByLabel('Organisation Name');
    this.requiredInFluxxField = page.getByLabel('Required in Fluxx');
    this.fluxxOrgTypeField = page.getByLabel('Fluxx Organisation Type');
    this.countryLookupField = page.getByLabel('Country of Registration, Lookup', { exact: true });
    this.countrySearchInput = page.getByPlaceholder('Look for Country of');
    this.cityField = page.getByLabel('City', { exact: true });
    this.recipientTypeField = page.getByLabel('Recipient Type');
    this.fcraStatusField = page.getByLabel('FCRA Status');
    this.fcraRegistrationNumberField = page.getByLabel('FCRA Registration number');
    this.fcraExpiryDateField = page.getByLabel('Date of FCRA certificate');

    // Verification
    this.formHeaderTitle = page.locator('#formHeaderTitle_2');
    this.filterByKeyword = page.getByPlaceholder('Filter by keyword');
  }

  /**
   * Generate unique organisation name with AUTO_UI_ prefix
   * @param {string} [suffix='Org'] - Descriptive suffix
   * @returns {string}
   */
  generateOrganisationName(suffix = 'Org') {
    const timestamp = Date.now().toString().slice(-6);
    return `${AUTO_PREFIX}${suffix}_${timestamp}`;
  }

  /**
   * Click New button to open create form
   */
  async clickNewButton() {
    this.log.info('Clicking New button...');
    await this.safeClick(this.newButton, { timeout: 20000, retries: 3 });
    await this.page.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);
  }

  /**
   * Wait for the organisation form to load
   */
  async waitForFormToLoad() {
    this.log.debug('Waiting for form to load...');
    await this.waitForVisible(this.organisationNameField, 30000);
  }

  /**
   * Fill organisation name
   * @param {string} name
   */
  async fillOrganisationName(name) {
    this.log.info(`Setting Organisation Name: ${name}`);
    await this.organisationNameField.click();
    await this.organisationNameField.fill(name);
  }

  /**
   * Set Required in Fluxx dropdown
   * @param {string} value - 'Yes' or 'No'
   */
  async setRequiredInFluxx(value) {
    this.log.info(`Setting Required in Fluxx: ${value}`);
    await this.selectDropdownOption(this.requiredInFluxxField, value);
  }

  /**
   * Set Fluxx Organisation Type dropdown
   * @param {string} type - 'Individual' or 'Organisation'
   */
  async setFluxxOrganisationType(type) {
    this.log.info(`Setting Fluxx Organisation Type: ${type}`);
    await this.selectDropdownOption(this.fluxxOrgTypeField, type);
  }

  /**
   * Set Country of Registration via lookup search
   * @param {string} country - Country name to search
   * @param {string} resultLabel - Full label of the result to click (e.g., 'India, 01/08/2023 07:')
   */
  async setCountry(country, resultLabel) {
    this.log.info(`Setting Country: ${country}`);
    await this.safeClick(this.countryLookupField);
    await this.safeFill(this.countrySearchInput, country.toLowerCase());
    await this.page.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);

    // Click the matching result
    if (resultLabel) {
      await this.page.getByLabel(resultLabel).click();
    } else {
      // Try multiple strategies to select the country
      const treeItem = this.page.getByRole('treeitem').filter({ hasText: country }).first();
      if (await treeItem.isVisible({ timeout: 5000 }).catch(() => false)) {
        await treeItem.click();
      } else {
        // Fallback: click any element containing the country name in lookup results
        const labelMatch = this.page.locator(`[aria-label*="${country}"]`).first();
        if (await labelMatch.isVisible({ timeout: 3000 }).catch(() => false)) {
          await labelMatch.click();
        } else {
          // Last fallback: press Enter to select first result
          this.log.warn(`Country "${country}" not found in results, pressing Enter`);
          await this.countrySearchInput.press('Enter');
        }
      }
    }
    await this.page.waitForTimeout(TIMEOUTS.SHORT_WAIT);
  }

  /**
   * Set City
   * @param {string} city
   */
  async setCity(city) {
    this.log.info(`Setting City: ${city}`);
    await this.cityField.click();
    await this.cityField.fill(city);
  }

  /**
   * Set Recipient Type dropdown
   * @param {string} type - e.g., 'Grantee', 'Exempt', 'Service Provider (Entity)'
   */
  async setRecipientType(type) {
    this.log.info(`Setting Recipient Type: ${type}`);
    await this.selectDropdownOption(this.recipientTypeField, type);
  }

  /**
   * Set FCRA Status dropdown
   * @param {string} status - 'FCRA' or 'Non-FCRA'
   */
  async setFCRAStatus(status) {
    this.log.info(`Setting FCRA Status: ${status}`);
    await this.fcraStatusField.click();
    await this.page.waitForTimeout(TIMEOUTS.SHORT_WAIT);

    // Try exact match first, then partial match
    const option = this.page.getByRole('option', { name: status, exact: true });
    if (await option.isVisible({ timeout: 3000 }).catch(() => false)) {
      await option.click();
    } else {
      // Fallback: try without exact match or with alternative names
      const alternatives = [status, status.replace('-', ' '), status.replace(' ', '-')];
      let clicked = false;
      for (const alt of alternatives) {
        const altOption = this.page.getByRole('option', { name: alt });
        if (await altOption.isVisible({ timeout: 2000 }).catch(() => false)) {
          await altOption.click();
          clicked = true;
          break;
        }
      }
      if (!clicked) {
        // Last resort: click by text content
        await this.page.locator(`[role="option"]:has-text("${status}")`).first().click();
      }
    }
    await this.page.waitForTimeout(TIMEOUTS.SHORT_WAIT);
  }

  /**
   * Set FCRA Registration Number
   * @param {string} regNumber
   */
  async setFCRARegistrationNumber(regNumber) {
    this.log.info(`Setting FCRA Registration Number: ${regNumber}`);
    await this.fcraRegistrationNumberField.click();
    await this.fcraRegistrationNumberField.fill(regNumber);
  }

  /**
   * Set Date of FCRA certificate
   * @param {string} date - Date in DD-MM-YYYY format
   */
  async setFCRAExpiryDate(date) {
    this.log.info(`Setting FCRA Certificate Date: ${date}`);
    await this.fcraExpiryDateField.click();
    await this.fcraExpiryDateField.fill(date);
  }

  /**
   * Check if a field is visible (for conditional fields)
   * @param {string} fieldName
   * @returns {Promise<boolean>}
   */
  async isFieldVisible(fieldName) {
    const fieldMap = {
      'Fluxx Organisation Type': this.fluxxOrgTypeField,
      'Recipient Type': this.recipientTypeField,
      'FCRA Status': this.fcraStatusField,
      'FCRA Registration number': this.fcraRegistrationNumberField,
      'Date of FCRA certificate': this.fcraExpiryDateField,
      'City': this.cityField,
    };

    const field = fieldMap[fieldName];
    if (!field) return false;
    return this.isVisible(field);
  }

  /**
   * Save the organisation form
   */
  async saveOrganisation() {
    this.log.info('Saving organisation...');
    await this.safeClick(this.saveButton);
    await this.page.waitForTimeout(TIMEOUTS.LONG_WAIT);
  }

  /**
   * Verify organisation was saved successfully
   * @param {string} orgName - Expected organisation name
   * @returns {Promise<boolean>}
   */
  async verifySaved(orgName) {
    this.log.info(`Verifying save for: ${orgName}`);
    try {
      await this.page.waitForTimeout(TIMEOUTS.LONG_WAIT);
      const headerText = await this.formHeaderTitle.textContent({ timeout: TIMEOUTS.SAVE });
      const isSaved = headerText.includes(orgName);
      if (isSaved) {
        this.log.success(`Organisation saved: ${orgName}`);
      } else {
        this.log.warn(`Header text: "${headerText}" does not contain "${orgName}"`);
      }
      return isSaved;
    } catch (error) {
      this.log.error('Save verification failed', error);
      return false;
    }
  }

  /**
   * Create a basic organisation (non-India)
   * @param {Object} details - Organisation creation details
   * @param {string} [details.name] - Organisation name (auto-generated if omitted)
   * @param {string} [details.requiredInFluxx='Yes'] - Required in Fluxx
   * @param {string} [details.fluxxType='Individual'] - Fluxx Org Type
   * @param {string} [details.country='United States'] - Country
   * @param {string} [details.countryLabel] - Country result label for lookup
   * @param {string} [details.city='New York'] - City
   * @returns {Promise<string>} Created organisation name
   */
  async createOrganisation(details = {}) {
    const {
      name = this.generateOrganisationName('Org'),
      requiredInFluxx = 'Yes',
      fluxxType = 'Individual',
      country = 'United States',
      countryLabel,
      city = 'New York',
    } = details;

    this.log.section(`Creating Organisation: ${name}`);

    await this.clickNewButton();
    await this.waitForFormToLoad();
    await this.fillOrganisationName(name);
    await this.setRequiredInFluxx(requiredInFluxx);

    if (requiredInFluxx === 'Yes') {
      await this.setFluxxOrganisationType(fluxxType);
      await this.setCountry(country, countryLabel);
      await this.setCity(city);
    }

    await this.saveOrganisation();
    this.log.success(`Organisation created: ${name}`);
    return name;
  }

  /**
   * Create an India organisation with FCRA fields
   * @param {Object} details - Organisation details
   * @param {string} [details.name] - Organisation name (auto-generated if omitted)
   * @param {string} [details.fluxxType='Individual'] - Fluxx Org Type
   * @param {string} [details.city='Mumbai'] - City
   * @param {string} [details.recipientType='Grantee'] - Recipient Type
   * @param {string} [details.fcraStatus='FCRA'] - FCRA Status ('FCRA' or 'Non-FCRA')
   * @param {string} [details.fcraRegNumber] - FCRA Registration Number
   * @param {string} [details.fcraExpiryDate] - FCRA Certificate Date (DD-MM-YYYY)
   * @param {string} [details.countryLabel] - Country result label for lookup
   * @returns {Promise<string>} Created organisation name
   */
  async createIndiaOrganisationWithFCRA(details = {}) {
    const {
      name = this.generateOrganisationName('India_FCRA'),
      fluxxType = 'Individual',
      city = 'Mumbai',
      recipientType = 'Grantee',
      fcraStatus = 'FCRA',
      fcraRegNumber = `${AUTO_PREFIX}FCRA_${Date.now().toString().slice(-6)}`,
      fcraExpiryDate = '12-04-2027',
      countryLabel,
    } = details;

    this.log.section(`Creating India Organisation with FCRA: ${name}`);

    await this.clickNewButton();
    await this.waitForFormToLoad();
    await this.fillOrganisationName(name);
    await this.setRequiredInFluxx('Yes');
    await this.setCountry('India', countryLabel);
    await this.setFluxxOrganisationType(fluxxType);
    await this.setCity(city);
    await this.setRecipientType(recipientType);

    if (recipientType === 'Grantee') {
      await this.setFCRAStatus(fcraStatus);

      if (fcraStatus === 'FCRA') {
        await this.setFCRARegistrationNumber(fcraRegNumber);
        await this.setFCRAExpiryDate(fcraExpiryDate);
      }
    }

    await this.saveOrganisation();
    this.log.success(`India organisation created: ${name}`);
    return name;
  }

  /**
   * Search for an organisation by keyword in the list view
   * @param {string} keyword - Search keyword
   */
  async searchOrganisation(keyword) {
    this.log.info(`Searching for: ${keyword}`);
    await this.filterByKeyword.click();
    await this.filterByKeyword.fill(keyword);
    await this.filterByKeyword.press('Enter');
    await this.page.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);
  }

  /**
   * Click on an organisation in the list
   * @param {string} orgName - Organisation name to click
   */
  async openOrganisation(orgName) {
    this.log.info(`Opening organisation: ${orgName}`);
    await this.page.getByLabel(orgName).click();
    await this.page.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);
  }
}
