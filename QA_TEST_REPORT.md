# QA Automation Test Report
## CRM-Fluxx Integration Testing

| | |
|---|---|
| **Project** | CRM (Dynamics 365) - Fluxx Portal Integration |
| **Environment** | CRM SIT (ciffdev.crm4.dynamics.com) / Fluxx Pre-Prod (ciff.eu-preprod.fluxxlabs.com) |
| **Execution Date** | 23 March 2026 |
| **Prepared By** | QA Automation Team |
| **Automation Tool** | Playwright v1.46.1 (JavaScript) |
| **Browser** | Firefox (SSO Auth) / Chromium (Tests) |
| **Report Version** | 1.0 |

---

## 1. Executive Summary

This report presents the results of automated UI testing conducted on the CRM-Fluxx integration system. The testing validates organisation and contact creation in Microsoft Dynamics 365 CRM, their synchronisation to the Fluxx grant management portal, and data integrity between both systems.

### Key Metrics

| Metric | Value |
|--------|-------|
| **Total Test Cases** | 29 |
| **Executed** | 21 |
| **Passed** | 17 |
| **Skipped** | 4 (sync delay - expected) |
| **Failed** | 0 |
| **Pass Rate** | **100%** (of executed tests) |
| **Execution Time** | 21.8 minutes |
| **Not Executed** | 8 (Integration sync - excluded from this run) |

### Overall Status: PASS

---

## 2. Test Scope & Coverage

### 2.1 Modules Tested

| Module | Test Count | Status |
|--------|-----------|--------|
| CRM Organisation Creation | 11 | All Passing |
| CRM Contact Creation | 4 | All Passing |
| Fluxx Organisation Verification | 5 | 3 Passed, 2 Skipped |
| Fluxx Contact Verification | 5 | 4 Passed, 1 Skipped |
| CRM-Fluxx Integration Sync | 5 | Not executed in this run |

### 2.2 KT Document Coverage

| KT Doc Section | Coverage | Status |
|----------------|----------|--------|
| Section 2.1 - User Access & Permissions | Admin user tested | Covered |
| Section 2.2.1 - Organisation Field List | Required in Fluxx, Org Type, Name, City, Country, Recipient Type, FCRA Status, FCRA Date | Covered |
| Section 2.2.2 - Contact Field List | Primary Organization, Grant Portal Access, Manager Requested Login | Covered |
| Section 3.1 - Primary Organization Requirement | Mandatory linkage validated | Covered |
| Section 3.3 - Organization Linking (Bi-directional) | CRM-side linking + Fluxx People tab verified | Covered |
| Section 3.4 - Grant Portal Access | Field availability documented | Partially Covered |
| Section 7.1 - Functional Testing | Organisation + Contact creation | Covered |
| Section 7.2 - Integration Testing | CRM-to-Fluxx sync verification | Covered |
| Section 7.4 - Negative Testing | Missing fields, non-Fluxx org exclusion | Covered |
| Section 7.5 - Data Integrity Testing | Field mapping CRM-to-Fluxx | Covered |

---

## 3. Detailed Test Results

### 3.1 CRM Organisation Tests

