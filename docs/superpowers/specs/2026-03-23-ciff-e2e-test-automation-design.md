# CIFF End-to-End Test Automation Suite — Design Spec

**Date:** 2026-03-23
**Author:** Claude + Nagde Sachin
**Status:** Draft
**Systems Under Test:** Microsoft Dynamics 365 CRM, Fluxx Grant Management, Microsoft Fabric (Power BI)

---

## 1. Overview

Extend the existing CRM-Fluxx Playwright automation framework to provide full end-to-end coverage across three systems:

- **CRM** (Microsoft Dynamics 365) — Organisation and Contact CRUD
- **Fluxx** (Grant Management Portal) — Organisation, People, Investment, Co-Funding CRUD + read-only verification of Requests, Grants, Reports, Payments, Amendments
- **Fabric** (Power BI Portfolio Rating Dashboard) — Dashboard validation, filter interactions, data accuracy

The test suite validates the data pipeline: **CRM → Fluxx → Fabric**, with test data cleanup after every run.

---

## 2. Scope

### 2.1 Full CRUD Modules

| Module | Portal | Operations |
|--------|--------|-----------|
| Organisations | CRM + Fluxx | Create, Read, Update, Delete, Search |
| Contacts/People | CRM + Fluxx | Create, Read, Update, Delete, Search |
| Investment | Fluxx | Create, Read, Update, Delete, Search |
| Co-Funding | Fluxx | Create, Read, Update, Delete, Search |

### 2.2 Read-Only Modules

| Module | Portal | Operations |
|--------|--------|-----------|
| Requests | Fluxx | List view, detail view, search |
| Grants | Fluxx | List view, detail view, search |
| Reports | Fluxx | List view, detail view |
| Payments | Fluxx | List view, detail view |
| Amendments | Fluxx | List view, detail view |
| Portfolio Rating Dashboard | Fabric | KPIs, charts, filters, navigation |

### 2.3 Integration / Pipeline

| Pipeline | Direction | What's Verified |
|----------|-----------|----------------|
| CRM → Fluxx | Org + Contact sync | Field mapping, timing, presence/absence |
| Fluxx → Fabric | Investment data | KPI counts, chart data, table rows |
| CRM → Fluxx → Fabric | Full E2E | Org created in CRM appears in Fluxx, investment data reflects in Fabric |

### 2.4 Test Data Cleanup

All test data is prefixed with `AUTO_UI_`. After every test run:
- `afterAll` hooks delete records created during the suite
- `TestDataCleaner` utility tracks all created record IDs
- Global teardown sweeps for orphaned `AUTO_UI_` records
- Cleanup uses Fluxx UI (Edit → Delete) to mirror real user actions

---

## 3. Architecture

### 3.1 Project Structure (additions to existing framework)

