/**
 * Framework Constants
 * Centralized constants for test data naming, timeouts, and retry configuration.
 */

/** Prefix for all automation-created data (for identification and cleanup) */
export const AUTO_PREFIX = 'AUTO_UI_';

/** Timeout settings (in milliseconds) */
export const TIMEOUTS = {
  /** Default page navigation timeout */
  NAVIGATION: 60000,
  /** Default element visibility timeout */
  ELEMENT_VISIBLE: 15000,
  /** Default action timeout */
  ACTION: 10000,
  /** Form load timeout */
  FORM_LOAD: 15000,
  /** Save operation timeout */
  SAVE: 30000,
  /** SSO login flow timeout */
  SSO_LOGIN: 60000,
  /** Page load after login */
  POST_LOGIN: 10000,
  /** Short stabilization wait */
  SHORT_WAIT: 1000,
  /** Medium stabilization wait */
  MEDIUM_WAIT: 3000,
  /** Long stabilization wait */
  LONG_WAIT: 5000,
};

/** Sync retry configuration (CRM to Fluxx) */
export const SYNC_RETRY = {
  /** Maximum number of retry attempts */
  MAX_RETRIES: 24,
  /** Delay between retries in milliseconds */
  DELAY_MS: 5000,
  /** Total max wait time: 24 * 5000 = 120000ms (2 minutes) */
};

/** Auth state file paths */
export const AUTH_STATE = {
  CRM: 'playwright/.auth/crm-state.json',
  FLUXX: 'playwright/.auth/fluxx-state.json',
  FABRIC: 'playwright/.auth/fabric-state.json',
};

/** CRM Field Options */
export const CRM_OPTIONS = {
  REQUIRED_IN_FLUXX: {
    YES: 'Yes',
    NO: 'No',
  },
  FLUXX_ORG_TYPE: {
    INDIVIDUAL: 'Individual',
    ORGANISATION: 'Organisation',
  },
  RECIPIENT_TYPE: {
    GRANTEE: 'Grantee',
    EXEMPT: 'Exempt',
    SERVICE_PROVIDER_ENTITY: 'Service Provider (Entity)',
    CONSULTANCY_INDIVIDUAL: 'Consultancy (Individual)',
  },
  FCRA_STATUS: {
    FCRA: 'FCRA',
    NON_FCRA: 'Non-FCRA',
  },
};

/** Grant Portal Access (KT doc Section 3.4) */
export const GRANT_PORTAL_ACCESS = {
  YES: 'Yes',
  NO: 'No',
};

/**
 * Contact sync rules (KT doc Section 3.1):
 * - Every contact MUST have Primary Organization
 * - Max 3 organizations per contact
 * - ALL linked orgs MUST have Required in Fluxx = Yes for contact to sync
 */
export const CONTACT_RULES = {
  MAX_ORGANISATIONS: 3,
  PRIMARY_ORG_MANDATORY: true,
};

/**
 * Data flow directions (KT doc):
 * - Organizations: CRM -> Fluxx (one-way)
 * - Contacts: CRM -> Fluxx (linking is bi-directional)
 * - Investments: Fluxx -> CRM (opposite direction)
 */
export const SYNC_DIRECTION = {
  ORGANISATIONS: 'CRM_TO_FLUXX',
  CONTACTS: 'CRM_TO_FLUXX',
  INVESTMENTS: 'FLUXX_TO_CRM',
};

/** Fluxx Organisation Detail Field Selectors */
export const FLUXX_DETAIL_FIELDS = {
  RECIPIENT_TYPE: '#organization_recipient_type',
  FCRA_STATUS: '#organization_fcra_status',
  FCRA_REGISTRATION_NUMBER: '#organization_fcra_registration_number',
  FCRA_CERTIFICATE_EXPIRY_DATE: '#organization_fcra_certificate_expiry_date',
  ORG_TYPE: '#organization_org_type',
};

/** Fluxx Contact Detail Field Selectors (from contact verification reference) */
export const FLUXX_CONTACT_FIELDS = {
  /** Container card for contact details */
  CONTACT_CARD: '#fluxx-card-7',
  /** Primary organisation field on contact detail */
  PRIMARY_ORGANISATION: '#user_primary_organization_id',
};

export const FABRIC_SELECTORS = {
  REPORT_TITLE: 'Programme Rating Dashboard',
  KPI_TOTAL_INVESTMENTS: 'Total Investments / DA',
  KPI_TOTAL_RATED: 'Total Rated Investments / DA',
  FILTER_INVESTMENT_TYPE: 'investmenttype',
  FILTER_YEAR: 'Year',
  FILTER_PROGRAMME_TEAM: 'powerbiprogrammeteam',
  FILTER_CORE_STRATEGY: 'core_strategy',
  FILTER_MONTH: 'month',
  TAB_OVERVIEW: 'Overview',
  TAB_DETAILED_VIEW: 'Detailed View',
  RATING_COLORS: ['White - Too soon', 'Red - major issues', 'Amber - minor issues', 'Green - on track', 'Blue - Exceeding'],
  PROGRAMME_TEAMS: ['Africa', 'Climate', 'EME', 'India', 'Nutrition', 'SRHR'],
};

export const FLUXX_INVESTMENT_FIELDS = {
  NAME: '',
  PROGRAMME_TEAM: '',
  INVESTMENT_TYPE: '',
  RATING: '',
};

export const FLUXX_COFUNDING_FIELDS = {
  NAME: '',
  FUNDER: '',
  AMOUNT: '',
};
