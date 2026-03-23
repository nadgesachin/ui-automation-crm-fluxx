/**
 * Environment Configuration
 * Centralizes all environment-specific URLs, credentials, and settings.
 * Reads from .env file and provides structured access.
 */

import dotenv from 'dotenv';
dotenv.config();

const environments = {
  dev: {
    crm: {
      baseURL: 'https://ciffdev.crm4.dynamics.com',
      appsPageURL: 'https://ciffdev.crm4.dynamics.com/main.aspx?forceUCI=1&pagetype=apps',
    },
    fluxx: {
      baseURL: 'https://ciff.eu-preprod.fluxxlabs.com',
      dashboardURL: 'https://ciff.eu-preprod.fluxxlabs.com/central/quick-actions',
      ssoLauncherURL: 'https://launcher.myapps.microsoft.com/api/signin/8ec23bcd-3576-4724-8468-b90064ce6a16?tenantId=74f3d84e-f433-4937-aca1-88c022bfc4f7',
    },
    sso: {
      tenantId: '74f3d84e-f433-4937-aca1-88c022bfc4f7',
      loginDomain: 'login.microsoftonline.com',
    },
  },
};

/**
 * Get current environment config
 * @returns {Object} Environment configuration
 */
export function getEnvironment() {
  const env = process.env.TEST_ENV || 'dev';
  const config = environments[env];

  if (!config) {
    throw new Error(`Unknown environment: ${env}. Available: ${Object.keys(environments).join(', ')}`);
  }

  return config;
}

/**
 * Get SSO credentials from environment variables
 * @returns {Object} SSO credentials
 */
export function getSSOCredentials() {
  const email = process.env.SSO_EMAIL;
  const password = process.env.SSO_PASSWORD;

  if (!email || !password) {
    throw new Error('SSO_EMAIL and SSO_PASSWORD must be set in .env file');
  }

  return { email, password };
}

/**
 * Get CRM-specific config
 * @returns {Object} CRM config with URLs
 */
export function getCRMConfig() {
  return getEnvironment().crm;
}

/**
 * Get Fluxx-specific config
 * @returns {Object} Fluxx config with URLs
 */
export function getFluxxConfig() {
  return getEnvironment().fluxx;
}

/**
 * Get SSO config
 * @returns {Object} SSO config with tenant and domain info
 */
export function getSSOConfig() {
  return getEnvironment().sso;
}