```
config/
  environments.js         ← ADD Fabric URLs, workspace/report IDs
  constants.js            ← ADD Fluxx Investment/Co-Funding selectors, Fabric selectors

globals/
  auth.setup.js           ← existing CRM auth (keep)
  fluxx-auth.setup.js     ← existing Fluxx auth (keep)
  fabric-auth.setup.js    ← NEW: Fabric SSO auth + session save

pages/
  BasePage.js             ← existing (reuse as-is)
  CRMLoginPage.js         ← existing (keep)
  CRMOrganisationPage.js  ← EXTEND: add update/delete/search methods
  CRMContactPage.js       ← EXTEND: add update/delete/search methods
  FluxxLoginPage.js       ← existing (keep)
  FluxxOrganisationPage.js← EXTEND: add edit, delete, workflow verification
  FluxxContactPage.js     ← EXTEND: add search, detail verification
  FluxxPeoplePage.js      ← NEW: People module via Quick Actions Hub
  FluxxInvestmentPage.js  ← NEW: Investment CRUD
  FluxxCoFundingPage.js   ← NEW: Co-Funding CRUD
  FluxxQuickActionsPage.js← NEW: Quick Actions Hub, Highlight Feed, model switching
  FluxxReadOnlyPage.js    ← NEW: Generic read-only module (Requests, Grants, Reports, Payments, Amendments)
  FabricLoginPage.js      ← NEW: Fabric SSO navigation
  FabricDashboardPage.js  ← NEW: Overview page (KPIs, charts, filters)
  FabricDetailedViewPage.js ← NEW: Detailed View (tables, programme data, filters)

utils/
  Logger.js               ← existing (keep)
  TestDataManager.js      ← EXTEND: add Investment/Co-Funding data generators
  TestDataCleaner.js      ← NEW: cleanup utility

tests/
  crm/
    organisation.spec.js  ← EXTEND: add update, delete, search, negative tests
    contact.spec.js       ← EXTEND: add update, delete, search, linking tests
  fluxx/
    organisation.spec.js  ← EXTEND: add search, update verification, workflow tests
    contact.spec.js       ← EXTEND (rename to people.spec.js)
    people.spec.js        ← NEW: People CRUD via Quick Actions Hub
    investment.spec.js    ← NEW: Investment CRUD
    co-funding.spec.js    ← NEW: Co-Funding CRUD
    read-only.spec.js     ← NEW: Requests, Grants, Reports, Payments, Amendments
  fabric/                 ← NEW directory
    dashboard.spec.js     ← Overview page tests
    detailed-view.spec.js ← Detailed View tests
    filters.spec.js       ← Filter interaction tests
  integration/
    crm-fluxx-sync.spec.js     ← EXTEND: add contact sync, update sync, delete sync
    fluxx-fabric-sync.spec.js  ← NEW: Fluxx → Fabric data validation
    e2e-pipeline.spec.js       ← NEW: CRM → Fluxx → Fabric full pipeline

test-data/
  organisations.json      ← EXTEND: add update scenarios
  contacts.json           ← EXTEND: add multi-org linking scenarios
  investments.json        ← NEW: Investment test data
  co-funding.json         ← NEW: Co-Funding test data
```

### 3.2 Playwright Config Additions

Add 2 new projects to `playwright.config.js`:

```javascript
// NEW: Fabric SSO auth setup
{
  name: 'fabric-setup',
  use: { browserName: 'firefox' },
  testMatch: '**/globals/fabric-auth.setup.js',
},

// NEW: Fabric dashboard tests
{
  name: 'fabric-tests',
  use: {
    browserName: 'chromium',
    storageState: 'playwright/.auth/fabric-state.json',
  },
  testDir: './tests/fabric',
  dependencies: ['fabric-setup'],
},
```

Update existing integration project to depend on all 3 setups:

```javascript
{
  name: 'integration',
  dependencies: ['crm-setup', 'fluxx-setup', 'fabric-setup'],
}
```

### 3.3 Test Data Strategy

| Prefix | Module | Example |
|--------|--------|---------|
| `AUTO_UI_ORG_` | Organisations | `AUTO_UI_ORG_US_1711187200` |
| `AUTO_UI_CONTACT_` | Contacts/People | First: `AUTO_UI_CONTACT_John`, Last: `Test_1711187200` |
| `AUTO_UI_INV_` | Investments | `AUTO_UI_INV_Climate_1711187200` |
| `AUTO_UI_CF_` | Co-Funding | `AUTO_UI_CF_Grant_1711187200` |

All timestamps ensure uniqueness. `TestDataCleaner` tracks IDs in an array, deletes in reverse-creation order during `afterAll`.

### 3.4 Authentication Flow

All three portals use Microsoft SSO (Azure AD). Session strategy:

1. **Setup projects** run first (Firefox — better cookie handling)
2. Save session state to `playwright/.auth/{crm,fluxx,fabric}-state.json`
3. **Test projects** reuse saved sessions (Chrome)
4. Sessions stored in `.gitignore`, never committed

Fabric auth flow:
1. Navigate to Fabric workspace URL
2. Redirected to Microsoft SSO sign-in page
3. Enter email → redirected to org login
4. Enter password → "Stay signed in?" → Yes
5. Save storage state

---

## 4. Test Cases

### 4.A CRM Organisation Tests (23 total: 12 existing + 11 new)

#### Existing (keep as-is)

