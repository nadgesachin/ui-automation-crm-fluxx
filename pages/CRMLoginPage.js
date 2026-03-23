/**
 * CRM Login Page Object
 * Handles CRM authentication, app navigation, and module access.
 * Uses saved session state to avoid repeated SSO login.
 */

import { BasePage } from './BasePage.js';
import { getCRMConfig } from '../config/environments.js';
import { TIMEOUTS } from '../config/constants.js';

export class CRMLoginPage extends BasePage {
  constructor(page) {
    super(page, 'CRMLogin');

    const config = getCRMConfig();
    this.baseURL = config.baseURL;
    this.appsPageURL = config.appsPageURL;

    // Selectors
    this.organisationNav = page.getByText('Organisation');
    this.contactsNav = page.getByText('Contacts');
  }

  /**
   * Navigate to CRM and open Sales Hub
   * Uses the base URL first, then handles the app selector if needed
   */
  async navigateToAppsAndOpenSalesHub() {
    this.log.info('Navigating to CRM...');

    // Check if already in a CRM app (Sales Hub)
    const currentUrl = this.page.url();
    if (currentUrl.includes('appid=') && currentUrl.includes('dynamics.com')) {
      this.log.info('Already in Sales Hub app');
      return;
    }

    // Navigate to CRM base URL
    await this.page.goto(this.baseURL, { waitUntil: 'domcontentloaded', timeout: TIMEOUTS.NAVIGATION });
    await this.page.waitForTimeout(5000); // Wait for full page load including iframe

    // Check if redirected to apps page (need to select Sales Hub)
    const url = this.page.url();
    if (url.includes('pagetype=apps') || url.includes(this.baseURL)) {
      this.log.info('On apps page - clicking Sales Hub...');

      // Wait for iframe to be ready and click Sales Hub
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const salesHub = this.page.frameLocator('iframe[title="AppLandingPage"]')
            .getByLabel('Sales Hub Modernize the sales');
          await salesHub.click({ timeout: 20000 });
          await this.page.waitForTimeout(5000);

          // Verify we're in Sales Hub
          if (this.page.url().includes('appid=')) {
            this.log.info('Sales Hub opened');
            return;
          }
        } catch (error) {
          this.log.warn(`Sales Hub attempt ${attempt} failed: ${error.message.substring(0, 80)}`);
          if (attempt < 3) {
            // Try the apps URL specifically
            await this.page.goto(this.appsPageURL, { waitUntil: 'domcontentloaded', timeout: TIMEOUTS.NAVIGATION });
            await this.page.waitForTimeout(5000);
          } else {
            throw new Error('Failed to open Sales Hub after 3 attempts');
          }
        }
      }
    }

    this.log.info('CRM navigation complete');
  }

  /**
   * Navigate to Organisation entity list
   */
  async navigateToOrganisation() {
    this.log.info('Navigating to Organisation...');
    await this.organisationNav.click({ timeout: TIMEOUTS.ACTION });
    await this.page.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);
    this.log.info('Organisation page loaded');
  }

  /**
   * Navigate to Contacts entity list
   */
  async navigateToContacts() {
    this.log.info('Navigating to Contacts...');
    await this.contactsNav.click({ timeout: TIMEOUTS.ACTION });
    await this.page.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);
    this.log.info('Contacts page loaded');
  }

  /**
   * Full navigation flow: CRM -> Sales Hub -> Target module
   * @param {'organisation' | 'contacts'} module - Module to navigate to
   */
  async navigateToModule(module = 'organisation') {
    await this.navigateToAppsAndOpenSalesHub();

    if (module === 'organisation') {
      await this.navigateToOrganisation();
    } else if (module === 'contacts') {
      await this.navigateToContacts();
    }
  }

  /**
   * Verify user is authenticated (not on login page)
   * @returns {boolean}
   */
  async verifyAuthenticated() {
    const currentUrl = this.getCurrentURL();
    const isOnLoginPage = currentUrl.includes('login') || currentUrl.includes('signin');

    if (isOnLoginPage) {
      throw new Error('Not authenticated - redirected to login page');
    }

    this.log.info('User is authenticated');
    return true;
  }
}