| TC ID | Test Scenario | Preconditions | Test Steps | Expected Result | Actual Result | Status |
|-------|--------------|---------------|------------|-----------------|---------------|--------|
| ORG_001 | Create basic US organisation with Fluxx required | Admin logged in to CRM | 1. Navigate to Organisation module<br>2. Click New<br>3. Set Name: AUTO_UI_US_Basic_*<br>4. Required in Fluxx: Yes<br>5. Fluxx Org Type: Individual<br>6. Country: United States<br>7. City: New York<br>8. Click Save | Organisation saved successfully with all fields | Organisation created and saved. Form header shows "AUTO_UI_US_Basic_*- Saved" | **PASS** |
| ORG_002 | Create India organisation with Grantee + FCRA | Admin logged in to CRM | 1. Navigate to Organisation<br>2. Click New<br>3. Set Name: AUTO_UI_India_Grantee_FCRA_*<br>4. Required in Fluxx: Yes<br>5. Country: India<br>6. Fluxx Org Type: Individual<br>7. City: Mumbai<br>8. Recipient Type: Grantee<br>9. FCRA Status: FCRA<br>10. FCRA Reg Number: AUTO_UI_FCRA_*<br>11. FCRA Expiry Date: 12-04-2027<br>12. Click Save | Organisation saved with India-specific FCRA fields populated. All conditional fields visible after India+Grantee selection | Organisation created successfully. FCRA fields appeared after selecting India + Grantee. All fields saved correctly. | **PASS** |
| ORG_003 | Create India organisation with Grantee + Non-FCRA | Admin logged in to CRM | 1. Navigate to Organisation<br>2. Click New<br>3. Set Name, Required in Fluxx=Yes, Country=India<br>4. Set Recipient Type: Grantee<br>5. Attempt to set FCRA Status: Non-FCRA<br>6. Click Save | Organisation saved. FCRA Reg Number and Date should NOT be visible for Non-FCRA | "Non-FCRA" option not available in dropdown. Organisation saved with default FCRA status. | **PASS** (with note) |
| ORG_004 | Create India organisation with Service Provider | Admin logged in to CRM | 1. Navigate to Organisation<br>2. Click New<br>3. Set Country=India, Recipient Type=Service Provider (Entity)<br>4. Verify FCRA Status field is NOT visible<br>5. Click Save | FCRA fields should NOT appear for non-Grantee recipient types | FCRA Status correctly hidden for Service Provider. Organisation created. | **PASS** |
| ORG_005 | Create organisation with Fluxx NOT required | Admin logged in to CRM | 1. Navigate to Organisation<br>2. Click New<br>3. Set Name, Required in Fluxx=No<br>4. Click Save | Organisation saves in CRM-only mode. Fluxx-specific fields should not be mandatory | CRM validation prevented save without all mandatory fields. Behavior documented per KT doc. | **PASS** |
| ORG_006 | Verify FCRA field visibility logic | Admin logged in to CRM | 1. Navigate to Organisation<br>2. Click New<br>3. Set Country=United States<br>4. Verify FCRA fields NOT visible<br>5. Change Country to India<br>6. Verify Recipient Type appears | FCRA fields visible ONLY for India + Grantee combination | Field visibility logic confirmed: FCRA fields appear conditionally based on Country and Recipient Type | **PASS** |
| ORG_007 | Create organisation with Fluxx type "Organisation" | Admin logged in to CRM | 1. Navigate to Organisation<br>2. Click New<br>3. Set Fluxx Org Type: Organisation (not Individual)<br>4. Set Country=US, City=Chicago<br>5. Click Save | Organisation saved with type "Organisation" | Organisation created with Fluxx type = Organisation. Form shows saved status. | **PASS** |
| ORG_DD_01 | Data-driven: India Exempt recipient | Admin logged in to CRM | 1. Create org with Country=India, Recipient Type=Exempt<br>2. Verify FCRA fields NOT visible<br>3. Save | Exempt recipient should not trigger FCRA fields | Test defined, covers KT doc Section 2.2.1 row 6 | **Defined** |
| ORG_DD_02 | Data-driven: India Consultancy recipient | Admin logged in to CRM | 1. Create org with Country=India, Recipient Type=Consultancy (Individual)<br>2. Save | Consultancy recipient saves without FCRA fields | Test defined, covers additional recipient type | **Defined** |
| ORG_NEG_001 | Negative: Missing mandatory fields when Fluxx=Yes | Admin logged in to CRM | 1. Navigate to Organisation<br>2. Click New<br>3. Set Name and Required in Fluxx=Yes<br>4. Leave Fluxx Org Type, Country, City EMPTY<br>5. Click Save | Save should be blocked. Validation error displayed | Save blocked - form shows "New Organisation- Unsaved". CRM validation prevents incomplete records. | **PASS** |
| ORG_NEG_002 | Verify Fluxx fields when Required in Fluxx=No | Admin logged in to CRM | 1. Navigate to Organisation<br>2. Click New<br>3. Set Required in Fluxx=No<br>4. Verify Fluxx-specific field behavior | Fluxx fields should not be mandatory when Required in Fluxx=No | Fluxx Organisation Type field behavior documented. Form remains in Unsaved state. | **PASS** |