| ID | Description |
|----|------------|
| ORG_001 | Create basic US org, Required in Fluxx = Yes |
| ORG_002 | Create India org with Grantee + FCRA status |
| ORG_003 | Create India org with Grantee + Non-FCRA status |
| ORG_004 | Create India org with Service Provider recipient type |
| ORG_005 | Create org with Required in Fluxx = No |
| ORG_006 | Verify FCRA fields appear only for India + Grantee |
| ORG_007 | Create org with Fluxx type = "Organisation" |
| ORG_DD_01 | Data-driven: India org with Exempt recipient type |
| ORG_DD_02 | Data-driven: India org with Consultancy recipient type |
| ORG_NEG_001 | Required in Fluxx = Yes without mandatory fields — validation |
| ORG_NEG_002 | Fluxx fields hidden when Required in Fluxx = No |
| (implicit) | Basic org creation flow documented across multiple tests |

#### New — Update

| ID | Description | Precondition | Steps | Expected |
|----|------------|-------------|-------|----------|
| ORG_UPD_001 | Update organisation name | Existing AUTO_UI_ org | Edit org → change name → save | Header shows new name with "- Saved" |
| ORG_UPD_002 | Change country US → India, verify FCRA fields appear | US org exists | Edit → change country to India, set Grantee → verify FCRA fields visible | FCRA Status, Reg Number, Expiry Date fields appear |
| ORG_UPD_003 | Toggle Required in Fluxx Yes → No | Fluxx-enabled org | Edit → set Required in Fluxx = No → save | Fluxx-specific fields hidden, org saves |
| ORG_UPD_004 | Update FCRA registration number and expiry date | India FCRA org | Edit → change FCRA reg number and date → save | New values persisted, header shows "- Saved" |

#### New — Delete

| ID | Description | Precondition | Steps | Expected |
|----|------------|-------------|-------|----------|
| ORG_DEL_001 | Delete organisation | AUTO_UI_ org with no linked contacts | Delete org → confirm | Org removed from list view |
| ORG_DEL_002 | Delete org with linked contacts — verify cascade behavior | Org with 1+ contacts | Delete org → observe behavior | Either blocked or contacts unlinked (document behavior) |

#### New — Search

| ID | Description | Steps | Expected |
|----|------------|-------|----------|
| ORG_SEARCH_001 | Search org by name | Navigate to org list → filter by AUTO_UI_ keyword | Matching orgs displayed |
| ORG_SEARCH_002 | Filter orgs by Required in Fluxx value | Apply filter on Required in Fluxx column | Only matching orgs shown |

#### New — Negative/Validation

| ID | Description | Steps | Expected |
|----|------------|-------|----------|
| ORG_NEG_003 | Duplicate org name | Create org with same name as existing | Error message or save prevented |
| ORG_NEG_004 | Special characters in org name | Create org with name containing `<>&"'` | Either sanitized or accepted; no XSS |
| ORG_NEG_005 | FCRA expiry date in past | Set FCRA expiry to yesterday | Validation error or warning |

---

### 4.B CRM Contact Tests (14 total: 4 existing + 10 new)

#### Existing (keep as-is)

| ID | Description |
|----|------------|
| CONTACT_001 | Create contact with mandatory Primary Organisation |
| CONTACT_002 | Create contact from organisation sub-grid |
| CONTACT_003 | Grant Portal Access field behavior |
| CONTACT_004 | Save without Primary Org — validation blocked |

#### New — Update

| ID | Description | Expected |
|----|------------|----------|
| CONTACT_UPD_001 | Update contact first name, last name, email | Header shows updated full name |
| CONTACT_UPD_002 | Change Primary Organisation to different org | New org linked, old org unlinked |
| CONTACT_UPD_003 | Toggle Grant Portal Access Yes → No | Manager Requested Login field behavior changes |

#### New — Delete

| ID | Description | Expected |
|----|------------|----------|
| CONTACT_DEL_001 | Delete contact and verify removal from list | Contact gone from list view |

#### New — Search

| ID | Description | Expected |
|----|------------|----------|
| CONTACT_SEARCH_001 | Search contact by name | Matching contacts displayed |
| CONTACT_SEARCH_002 | Search contact by email | Matching contacts displayed |

