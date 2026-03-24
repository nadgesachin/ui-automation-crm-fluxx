/**
 * Shared Test Context — Single source of truth for test data across the entire suite.
 *
 * Strategy: Create EXACTLY 1 Org + 1 Contact in CRM, reuse everywhere.
 * All records tracked for guaranteed cleanup.
 */
import { AUTO_PREFIX } from '../../config/constants.js';

const timestamp = Date.now().toString().slice(-6);

export const sharedContext = {
  // --- CRM Organisation (created in Phase 1) ---
  org: {
    name: `${AUTO_PREFIX}ORG_E2E_${timestamp}`,
    country: 'India',
    countryLabel: 'India',
    city: 'Mumbai',
    requiredInFluxx: 'Yes',
    fluxxType: 'Individual',
    recipientType: 'Grantee',
    fcraStatus: 'FCRA',
    fcraRegNumber: `${AUTO_PREFIX}FCRA_${timestamp}`,
    fcraExpiryDate: '01-01-2028',
    crmId: null,
    fluxxId: null,
    synced: false,
  },

  // --- CRM Contact (created in Phase 1, linked to org) ---
  contact: {
    firstName: `${AUTO_PREFIX}FN_${timestamp}`,
    lastName: `LN_${timestamp}`,
    email: `auto_e2e_${timestamp}@test.automation.com`,
    fullName: null, // set after creation
    crmId: null,
    fluxxId: null,
    synced: false,
  },

  // --- Fluxx Investment (created in Phase 3) ---
  investment: {
    name: `${AUTO_PREFIX}INV_E2E_${timestamp}`,
    fluxxId: null,
    crmSynced: false,
  },

  // --- Fluxx Co-Funding (created in Phase 3) ---
  coFunding: {
    name: `${AUTO_PREFIX}CF_E2E_${timestamp}`,
    fluxxId: null,
    crmSynced: false,
  },

  // --- Update values (Phase 4) ---
  updates: {
    orgNewCity: 'Delhi',
    contactNewEmail: `auto_e2e_upd_${timestamp}@test.automation.com`,
  },

  // --- Negative test org (Phase 5, deleted in-test) ---
  negativeOrg: {
    name: `${AUTO_PREFIX}NEG_ORG_${timestamp}`,
  },

  // --- Tracking ---
  createdRecords: [],

  trackRecord(system, type, id, name) {
    this.createdRecords.push({ system, type, id, name, createdAt: new Date().toISOString() });
  },

  getCleanupSummary() {
    return {
      total: this.createdRecords.length,
      records: this.createdRecords.map(r => `${r.system}/${r.type}: ${r.name} (${r.id || 'no-id'})`),
    };
  },
};