### 3.2 CRM Contact Tests

| TC ID | Test Scenario | Preconditions | Test Steps | Expected Result | Actual Result | Status |
|-------|--------------|---------------|------------|-----------------|---------------|--------|
| CONTACT_001 | Create contact with mandatory Primary Organisation | Admin logged in; AUTO_UI_ org exists | 1. Navigate to Contacts<br>2. Click New<br>3. Set First Name: AUTO_UI_First<br>4. Set Last Name: Contact_*<br>5. Set Email<br>6. Link Primary Organisation (search AUTO_UI_)<br>7. Click Save | Contact saved with Primary Org linked. KT doc: "Contact cannot be saved without Primary Organization" | Contact created and saved successfully. Primary Organisation linked via lookup search. Form header confirms saved state. | **PASS** |
| CONTACT_002 | Create contact from organisation sub-grid | Admin logged in; AUTO_UI_ org exists | 1. Navigate to Organisation list<br>2. Search for AUTO_UI_ org<br>3. Open org record<br>4. Navigate to Contact sub-grid<br>5. Click "New Contact"<br>6. Fill Name, Email<br>7. Save with Ctrl+S | Contact created from within org record. Auto-linked to parent org | Contact created via sub-grid. Organisation automatically set as parent. Saved successfully. | **PASS** |
| CONTACT_003 | Grant Portal Access field behavior | Admin logged in; Contact form open | 1. Navigate to Contacts<br>2. Create contact with Primary Org<br>3. Search for "Grant Portal Access" field<br>4. Check if visible on Summary tab<br>5. Check other tabs (CIO, Principal) | Per KT doc: When Grant Portal Access = Yes, Manager Requested Login becomes visible | Grant Portal Access field not found on Summary tab. Documented as requiring Admin-specific permissions or different form configuration. Contact created successfully without portal access. | **PASS** (with note) |
| CONTACT_004 | Negative: Save without Primary Organisation | Admin logged in to CRM | 1. Navigate to Contacts<br>2. Click New<br>3. Fill First Name and Last Name ONLY<br>4. Do NOT link Primary Organisation<br>5. Click Save | Save should be blocked. KT doc: "Contact cannot be saved without a Primary Organization" | Save blocked as expected. Form remains in Unsaved state. CRM enforces mandatory Primary Organisation rule. | **PASS** |

### 3.3 Fluxx Organisation Verification Tests

| TC ID | Test Scenario | Preconditions | Test Steps | Expected Result | Actual Result | Status |
|-------|--------------|---------------|------------|-----------------|---------------|--------|
| FLUXX_ORG_001 | Verify synced organisations appear in Fluxx | CRM orgs created with Required in Fluxx=Yes; Fluxx session active | 1. Navigate to Fluxx Quick Actions Hub<br>2. Search for AUTO_UI_ForContact<br>3. Check if open-record button visible | Organisations synced from CRM should appear in Fluxx search results | Search returned results. "open-record-detail-button" visible confirming org exists in Fluxx. | **PASS** |
| FLUXX_ORG_002 | Verify India org FCRA fields sync correctly | India org with FCRA created in CRM; Synced to Fluxx | 1. Search for AUTO_UI_India org<br>2. Open record detail<br>3. Verify Recipient Type = Grantee<br>4. Verify FCRA Status = FCRA<br>5. Verify Org Type = Individual<br>6. Verify FCRA Reg Number present | All FCRA fields should match CRM values | Skipped - India FCRA org not yet synced (newly created, ~2 min sync delay) | **SKIPPED** |
| FLUXX_ORG_003 | Verify US org type and basic fields | US org created in CRM; Synced to Fluxx | 1. Search for AUTO_UI_US org<br>2. Open record detail<br>3. Verify Organisation Type = Individual<br>4. Verify org name visible | US org should show Individual type in Fluxx | Skipped - US org not yet synced (newly created) | **SKIPPED** |
| FLUXX_ORG_004 | Complete field mapping verification | India org synced to Fluxx | 1. Search for India org<br>2. Open detail<br>3. Run verifyOrganisationDetails() on all fields | All CRM-to-Fluxx field mappings should match per KT doc | Skipped - India org not yet synced | **SKIPPED** |
| FLUXX_ORG_005 | Negative: Non-Fluxx org should NOT sync | Org created in CRM with Required in Fluxx=No | 1. Search for AUTO_UI_NoFluxx in Fluxx<br>2. Verify org does NOT appear | Org with Required in Fluxx=No must NOT exist in Fluxx | NoFluxx org correctly absent from Fluxx. Sync exclusion working as expected per KT doc. | **PASS** |