#### New — Negative/Validation

| ID | Description | Expected |
|----|------------|----------|
| CONTACT_NEG_001 | Invalid email format (no @, no domain) | Validation error |
| CONTACT_NEG_002 | Empty first name or last name | Save prevented or error shown |

#### New — Linking

| ID | Description | Expected |
|----|------------|----------|
| CONTACT_LINK_001 | Add 3 organisations to contact (maximum) | All 3 linked successfully |
| CONTACT_LINK_002 | Attempt 4th org link | Blocked — max 3 enforced |

---

### 4.C Fluxx Organisation Tests (13 total: 5 existing + 8 new)

#### Existing (keep as-is)

| ID | Description |
|----|------------|
| FLUXX_ORG_001 | Verify AUTO_UI_ orgs appear in Fluxx search |
| FLUXX_ORG_002 | Verify India FCRA field mapping |
| FLUXX_ORG_003 | Verify US org type = Individual |
| FLUXX_ORG_004 | Verify complete field mapping via helper |
| FLUXX_ORG_005 | Negative: Fluxx=No org should NOT appear |

#### New

| ID | Description | Expected |
|----|------------|----------|
| FLUXX_ORG_006 | Search org by partial name in Quick Actions | Matching orgs found in Highlight Feed |
| FLUXX_ORG_007 | Search non-existent org — empty result | No records found, empty state displayed |
| FLUXX_ORG_008 | Verify updated org fields after CRM edit | Updated name/fields reflected in Fluxx |
| FLUXX_ORG_009 | Verify org removal after CRM delete | Org no longer found in Fluxx search |
| FLUXX_ORG_010 | Verify all recipient type displays (Exempt, Service Provider, Consultancy) | Correct type shown for each |
| FLUXX_ORG_011 | Verify Fluxx type = "Organisation" (not Individual) display | Organisation type shown correctly |
| FLUXX_ORG_012 | Verify org detail sections (Contact Details, FCRA Info, Due Diligence, Organisation Info, Financial, Documents) | All sections present and expandable |
| FLUXX_ORG_013 | Verify org workflow status display (Pending Verification → Review → Diligence Complete) | Workflow stages visible with current status highlighted |

---

### 4.D Fluxx People Tests (11 total: 5 existing + 6 new)

#### Existing (keep as-is)

| ID | Description |
|----|------------|
| FLUXX_CONTACT_001 | Contact in org People tab after sync |
| FLUXX_CONTACT_002 | Contact field mapping (name, email) |
| FLUXX_CONTACT_003 | Primary Org link on contact detail |
| FLUXX_CONTACT_004 | Sub-grid contact sync verification |
| FLUXX_CONTACT_005 | Negative: non-Fluxx org contact absent |

#### New

| ID | Description | Expected |
|----|------------|----------|
| FLUXX_PEOPLE_001 | Search People via Quick Actions Highlight Feed | People table shows matching records with columns: ID, First Name, Last Name, Primary Org, Title, Email, Phone |
| FLUXX_PEOPLE_002 | Verify People table columns render correctly | All 7 columns visible with correct headers |
| FLUXX_PEOPLE_003 | Open People record via "Open record" link and verify detail fields | Detail page loads with all contact information |
| FLUXX_PEOPLE_004 | Verify updated contact fields after CRM edit | Updated name/email reflected in Fluxx People |
| FLUXX_PEOPLE_005 | Verify contact removal after CRM delete | Person no longer found in Fluxx search |
| FLUXX_PEOPLE_006 | Pagination — navigate to page 2 of People | Next page loads, different records shown |

---

### 4.E Fluxx Investment Tests (10 total, all new)

