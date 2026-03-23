/**
 * Fluxx Login Page Object
 * Handles Fluxx SSO authentication via Microsoft Azure AD.
 * Credentials are read from environment variables (not hardcoded).
 */

import { BasePage } from './BasePage.js';
import { getFluxxConfig, getSSOCredentials } from '../config/environments.js';
import { TIMEOUTS } from '../config/constants.js';

export class FluxxLoginPage extends BasePage {
  constructor(page) {
    super(page, 'FluxxLogin');

    const config = getFluxxConfig();
    this.fluxxBaseURL = config.baseURL;
    this.fluxxDashboardURL = config.dashboardURL;
    this.ssoLauncherURL = config.ssoLauncherURL;

    // SSO Login selectors (Microsoft login form)
    this.emailInput = page.getByPlaceholder('userid@ciff.org');
    this.nextButton = page.getByRole('button', { name: 'Next' });
    this.passwordInput = page.locator('#i0118');
    this.signInButton = page.getByRole('button', { name: 'Sign in' });
    this.yesButton = page.getByRole('button', { name: 'Yes' });

    // Fluxx dashboard elements
    this.quickActionsHub = page.getByLabel('Open Quick Actions Hub');
  }

  /**
   * Navigate to Fluxx via SSO launcher
   */
  async navigateToFluxx() {
    this.log.info('Navigating to Fluxx via SSO launcher...');
    await this.navigate(this.ssoLauncherURL);
    await this.page.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);
  }

  /**
   * Navigate to Fluxx dashboard directly
   */
  async navigateToDashboard() {
    this.log.info('Navigating to Fluxx dashboard...');
    await this.navigate(this.fluxxDashboardURL);
    await this.page.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);
  }

  /**
   * Perform SSO login with Microsoft credentials
   */
  async performSSOLogin() {
    const { email, password } = getSSOCredentials();
    this.log.info('Performing SSO login...');

    // Step 1: Enter email
    this.log.info('Entering email...');
    await this.waitForVisible(this.emailInput, TIMEOUTS.SSO_LOGIN);
    await this.emailInput.fill(email);

    // Step 2: Click Next
    await this.safeClick(this.nextButton);
    await this.page.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);

    // Step 3: Enter password (using JS evaluate to handle special characters)
    this.log.info('Entering password...');
    await this.page.waitForTimeout(2000);
    const pwdSelector = 'input[name="passwd"], #i0118, input[type="password"]';
    await this.page.waitForSelector(pwdSelector, { state: 'visible', timeout: TIMEOUTS.SSO_LOGIN });

    await this.page.evaluate((pwd) => {
      const pwdField = document.querySelector('input[name="passwd"]') ||
                       document.querySelector('#i0118') ||
                       document.querySelector('input[type="password"]');
      if (pwdField) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype, 'value'
        ).set;
        nativeInputValueSetter.call(pwdField, pwd);
        pwdField.dispatchEvent(new Event('input', { bubbles: true }));
        pwdField.dispatchEvent(new Event('change', { bubbles: true }));
        pwdField.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
      }
    }, password);
    await this.page.waitForTimeout(1000);

    // Step 4: Click Sign in
    const signInBtn = this.page.locator('input[type="submit"][value="Sign in"], #idSIButton9').first();
    await signInBtn.click();
    await this.page.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);

    // Step 5: Click Yes (Stay signed in) if visible
    this.log.info('Handling Stay signed in prompt...');
    try {
      const staySignedInText = this.page.locator('text=Stay signed in?');
      if (await staySignedInText.isVisible({ timeout: 5000 }).catch(() => false)) {
        await this.page.locator('#idSIButton9').click();
        this.log.info('Clicked "Stay signed in"');
      } else {
        const submitYes = this.page.locator('input[type="submit"][value="Yes"]');
        if (await submitYes.isVisible({ timeout: 3000 }).catch(() => false)) {
          await submitYes.click();
          this.log.info('Clicked "Yes" button');
        }
      }
    } catch {
      this.log.debug('"Stay signed in" prompt not shown');
    }

    // Wait for redirect to complete
    await this.page.waitForTimeout(TIMEOUTS.POST_LOGIN);
    this.log.info('SSO login completed');
  }

  /**
   * Check if user is logged in (not on login page)
   * @returns {boolean}
   */
  async isLoggedIn() {
    const currentUrl = this.getCurrentURL();
    return !currentUrl.includes('login') && !currentUrl.includes('signin');
  }

  /**
   * Wait for Fluxx dashboard to fully load
   */
  async waitForDashboardToLoad() {
    this.log.debug('Waiting for dashboard to load...');
    try {
      await this.page.waitForSelector('div[role="main"]', {
        timeout: TIMEOUTS.ELEMENT_VISIBLE,
      }).catch(() => null);
      await this.page.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);
    } catch {
      this.log.debug('Dashboard load check timed out, continuing...');
    }
  }

  /**
   * Full login flow: Navigate -> SSO Login -> Verify
   */
  async login() {
    this.log.section('Fluxx Login Flow');

    await this.navigateToFluxx();

    // Check if already logged in (session restored)
    const alreadyLoggedIn = await this.isLoggedIn();
    if (alreadyLoggedIn) {
      this.log.info('Already logged in via restored session');
      await this.waitForDashboardToLoad();
      return;
    }

    await this.performSSOLogin();
    await this.waitForDashboardToLoad();

    const loggedIn = await this.isLoggedIn();
    if (!loggedIn) {
      throw new Error('Failed to login to Fluxx after SSO flow');
    }

    this.log.success('Successfully logged in to Fluxx');
  }
}