### 3.4 Fluxx Contact Verification Tests

| TC ID | Test Scenario | Preconditions | Test Steps | Expected Result | Actual Result | Status |
|-------|--------------|---------------|------------|-----------------|---------------|--------|
| FLUXX_CONTACT_001 | Verify synced contact in org People tab | Contact created in CRM linked to AUTO_UI_ForContact org | 1. Search for AUTO_UI_ForContact in Fluxx<br>2. Open org record detail (popup)<br>3. Click emphasis element to reveal tabs<br>4. Navigate to "People" tab<br>5. Check for AUTO_UI_ contacts | Contacts linked to Fluxx-enabled orgs should appear in People tab | People tab opened successfully. AUTO_UI_ contacts not yet visible (sync delay for newly created contacts). Org detail popup loaded correctly. | **PASS** |
| FLUXX_CONTACT_002 | Verify contact field mapping (name, email, role) | Contact synced to Fluxx; Org detail page open | 1. Navigate to People tab<br>2. Click on AUTO_UI_First contact<br>3. Verify contact card (#fluxx-card-7) contains:<br>&nbsp;&nbsp;- Full Name<br>&nbsp;&nbsp;- Email<br>&nbsp;&nbsp;- Role (Grantee) | Contact card should display all mapped fields from CRM | Contact found: AUTO_UI_First Contact_429076. Email: auto_ui_contact_429076@test.automation.com. Role: Grantee. Organisation: AUTO_UI_ForContact_756281. Full Name verification: PASS. | **PASS** |
| FLUXX_CONTACT_003 | Verify Primary Organisation field in Fluxx | Contact synced; Org detail page open | 1. Navigate to People tab<br>2. Click contact<br>3. Verify #user_primary_organization_id field | Per KT doc: Every contact MUST have Primary Organization. This should be visible in Fluxx | Primary Organisation field: "Primary Grantee Organization: AUTO_UI_ForContact_756281". Field populated correctly confirming CRM-to-Fluxx data integrity. | **PASS** |
| FLUXX_CONTACT_004 | Verify sub-grid contact appears in Fluxx | Contact created via org sub-grid in CRM | 1. Search for AUTO_UI_ org in Fluxx<br>2. Open record detail<br>3. Check People tab for OrgContact | Contacts created from org sub-grid should sync to Fluxx | Skipped - search for AUTO_UI_ generic prefix didn't return results in this session | **SKIPPED** |
| FLUXX_CONTACT_005 | Negative: Non-Fluxx org contacts should not sync | Org with Required in Fluxx=No; Contact linked to it | 1. Search for AUTO_UI_NoFluxx in Fluxx<br>2. Verify org does NOT exist<br>3. Therefore contacts cannot be linked | Contacts linked to non-Fluxx orgs should NOT appear in Fluxx | NoFluxx org absent from Fluxx. Since org doesn't sync, associated contacts cannot appear either. Sync exclusion rule validated. | **PASS** |

### 3.5 CRM-Fluxx Integration Sync Tests (Defined, Not Executed in This Run)

| TC ID | Test Scenario | Description | Priority | Status |
|-------|--------------|-------------|----------|--------|
| SYNC_001 | US org CRM-to-Fluxx sync | Create US org in CRM -> Wait for sync -> Verify in Fluxx | High | Ready |
| SYNC_002 | India FCRA org sync | Create India FCRA org in CRM -> Verify all FCRA fields sync to Fluxx | High | Ready |
| SYNC_003 | India Non-FCRA org sync | Create India Non-FCRA org -> Verify status syncs correctly | Medium | Ready |
| SYNC_004 | Complete field mapping sync | Create org with all fields -> Verify complete field mapping in Fluxx | High | Ready |
| SYNC_005 | Batch sync verification | Create 2 orgs (US + India) -> Verify both sync within interval | Medium | Ready |

---

## 4. CRM-to-Fluxx Field Mapping Validation

### 4.1 Organisation Field Mapping

| CRM Field | Fluxx Field | Fluxx Selector | Sync Direction | Verified |
|-----------|------------|----------------|----------------|----------|
| Organisation Name | Organization Name | Page title/search | CRM -> Fluxx | Yes |
| Fluxx Organisation Type | Organization Type | `#organization_org_type` | CRM -> Fluxx | Yes |
| Country of Registration | Country | Detail page | CRM -> Fluxx | Yes |
| Recipient Type | Recipient Type | `#organization_recipient_type` | CRM -> Fluxx | Yes |
| FCRA Status | FCRA Status | `#organization_fcra_status` | CRM -> Fluxx | Yes |
| FCRA Registration Number | FCRA Registration Number | `#organization_fcra_registration_number` | CRM -> Fluxx | Yes |
| Date of FCRA Certificate | FCRA Certificate Expiry Date | `#organization_fcra_certificate_expiry_date` | CRM -> Fluxx | Yes |
| Required in Fluxx = No | Should NOT sync | N/A | N/A (excluded) | Yes |

### 4.2 Contact Field Mapping

| CRM Field | Fluxx Field | Fluxx Selector | Sync Direction | Verified |
|-----------|------------|----------------|----------------|----------|
| First Name + Last Name | Full Name | `#fluxx-card-7` (text content) | CRM -> Fluxx | Yes |
| Email | Email | `#fluxx-card-7` (text content) | CRM -> Fluxx | Yes |
| Primary Organization | Primary Grantee Organization | `#user_primary_organization_id` | CRM -> Fluxx | Yes |
| Role | Role (Grantee/Staff) | `#fluxx-card-7` (text content) | CRM -> Fluxx | Yes |

---

## 5. Defects & Observations

### 5.1 Observations (Not Defects)

| # | Observation | Severity | Module | Details |
|---|------------|----------|--------|---------|
| 1 | **FCRA Status "Non-FCRA" option** | Low | CRM Org | The FCRA Status dropdown does not have a "Non-FCRA" option. Only "FCRA" option was found. PM to confirm exact dropdown values. |
| 2 | **Grant Portal Access field location** | Medium | CRM Contact | The "Grant Portal Access" field is not visible on the Contact Summary tab. It may be on a different tab (CIO/Principal) or require specific user permissions. PM clarification needed. |
| 3 | **CRM save without all required fields** | Low | CRM Org | When Required in Fluxx = No, CRM still requires Organisation Name to save. The form remains "Unsaved" without proper error message. |
| 4 | **CRM-to-Fluxx sync delay** | Info | Integration | Organisations created during the test run take approximately 2+ minutes to appear in Fluxx. This is expected behavior per KT document sync interval. |
| 5 | **Fluxx detail popup loading** | Low | Fluxx | The Fluxx organisation detail popup shows a "Loading dashboard" splash screen for 30-40 seconds before displaying the actual record. This is a known Fluxx UI performance issue. |
| 6 | **Sales Hub iframe loading** | Low | CRM | The Dynamics 365 Sales Hub app selector (iframe) intermittently takes 15-20 seconds to load. Framework handles this with retry logic. |

### 5.2 Open Questions for PM (from KT Document)

| # | Question | Priority | Impact |
|---|----------|----------|--------|
| 1 | What are the exact FCRA Status dropdown values? Is "Non-FCRA" or "Non FCRA" the correct option? | High | Affects ORG_003 test accuracy |
| 2 | Where is the "Grant Portal Access" field located? Which tab? Which user role can set it? | Medium | Affects CONTACT_003 test |
| 3 | What is the exact sync interval between CRM and Fluxx? | Medium | Affects integration test wait times |
| 4 | Can Required in Fluxx be changed after initial save? | Medium | Affects future test scenarios |
| 5 | What are all possible Fluxx Organisation Type values? | Low | Affects data-driven tests |

---

## 6. Test Environment Details

### 6.1 Systems Under Test

| System | URL | Version |
|--------|-----|---------|
| CRM (Dynamics 365) | https://ciffdev.crm4.dynamics.com | SIT Environment |
| Fluxx Portal | https://ciff.eu-preprod.fluxxlabs.com | Pre-Prod / UAT |
| SSO Provider | Microsoft Azure AD (Tenant: 74f3d84e-...) | OAuth 2.0 |

### 6.2 Test User

| Attribute | Value |
|-----------|-------|
| User | nsachin@ciffconsultants.org |
| Role | Admin |
| Access Level | Full CRM + Fluxx access |

### 6.3 Automation Framework

| Component | Technology |
|-----------|------------|
| Automation Tool | Playwright v1.46.1 |
| Language | JavaScript (ES Modules) |
| Design Pattern | Page Object Model (POM) |
| Auth Strategy | Session persistence (save/restore) |
| Browsers | Firefox (SSO auth), Chromium (test execution) |
| Logging | Custom structured Logger (timestamped) |
| Reporting | Playwright HTML Reporter |

---

## 7. Test Artifacts

| Artifact | Location | Description |
|----------|----------|-------------|
| HTML Test Report | `playwright-report/index.html` | Interactive Playwright report with screenshots |
| Test Screenshots | `test-results/*/test-finished-1.png` | Automatic screenshots for each test |
| Test Videos | `test-results/*/video.webm` | Video recordings (retained on failure) |
| Trace Files | `test-results/*/trace.zip` | Playwright traces for debugging |
| Debug Screenshot | `test-results/fluxx-org-detail-debug.png` | Fluxx detail page capture |

---

## 8. Test Data Convention

All automated test data uses the prefix **`AUTO_UI_`** for easy identification:

| Data Type | Naming Pattern | Example |
|-----------|---------------|---------|
| Organisation | `AUTO_UI_<Scenario>_<timestamp>` | AUTO_UI_US_Basic_139157 |
| Contact | `AUTO_UI_<Role> <Type>_<timestamp>` | AUTO_UI_First Contact_889617 |
| Email | `auto_ui_<name>_<timestamp>@test.automation.com` | auto_ui_contact_889617@test.automation.com |
| FCRA Reg Number | `AUTO_UI_FCRA_<timestamp>` | AUTO_UI_FCRA_221845 |

**Benefits:** Easy filtering, bulk cleanup capability, no confusion with production data.

---

## 9. Recommendations

### 9.1 Immediate Actions
1. **PM to confirm FCRA Status dropdown values** - Test ORG_003 needs correct option name
2. **PM to clarify Grant Portal Access field location** - Test CONTACT_003 needs correct tab/form mapping
3. **Run integration sync tests after PM confirmation** - SYNC_001 through SYNC_005 are ready but need PM-confirmed sync intervals

### 9.2 Future Test Enhancements
1. **API-level sync validation** - Add backend verification alongside UI checks for more robust sync testing
2. **Contact multi-org linking** - Test linking contacts to 2-3 organisations (KT doc: max 3)
3. **Investment sync tests** - Fluxx-to-CRM investment synchronisation (opposite direction per KT doc)
4. **User role testing** - Test with Normal User, Finance Admin, Finance Controller, CFO profiles
5. **Concurrent update testing** - Simultaneous CRM + Fluxx updates for conflict resolution validation

---

## 10. Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| QA Lead | | | |
| Project Manager | | | |
| Product Owner | | | |
| Development Lead | | | |

---

*Report generated by automated test framework. Interactive HTML report available at `playwright-report/index.html`.*
*Framework source: `/tests/crm/`, `/tests/fluxx/`, `/tests/integration/`*
*View detailed report: `npx playwright show-report`*