| ID | Description | Type | Expected |
|----|------------|------|----------|
| FLUXX_INV_001 | Create new Investment linked to existing org | Create | Investment created, appears under org's Investment tab |
| FLUXX_INV_002 | Verify Investment detail fields (programme team, investment type, rating) | Read | All fields display correctly |
| FLUXX_INV_003 | Update Investment details (name, type, rating) | Update | Updated values saved and displayed |
| FLUXX_INV_004 | Delete Investment and verify removal | Delete | Investment removed from org tab and search |
| FLUXX_INV_005 | Search Investment via Quick Actions | Search | Investment found in search results |
| FLUXX_INV_006 | Verify Investment appears under org's Investment related tab | Read | Investment listed in org detail → Investment tab |
| FLUXX_INV_007 | Create Investments for each programme team (Africa, Climate, EME, India, Nutrition, SRHR) | Create | Each Investment tagged with correct programme team |
| FLUXX_INV_008 | Verify Investment rating values (Green, Amber, Red, White, Blue) | Read | All 5 rating categories settable and displayed |
| FLUXX_INV_NEG_001 | Create Investment without required fields | Negative | Validation error, save prevented |
| FLUXX_INV_NEG_002 | Create Investment with invalid/non-existent org link | Negative | Error or blocked |

---

### 4.F Fluxx Co-Funding Tests (7 total, all new)

| ID | Description | Type | Expected |
|----|------------|------|----------|
| FLUXX_CF_001 | Create new Co-Funding record linked to org | Create | Record created, visible under org's Co-Funding tab |
| FLUXX_CF_002 | Verify Co-Funding detail fields | Read | All fields display correctly |
| FLUXX_CF_003 | Update Co-Funding details | Update | Updated values saved |
| FLUXX_CF_004 | Delete Co-Funding and verify removal | Delete | Record removed |
| FLUXX_CF_005 | Search Co-Funding records via Quick Actions | Search | Records found in search |
| FLUXX_CF_006 | Verify Co-Funding under org's Co-Funding related tab | Read | Record listed under org detail |
| FLUXX_CF_NEG_001 | Create Co-Funding without required fields | Negative | Validation error |

---

### 4.G Fluxx Read-Only Module Tests (7 total, all new)

| ID | Module | Description | Expected |
|----|--------|------------|----------|
| FLUXX_RO_REQ_001 | Requests | Verify Requests list view via Highlight Feed — columns, pagination | Table renders with correct columns |
| FLUXX_RO_REQ_002 | Requests | Open a Request record and verify detail fields | Detail page loads with request information |
| FLUXX_RO_GRT_001 | Grants | Verify Grants list view via Highlight Feed | Table renders with grant records |
| FLUXX_RO_GRT_002 | Grants | Open a Grant record and verify detail fields | Detail page loads with grant information |
| FLUXX_RO_RPT_001 | Reports | Verify Reports list view via Highlight Feed | Table renders with report records |
| FLUXX_RO_PAY_001 | Payments | Verify Payments list view via Highlight Feed | Table renders with payment records |
| FLUXX_RO_AMD_001 | Amendments | Verify Amendments list view via Highlight Feed | Table renders with amendment records |

---

### 4.H Fabric Dashboard Tests (24 total, all new)

#### Authentication

| ID | Description | Expected |
|----|------------|----------|
| FAB_AUTH_001 | SSO login to Fabric via Microsoft | Fabric workspace loads after SSO flow |
| FAB_AUTH_002 | Verify workspace "DEV-Portfolio Ratings" loads | Workspace name visible, report listed |

#### Overview Page

| ID | Description | Expected |
|----|------------|----------|
| FAB_OVW_001 | Verify Overview page loads with "Programme Rating Dashboard" title | Title text visible in report header |
| FAB_OVW_002 | Verify KPI card: Total Investments / DA count | Card visible with numeric value |
| FAB_OVW_003 | Verify KPI card: Total Rated Investments / DA count | Card visible with numeric value |
| FAB_OVW_004 | Verify Rating Status donut chart renders | Chart visible with status categories |
| FAB_OVW_005 | Verify CIFF Investments Health pie — all 5 ratings (White, Red, Amber, Green, Blue) present | All 5 legend items and data slices visible |
| FAB_OVW_006 | Verify Portfolio Health Programme Team stacked bar — all 6 teams | Africa, Climate, EME, India, Nutrition, SRHR bars present |

#### Filter Interactions

