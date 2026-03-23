/**
 * Test Data Manager
 * Generates, tracks, and manages automation test data.
 * All created data is prefixed with AUTO_UI_ for identification and cleanup.
 */

import { AUTO_PREFIX } from '../config/constants.js';

export class TestDataManager {
  constructor() {
    /** @type {string[]} Track all created entity names for cleanup */
    this.createdOrganisations = [];
    this.createdContacts = [];
    this.createdInvestments = [];
    this.createdCoFunding = [];
  }

  /**
   * Generate a unique organisation name with AUTO_UI_ prefix
   * @param {string} suffix - Descriptive suffix (e.g., 'India_Grantee_FCRA')
   * @returns {string} Unique organisation name
   */
  generateOrgName(suffix = 'Org') {
    const timestamp = Date.now().toString().slice(-8);
    const name = `${AUTO_PREFIX}${suffix}_${timestamp}`;
    this.createdOrganisations.push(name);
    return name;
  }

  /**
   * Generate a unique contact name with AUTO_UI_ prefix
   * @param {string} [firstName] - First name override
   * @param {string} [lastName] - Last name override
   * @returns {{ firstName: string, lastName: string, fullName: string }}
   */
  generateContactName(firstName, lastName) {
    const timestamp = Date.now().toString().slice(-6);
    const first = firstName || `${AUTO_PREFIX}First`;
    const last = lastName || `Contact_${timestamp}`;
    const fullName = `${first} ${last}`;
    this.createdContacts.push(fullName);
    return { firstName: first, lastName: last, fullName };
  }

  /**
   * Generate a unique email for test contact
   * @param {string} name - Base name for email
   * @returns {string} Email address
   */
  generateEmail(name = 'test') {
    const timestamp = Date.now().toString().slice(-6);
    return `${AUTO_PREFIX.toLowerCase()}${name}_${timestamp}@test.automation.com`;
  }

  /**
   * Generate FCRA registration number
   * @returns {string} FCRA registration number
   */
  generateFCRANumber() {
    const timestamp = Date.now().toString().slice(-6);
    return `${AUTO_PREFIX}FCRA_${timestamp}`;
  }

  /**
   * Generate a future date string (for FCRA expiry, etc.)
   * @param {number} monthsFromNow - Months from today
   * @returns {string} Date in DD-MM-YYYY format (CRM format)
   */
  generateFutureDate(monthsFromNow = 12) {
    const date = new Date();
    date.setMonth(date.getMonth() + monthsFromNow);
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  }

  /**
   * Generate a unique investment name with AUTO_UI_ prefix
   * @param {string} suffix - Descriptive suffix (e.g., 'Inv')
   * @returns {string} Unique investment name
   */
  generateInvestmentName(suffix = 'Inv') {
    const timestamp = Date.now().toString().slice(-8);
    const name = `${AUTO_PREFIX}INV_${suffix}_${timestamp}`;
    this.createdInvestments.push(name);
    return name;
  }

  /**
   * Generate a unique co-funding name with AUTO_UI_ prefix
   * @param {string} suffix - Descriptive suffix (e.g., 'CF')
   * @returns {string} Unique co-funding name
   */
  generateCoFundingName(suffix = 'CF') {
    const timestamp = Date.now().toString().slice(-8);
    const name = `${AUTO_PREFIX}CF_${suffix}_${timestamp}`;
    this.createdCoFunding.push(name);
    return name;
  }

  /**
   * Get all created organisation names (for cleanup)
   * @returns {string[]}
   */
  getCreatedOrganisations() {
    return [...this.createdOrganisations];
  }

  /**
   * Get all created contact names (for cleanup)
   * @returns {string[]}
   */
  getCreatedContacts() {
    return [...this.createdContacts];
  }

  /**
   * Get all created investment names (for cleanup)
   * @returns {string[]}
   */
  getCreatedInvestments() { return this.createdInvestments; }

  /**
   * Get all created co-funding names (for cleanup)
   * @returns {string[]}
   */
  getCreatedCoFunding() { return this.createdCoFunding; }

  /**
   * Log all created test data (useful at end of test run)
   */
  logCreatedData() {
    console.log('\n--- AUTO_UI_ Test Data Created ---');
    if (this.createdOrganisations.length > 0) {
      console.log('Organisations:');
      this.createdOrganisations.forEach((name) => console.log(`  - ${name}`));
    }
    if (this.createdContacts.length > 0) {
      console.log('Contacts:');
      this.createdContacts.forEach((name) => console.log(`  - ${name}`));
    }
    if (this.createdInvestments.length > 0) {
      console.log('Investments:');
      this.createdInvestments.forEach((name) => console.log(`  - ${name}`));
    }
    if (this.createdCoFunding.length > 0) {
      console.log('Co-Funding:');
      this.createdCoFunding.forEach((name) => console.log(`  - ${name}`));
    }
    console.log('--- End Test Data ---\n');
  }
}

/** Singleton instance for shared test data tracking across a test run */
export const testDataManager = new TestDataManager();
