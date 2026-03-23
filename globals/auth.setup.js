/**
 * CRM Authentication Setup
 * Performs Microsoft SSO login and saves session state for reuse.
 */

import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { AUTH_STATE, TIMEOUTS } from '../config/constants.js';

dotenv.config();

const authFile = AUTH_STATE.CRM;
const email = process.env.SSO_EMAIL;
const password = process.env.SSO_PASSWORD;

test('CRM: Authenticate and save session', async ({ page, context }) => {
  test.setTimeout(120000);
  console.log('Starting CRM authentication...');

  if (!email || !password) {
    throw new Error('SSO_EMAIL and SSO_PASSWORD must be set in .env');
  }

  // Pre-set Microsoft cookies to avoid "cookies disabled" issues
  await context.addCookies([
    { name: 'MSCC', value: '1', domain: '.login.microsoftonline.com', path: '/', httpOnly: false, secure: true, sameSite: 'None' },
    { name: 'MSPRequ', value: '0', domain: '.login.microsoftonline.com', path: '/', httpOnly: false, secure: true, sameSite: 'None' },
    { name: 'cookie_consent', value: 'accepted', domain: '.login.microsoftonline.com', path: '/', httpOnly: false, secure: true, sameSite: 'None' },
  ]);

  // Force-enable cookies via init script
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'cookieEnabled', { get: () => true, configurable: true });
    try {
      localStorage.setItem('cookieConsent', 'accepted');
      localStorage.setItem('cookiesAccepted', 'true');
    } catch { /* ignore */ }
  });

  // Navigate to CRM (triggers SSO redirect)
  const crmAppsURL = 'https://ciffdev.crm4.dynamics.com/main.aspx?forceUCI=1&pagetype=apps';
  await page.goto(crmAppsURL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);

  let currentUrl = page.url();
  console.log(`Current URL: ${currentUrl}`);

  // Handle cookies disabled page
  if (currentUrl.includes('cookiesdisabled')) {
    console.log('Cookies disabled page detected - handling...');
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'cookieEnabled', { get: () => true, configurable: true });
      document.cookie = 'MSCC=1; path=/; SameSite=None; Secure';
      window.location.reload();
    });
    await page.waitForTimeout(TIMEOUTS.LONG_WAIT);
    currentUrl = page.url();
  }

  // Perform login if on Microsoft login page
  if (currentUrl.includes('login.microsoftonline.com') && !currentUrl.includes('cookiesdisabled')) {
    console.log('On Microsoft login page - entering credentials...');

    // Step 1: Email
    const emailField = page.locator('input[type="email"], input[name="loginfmt"]').first();
    await emailField.waitFor({ state: 'visible', timeout: 15000 });
    await emailField.fill(email);
    console.log(`Entered email: ${email}`);

    // Click Next
    await page.locator('input[type="submit"][value="Next"], #idSIButton9').first().click();
    console.log('Clicked Next');

    // Step 2: Wait for password page to load
    await page.waitForTimeout(3000);

    // Take a debug screenshot before password entry
    console.log(`Password page URL: ${page.url()}`);

    // Find the password field using multiple strategies
    const pwdSelector = 'input[name="passwd"], input#i0118, input[type="password"]';
    await page.waitForSelector(pwdSelector, { state: 'visible', timeout: 15000 });
    console.log('Password field found');

    // Use JavaScript to set the password value directly AND dispatch events
    await page.evaluate((pwd) => {
      const pwdField = document.querySelector('input[name="passwd"]') ||
                       document.querySelector('#i0118') ||
                       document.querySelector('input[type="password"]');
      if (pwdField) {
        // Set value via native setter to trigger React/Angular change detection
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype, 'value'
        ).set;
        nativeInputValueSetter.call(pwdField, pwd);
        pwdField.dispatchEvent(new Event('input', { bubbles: true }));
        pwdField.dispatchEvent(new Event('change', { bubbles: true }));
        pwdField.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
      }
    }, password);

    console.log('Password entered via JS evaluate');
    await page.waitForTimeout(1000);

    // Step 3: Click Sign In
    const signInBtn = page.locator('input[type="submit"][value="Sign in"], #idSIButton9').first();
    await signInBtn.click();
    console.log('Clicked Sign In');

    // Step 4: Wait for either "Stay signed in" dialog or redirect
    await page.waitForTimeout(5000);
    const urlAfterSignIn = page.url();
    console.log(`URL after sign in: ${urlAfterSignIn}`);

    // Check if there's an error on the password page
    const errorVisible = await page.locator('#passwordError, .alert-error, [id*="error"]').isVisible().catch(() => false);
    if (errorVisible) {
      const errorText = await page.locator('#passwordError, .alert-error, [id*="error"]').first().textContent().catch(() => 'unknown');
      console.log(`Login error detected: ${errorText}`);

      // Take screenshot for debugging
      await page.screenshot({ path: 'test-results/password-error-debug.png' });
      throw new Error(`Password error: ${errorText}`);
    }

    // Handle "Stay signed in?" dialog
    try {
      const staySignedInText = page.locator('text=Stay signed in?');
      const yesButton = page.locator('#idSIButton9');

      if (await staySignedInText.isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log('Stay signed in dialog detected');
        await yesButton.click();
        console.log('Clicked "Yes" to stay signed in');
      } else {
        // Try clicking Yes/No button if dialog appeared differently
        const submitYes = page.locator('input[type="submit"][value="Yes"]');
        if (await submitYes.isVisible({ timeout: 3000 }).catch(() => false)) {
          await submitYes.click();
          console.log('Clicked "Yes" button');
        }
      }
    } catch {
      console.log('No "Stay signed in" dialog detected');
    }

    // Wait for final redirect
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(TIMEOUTS.LONG_WAIT);
  }

  // Verify authentication
  const finalUrl = page.url();
  console.log(`Final URL: ${finalUrl}`);

  if (finalUrl.includes('login')) {
    // Take a debug screenshot
    await page.screenshot({ path: 'test-results/auth-final-debug.png' });
    throw new Error('CRM authentication failed - still on login page');
  }

  console.log('CRM authentication successful');

  // Save session state
  const authDir = path.dirname(authFile);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  const storageState = await page.context().storageState();
  fs.writeFileSync(authFile, JSON.stringify(storageState, null, 2));
  console.log(`Session saved to ${authFile} (${storageState.cookies.length} cookies)`);
});