| ID | Description | Expected |
|----|------------|----------|
| FAB_FLT_001 | Filter by Investment Type → verify data updates | Charts/KPIs reflect filtered data |
| FAB_FLT_002 | Filter by Year → verify data updates | Data reflects selected year |
| FAB_FLT_003 | Filter by Programme Team → verify data filters | Only selected team's data shown |
| FAB_FLT_004 | Filter by Core Strategy → verify data filters | Data filtered to strategy |
| FAB_FLT_005 | Filter by Month → verify data updates | Monthly data shown |
| FAB_FLT_006 | Apply multiple filters, then Reset → verify all data restored | All filters cleared, full data shown |
| FAB_FLT_007 | Switch between Routine Reporting and Formal Rating bookmarks | View changes per bookmark |

#### Detailed View

| ID | Description | Expected |
|----|------------|----------|
| FAB_DTV_001 | Navigate to Detailed View tab | Detailed View page loads |
| FAB_DTV_002 | Verify programme team tables (Africa, CEO, Climate) visible | All team tables rendered |
| FAB_DTV_003 | Verify table columns: Investment, Last Rated Date, Last Rating | Columns present with data |
| FAB_DTV_004 | Verify rating color bars match legend (Blue/Green/Amber/White/Red) | Color coding consistent |
| FAB_DTV_005 | Filter by Programme Manager → verify table updates | Tables filter correctly |
| FAB_DTV_006 | Filter by Executive Director → verify table updates | Tables filter correctly |
| FAB_DTV_007 | Filter by Investment name → verify table updates | Specific investment highlighted |

#### Navigation & Negative

| ID | Description | Expected |
|----|------------|----------|
| FAB_NAV_001 | Navigate Overview → Detailed View → Overview | Both pages load correctly |
| FAB_NAV_002 | Verify page navigation buttons (tabs) work | Tabs switch pages |
| FAB_NEG_001 | Apply filter with no matching data → verify empty/zero state | KPIs show 0, charts empty or message shown |

---

### 4.I Integration & E2E Tests (18 total: 5 existing + 13 new)

#### Existing (keep as-is)

| ID | Description |
|----|------------|
| SYNC_001 | US org: CRM → Fluxx sync |
| SYNC_002 | India FCRA org: CRM → Fluxx sync |
| SYNC_003 | India Non-FCRA org: CRM → Fluxx sync |
| SYNC_004 | Full field mapping: CRM → Fluxx |
| SYNC_005 | Batch org sync (2 orgs): CRM → Fluxx |

#### New — Contact Sync

| ID | Description | Expected |
|----|------------|----------|
| SYNC_006 | Create contact with org in CRM → verify in Fluxx People tab | Contact appears under org's People tab with correct fields |
| SYNC_007 | Create contact with 3 orgs in CRM → verify all org links in Fluxx | Contact visible under all 3 org People tabs |

#### New — Update Sync

| ID | Description | Expected |
|----|------------|----------|
| SYNC_008 | Update org name in CRM → verify updated in Fluxx | New name appears in Fluxx search/detail |
| SYNC_009 | Update contact email in CRM → verify updated in Fluxx | New email shown in Fluxx People detail |

#### New — Delete Sync

| ID | Description | Expected |
|----|------------|----------|
| SYNC_010 | Delete org in CRM → verify removed from Fluxx | Org not found in Fluxx search |
| SYNC_011 | Delete contact in CRM → verify removed from Fluxx | Contact not found in Fluxx People tab |

#### New — Negative Sync

| ID | Description | Expected |
|----|------------|----------|
| SYNC_NEG_001 | Sync contact with non-Fluxx org → verify NOT synced | Contact absent from Fluxx |

#### New — Fluxx → Fabric Sync

| ID | Description | Expected |
|----|------------|----------|
| FAB_SYNC_001 | Verify Fluxx Investment count matches Fabric "Total Investments / DA" KPI | Numbers match (or within expected delta) |
| FAB_SYNC_002 | Verify Fluxx Investment ratings distribution matches Fabric Health pie chart | Rating percentages consistent |
| FAB_SYNC_003 | Verify Fluxx Investments by programme team match Fabric bar chart counts | Per-team counts consistent |
| FAB_SYNC_004 | Verify specific Fluxx Investment appears in Fabric Detailed View table | Investment name, Last Rated Date, Rating visible |

