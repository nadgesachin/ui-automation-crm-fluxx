/**
 * Playwright Configuration
 *
 * Project Structure:
 *   1. crm-setup    → Authenticates to CRM and saves session state
 *   2. fluxx-setup  → Authenticates to Fluxx and saves session state
 *   3. crm-tests    → CRM-only tests (uses CRM session)
 *   4. fluxx-tests  → Fluxx-only tests (uses Fluxx session)
 *   5. integration  → CRM-Fluxx sync tests (uses CRM session, logs in to Fluxx inline)
 *
 * Session Management:
 *   - Auth setup runs once per suite, saves cookies/storage to JSON files
 *   - Subsequent tests reuse saved state, avoiding repeated SSO login
 *   - Firefox is used for setup to handle Microsoft cookie issues reliably
 */

import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

const isHeadless = process.env.HEADLESS !== 'false';
const slowMo = parseInt(process.env.SLOW_MO) || 0;

export default defineConfig({
  /* Test timeout: 2 minutes per test (sync polling can take time) */
  timeout: 180000,

  /* Expect timeout */
  expect: {
    timeout: 15000,
  },

  /* Run tests sequentially (CRM/Fluxx don't support parallel sessions well) */
  fullyParallel: false,
  workers: 1,

  /* Retry failed tests once */
  retries: 1,

  /* Reporter: HTML + console */
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],

  /* Shared settings for all projects */
  use: {
    headless: isHeadless,
    launchOptions: {
      slowMo,
      args: [
        '--disable-features=BlockThirdPartyCookies',
        '--disable-features=SameSiteByDefaultCookies,CookiesWithoutSameSiteMustBeSecure',
      ],
    },
    screenshot: 'on',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 60000,
  },

  /* Project definitions */
  projects: [
    // ===================== SETUP PROJECTS =====================
    {
      name: 'crm-setup',
      testMatch: '**/globals/auth.setup.js',
      use: {
        ...devices['Desktop Firefox'],
      },
    },
    {
      name: 'fluxx-setup',
      testMatch: '**/globals/fluxx-auth.setup.js',
      use: {
        ...devices['Desktop Firefox'],
      },
    },
    {
      name: 'fabric-setup',
      testMatch: '**/globals/fabric-auth.setup.js',
      use: {
        ...devices['Desktop Firefox'],
      },
    },

    // ===================== CRM TESTS =====================
    {
      name: 'crm-tests',
      testDir: './tests/crm',
      testIgnore: ['**/integration/**', '**/contacts/tests/**', '**/organisation/test/**'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/crm-state.json',
      },
      dependencies: ['crm-setup'],
    },

    // ===================== FLUXX TESTS =====================
    {
      name: 'fluxx-tests',
      testDir: './tests/fluxx',
      testIgnore: ['**/organisation/test/**'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/fluxx-state.json',
      },
      dependencies: ['fluxx-setup'],
    },

    // ===================== FABRIC TESTS =====================
    {
      name: 'fabric-tests',
      testDir: './tests/fabric',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/fabric-state.json',
      },
      dependencies: ['fabric-setup'],
    },

    // ===================== INTEGRATION TESTS =====================
    {
      name: 'integration',
      testDir: './tests/integration',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/crm-state.json',
      },
      dependencies: ['crm-tests', 'fluxx-tests', 'fabric-tests'],
    },
  ],
});