#### New — Full Pipeline E2E

| ID | Description | Expected |
|----|------------|----------|
| E2E_001 | Create org in CRM → verify in Fluxx → verify in Fabric dashboard (if investment linked) | Data flows through all 3 systems |
| E2E_002 | Create org + contact + investment → verify across all 3 systems | Complete data pipeline validated |

---

### 4.J Test Data Cleanup (5 total, all new)

| ID | Description | Mechanism |
|----|------------|-----------|
| CLEANUP_001 | Delete all AUTO_UI_ organisations after test run | Fluxx Edit → Delete via UI |
| CLEANUP_002 | Delete all AUTO_UI_ contacts/people after test run | Fluxx Edit → Delete via UI |
| CLEANUP_003 | Delete all AUTO_UI_ investments after test run | Fluxx Edit → Delete via UI |
| CLEANUP_004 | Delete all AUTO_UI_ co-funding records after test run | Fluxx Edit → Delete via UI |
| CLEANUP_005 | Verify no AUTO_UI_ records remain in any system | Search each system, assert 0 results |

---

## 5. Test Execution Order

```
1. crm-setup          (Firefox) → Save CRM session
2. fluxx-setup         (Firefox) → Save Fluxx session
3. fabric-setup        (Firefox) → Save Fabric session
4. crm-tests           (Chrome)  → CRM Org + Contact CRUD (depends on crm-setup)
5. fluxx-tests          (Chrome)  → Fluxx Org/People/Inv/CF CRUD + read-only (depends on fluxx-setup)
6. fabric-tests         (Chrome)  → Fabric dashboard validation (depends on fabric-setup)
7. integration          (Chrome)  → CRM↔Fluxx sync + Fluxx→Fabric sync + E2E pipeline (depends on all 3 setups)
```

Workers: 1 (sequential — CRM/Fluxx/Fabric don't support parallel sessions).
Retries: 1 (failed tests retried once).
Timeout: 180s per test (3 minutes).

---

## 6. Page Object Design

### 6.1 New Page Objects

**FluxxQuickActionsPage.js**
- Navigate to Quick Actions Hub
- Switch Highlight Feed model (Organisations, People, Requests, Grants, Reports, Payments, Amendments)
- Search within Highlight Feed
- Open record from table
- Pagination (next/prev/first/last)

**FluxxInvestmentPage.js**
- Create investment (linked to org)
- Fill investment fields (name, programme team, type, rating)
- Save investment
- Edit investment
- Delete investment
- Search investment
- Verify investment under org's Investment tab

**FluxxCoFundingPage.js**
- Create co-funding record (linked to org)
- Fill co-funding fields
- Save, edit, delete
- Search, verify under org tab

**FluxxReadOnlyPage.js**
- Generic page for read-only modules
- Switch to module via Highlight Feed model selector
- Verify table columns for each module
- Open record detail
- Search within module

**FabricLoginPage.js**
- Navigate to Fabric workspace URL
- Handle SSO flow (email → password → stay signed in)
- Save session state
- Verify workspace loaded

**FabricDashboardPage.js** (Overview)
- Verify page title ("Programme Rating Dashboard")
- Read KPI values (Total Investments, Total Rated)
- Verify chart presence (Rating Status donut, Health pie, Programme Team bar)
- Read chart legend items and values
- Interact with filters (Investment Type, Year, Programme Team, Core Strategy, Month)
- Click Reset to clear filters
- Switch bookmarks (Routine Reporting, Formal Rating)

**FabricDetailedViewPage.js**
- Navigate to Detailed View tab
- Verify programme team tables (Africa, CEO, Climate, etc.)
- Read table rows (Investment name, Last Rated Date, Last Rating)
- Verify color bars against legend
- Interact with filters (Programme Manager, Programme Director, Executive Director, Investment)

### 6.2 Extended Page Objects

**CRMOrganisationPage.js** — add:
- `editOrganisation(name)` — open org, click Edit
- `updateOrganisationName(newName)` — change name, save
- `updateFCRAFields(regNumber, expiryDate)` — update FCRA fields
- `deleteOrganisation(name)` — delete from list or detail
- `searchOrganisation(keyword)` — already partially exists, enhance with filter

**CRMContactPage.js** — add:
- `editContact(name)` — open contact, click Edit
- `updateContactFields(data)` — update name/email/phone
- `changePrimaryOrganisation(newOrg)` — change org link
- `deleteContact(name)` — delete contact
- `searchContact(keyword)` — search by name/email

**FluxxOrganisationPage.js** — add:
- `verifyWorkflowStatus(expectedStatus)` — check workflow stage
- `verifyDetailSections(sections)` — verify expandable sections present
- `verifyAllRecipientTypes(type)` — check recipient type display

---

## 7. Test Data Files

### 7.1 investments.json (new)

```json
{
  "basic_investment": {
    "name_suffix": "Basic_Inv",
    "programme_team": "Climate",
    "investment_type": "Grant",
    "rating": "Green - on track"
  },
  "africa_investment": {
    "name_suffix": "Africa_Inv",
    "programme_team": "Africa",
    "investment_type": "Direct Agreement",
    "rating": "Amber - minor issues"
  },
  "rated_investment": {
    "name_suffix": "Rated_Inv",
    "programme_team": "India",
    "investment_type": "Grant",
    "rating": "Red - major issues"
  }
}
```

### 7.2 co-funding.json (new)

```json
{
  "basic_cofunding": {
    "name_suffix": "Basic_CF",
    "funder": "Test Funder",
    "amount": "100000"
  }
}
```

---

## 8. Environment Configuration

### 8.1 .env additions

```
# Fabric Settings
FABRIC_WORKSPACE_URL=https://app.fabric.microsoft.com/groups/df124183-1f44-43bd-bbaa-fbe2f4cb662f/list?experience=fabric-developer
FABRIC_REPORT_URL=https://app.fabric.microsoft.com/groups/df124183-1f44-43bd-bbaa-fbe2f4cb662f/reports/65b6578f-7cf4-44ef-9cec-bd438139d9ff
```

### 8.2 environments.js additions

```javascript
fabric: {
  workspaceUrl: process.env.FABRIC_WORKSPACE_URL,
  reportUrl: process.env.FABRIC_REPORT_URL,
  workspaceName: 'DEV-Portfolio Ratings',
  reportName: 'Portfolio Rating Dashboard - DEV',
}
```

---

## 9. Summary

| Category | Existing | New | Total |
|----------|----------|-----|-------|
| CRM Organisation | 12 | 11 | 23 |
| CRM Contact | 4 | 10 | 14 |
| Fluxx Organisation | 5 | 8 | 13 |
| Fluxx People | 5 | 6 | 11 |
| Fluxx Investment | 0 | 10 | 10 |
| Fluxx Co-Funding | 0 | 7 | 7 |
| Fluxx Read-Only | 0 | 7 | 7 |
| Fabric Dashboard | 0 | 24 | 24 |
| Integration/E2E | 5 | 13 | 18 |
| Cleanup | 0 | 5 | 5 |
| **TOTAL** | **31** | **101** | **132** |

---

## 10. Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Fabric Power BI iframes hard to automate | Use accessibility snapshot selectors (ARIA roles, labels), not CSS |
| Fluxx WebSocket errors during navigation | Add retry/wait logic in page objects, ignore non-blocking WS errors |
| SSO session expiry mid-test | 180s timeout per test; re-auth in integration tests if needed |
| CRM → Fluxx sync delay variable (up to 2 min) | Existing retry polling pattern (24 retries × 5s = 2 min max) |
| Fluxx → Fabric data refresh not real-time | Fabric data updated 26/02/26; tests validate last-refreshed data, not live sync |
| Test data cleanup failure leaves orphans | Global teardown safety net; AUTO_UI_ prefix for manual identification |
| Investment/Co-Funding form fields unknown until explored at runtime | Page objects use dynamic selectors; first test run documents field structure |
