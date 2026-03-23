# Test Case Document - CRM-Fluxx UI Automation

## Module: CRM Organisation Management

### TC-ORG-001: Create Basic US Organisation with Fluxx Sync
| Field | Details |
|-------|---------|
| **Test ID** | TC-ORG-001 |
| **Description** | Create a basic organisation with US country, Fluxx required = Yes, Org Type = Individual |
| **Preconditions** | User is logged into CRM, navigated to Sales Hub > Organisation |
| **Steps** | 1. Click "New" button<br>2. Fill Organisation Name with AUTO_UI_ prefix<br>3. Set Required in Fluxx = Yes<br>4. Set Fluxx Organisation Type = Individual<br>5. Set Country = United States (via lookup search)<br>6. Set City = New York<br>7. Click Save (CTRL+S) |
| **Expected Result** | Organisation saved successfully. Form header shows "OrgName- Saved". Organisation appears in Fluxx within 2 minutes. |
| **Priority** | P1 - Critical |
| **Automation** | `tests/crm/organisation.spec.js` - ORG_001 |

### TC-ORG-002: Create India Organisation with Grantee + FCRA
| Field | Details |
|-------|---------|
| **Test ID** | TC-ORG-002 |
| **Description** | Create India organisation with FCRA fields populated |
| **Preconditions** | User is logged into CRM, navigated to Sales Hub > Organisation |
| **Steps** | 1. Click "New" button<br>2. Fill Organisation Name with AUTO_UI_ prefix<br>3. Set Required in Fluxx = Yes<br>4. Set Country = India<br>5. Set Fluxx Organisation Type = Individual<br>6. Set City = Mumbai<br>7. Set Recipient Type = Grantee<br>8. Verify FCRA Status field becomes visible<br>9. Set FCRA Status = FCRA<br>10. Verify FCRA Registration Number and Date fields become visible<br>11. Fill FCRA Registration Number<br>12. Fill Date of FCRA certificate<br>13. Click Save (CTRL+S) |
| **Expected Result** | Organisation saved. All FCRA fields populated. Conditional fields appear correctly. |
| **Priority** | P1 - Critical |
| **Automation** | `tests/crm/organisation.spec.js` - ORG_002 |

### TC-ORG-003: Create India Organisation with Grantee + Non-FCRA
| Field | Details |
|-------|---------|
| **Test ID** | TC-ORG-003 |
| **Description** | Create India org with Non-FCRA status - FCRA detail fields should NOT appear |
| **Preconditions** | User is logged into CRM, navigated to Organisation |
| **Steps** | 1. Click New<br>2. Fill org name<br>3. Set Required in Fluxx = Yes<br>4. Set Country = India<br>5. Set Fluxx Organisation Type = Individual<br>6. Set City<br>7. Set Recipient Type = Grantee<br>8. Set FCRA Status = Non-FCRA<br>9. Verify FCRA Registration Number and Date fields do NOT appear<br>10. Save |
| **Expected Result** | Organisation saved. FCRA detail fields (reg number, date) are hidden when Non-FCRA selected. |
| **Priority** | P2 - High |
| **Automation** | `tests/crm/organisation.spec.js` - ORG_003 |

### TC-ORG-004: Create India Organisation with Non-Grantee Recipient
| Field | Details |
|-------|---------|
| **Test ID** | TC-ORG-004 |
| **Description** | Verify FCRA fields are hidden when Recipient Type is not Grantee |
| **Preconditions** | User is logged into CRM, navigated to Organisation |
| **Steps** | 1. Click New<br>2. Fill org name<br>3. Set Required in Fluxx = Yes<br>4. Set Country = India<br>5. Set Fluxx Organisation Type = Individual<br>6. Set City<br>7. Set Recipient Type = Service Provider (Entity)<br>8. Verify FCRA Status field is NOT visible<br>9. Save |
| **Expected Result** | Organisation saved. FCRA fields are hidden for non-Grantee recipient types. |
| **Priority** | P2 - High |
| **Automation** | `tests/crm/organisation.spec.js` - ORG_004 |

### TC-ORG-005: Create Organisation with Fluxx Not Required
| Field | Details |
|-------|---------|
| **Test ID** | TC-ORG-005 |
| **Description** | Create org with Required in Fluxx = No (minimal fields) |
| **Preconditions** | User is logged into CRM, navigated to Organisation |
| **Steps** | 1. Click New<br>2. Fill org name<br>3. Set Required in Fluxx = No<br>4. Save |
| **Expected Result** | Organisation saved with minimal fields. Fluxx-specific fields not required. Organisation does NOT sync to Fluxx. |
| **Priority** | P2 - High |
| **Automation** | `tests/crm/organisation.spec.js` - ORG_005 |

### TC-ORG-006: FCRA Conditional Field Visibility
| Field | Details |
|-------|---------|
| **Test ID** | TC-ORG-006 |
| **Description** | Verify conditional rendering of FCRA fields based on Country and Recipient Type |
| **Preconditions** | User is logged into CRM, navigated to Organisation form |
| **Steps** | 1. Open new org form<br>2. Set Country = United States -> verify Recipient Type not visible<br>3. Change Country = India -> verify Recipient Type becomes visible<br>4. Set Recipient Type = Exempt -> verify FCRA Status not visible<br>5. Change Recipient Type = Grantee -> verify FCRA Status becomes visible<br>6. Set FCRA Status = FCRA -> verify FCRA Reg Number and Date visible<br>7. Change FCRA Status = Non-FCRA -> verify FCRA Reg Number and Date hidden |
| **Expected Result** | Fields appear/hide based on conditional logic rules. |
| **Priority** | P1 - Critical |
| **Automation** | `tests/crm/organisation.spec.js` - ORG_006 |

### TC-ORG-007: Organisation with Fluxx Type "Organisation"
| Field | Details |
|-------|---------|
| **Test ID** | TC-ORG-007 |
| **Description** | Create org with Fluxx Organisation Type = Organisation (not Individual) |
| **Preconditions** | User is logged into CRM |
| **Steps** | 1. Create new org<br>2. Set Fluxx Organisation Type = Organisation<br>3. Fill required fields<br>4. Save |
| **Expected Result** | Organisation saved and syncs to Fluxx with type "Organisation". |
| **Priority** | P3 - Medium |
| **Automation** | `tests/crm/organisation.spec.js` - ORG_007 |

---

## Module: CRM Contact Management

### TC-CONTACT-001: Create Standalone Contact with Organisation Link
| Field | Details |
|-------|---------|
| **Test ID** | TC-CONTACT-001 |
| **Description** | Create a new contact and link to an existing AUTO_UI_ organisation |
| **Preconditions** | An AUTO_UI_ organisation exists in CRM |
| **Steps** | 1. Navigate to Contacts<br>2. Click New<br>3. Fill First Name (AUTO_UI_ prefix)<br>4. Fill Last Name<br>5. Fill Email<br>6. Search and link to organisation<br>7. Save |
| **Expected Result** | Contact saved and linked to organisation. Visible in org's contact sub-grid. |
| **Priority** | P2 - High |
| **Automation** | `tests/crm/contact.spec.js` - CONTACT_001 |

### TC-CONTACT-002: Create Contact from Organisation Sub-grid
| Field | Details |
|-------|---------|
| **Test ID** | TC-CONTACT-002 |
| **Description** | Create a contact directly from an organisation's contact sub-grid |
| **Preconditions** | An AUTO_UI_ organisation exists in CRM |
| **Steps** | 1. Navigate to Organisation<br>2. Search and open an AUTO_UI_ org<br>3. Go to Summary tab<br>4. Click More commands for Contact > New Contact<br>5. Fill First Name, Last Name, Email<br>6. Save (Ctrl+S) |
| **Expected Result** | Contact created and automatically linked to the parent organisation. |
| **Priority** | P2 - High |
| **Automation** | `tests/crm/contact.spec.js` - CONTACT_002 |

---

## Module: Fluxx Organisation Verification

### TC-FLUXX-001: Verify AUTO_UI_ Organisations in Fluxx
| Field | Details |
|-------|---------|
| **Test ID** | TC-FLUXX-001 |
| **Description** | Verify automation-created organisations appear in Fluxx Quick Actions |
| **Preconditions** | CRM tests have run and created AUTO_UI_ organisations |
| **Steps** | 1. Login to Fluxx<br>2. Open Quick Actions Hub<br>3. Search for "AUTO_UI_"<br>4. Verify results appear |
| **Expected Result** | AUTO_UI_ organisations visible in Fluxx search results. |
| **Priority** | P1 - Critical |
| **Automation** | `tests/fluxx/organisation.spec.js` - FLUXX_001 |

### TC-FLUXX-002: Verify India FCRA Organisation Details
| Field | Details |
|-------|---------|
| **Test ID** | TC-FLUXX-002 |
| **Description** | Verify FCRA field values are correctly synced from CRM to Fluxx |
| **Preconditions** | India Grantee FCRA org exists in CRM and has synced |
| **Steps** | 1. Search for AUTO_UI_India org in Fluxx<br>2. Open record detail<br>3. Verify Recipient Type = Grantee<br>4. Verify FCRA Status = FCRA<br>5. Verify FCRA Registration Number<br>6. Verify Organisation Type = Individual |
| **Expected Result** | All FCRA fields match values set in CRM. |
| **Priority** | P1 - Critical |
| **Automation** | `tests/fluxx/organisation.spec.js` - FLUXX_002 |

---

## Module: CRM-Fluxx Integration Sync

### TC-SYNC-001: Basic US Organisation Sync
| Field | Details |
|-------|---------|
| **Test ID** | TC-SYNC-001 |
| **Description** | End-to-end: Create US org in CRM and verify it appears in Fluxx |
| **Preconditions** | Valid SSO credentials. CRM and Fluxx accessible. |
| **Steps** | 1. Login to CRM (via saved session)<br>2. Create US org with Fluxx required<br>3. Verify CRM save<br>4. Login to Fluxx<br>5. Search for org with retry (up to 2 min)<br>6. Verify org appears<br>7. Open detail and verify Org Type = Individual |
| **Expected Result** | Organisation syncs from CRM to Fluxx within 2 minutes. Details match. |
| **Priority** | P1 - Critical |
| **Automation** | `tests/integration/crm-fluxx-sync.spec.js` - SYNC_001 |

### TC-SYNC-002: India FCRA Organisation Sync
| Field | Details |
|-------|---------|
| **Test ID** | TC-SYNC-002 |
| **Description** | E2E: Create India FCRA org in CRM, verify all FCRA fields in Fluxx |
| **Preconditions** | Valid SSO credentials |
| **Steps** | 1. Create India org with Grantee, FCRA, reg number, date in CRM<br>2. Login to Fluxx<br>3. Search with retry<br>4. Verify: Recipient Type, FCRA Status, FCRA Reg Number, Org Type |
| **Expected Result** | All FCRA-specific fields sync correctly to Fluxx. |
| **Priority** | P1 - Critical |
| **Automation** | `tests/integration/crm-fluxx-sync.spec.js` - SYNC_002 |

### TC-SYNC-003: India Non-FCRA Organisation Sync
| Field | Details |
|-------|---------|
| **Test ID** | TC-SYNC-003 |
| **Description** | E2E: Create India Non-FCRA org, verify Non-FCRA status in Fluxx |
| **Preconditions** | Valid SSO credentials |
| **Steps** | 1. Create India Grantee Non-FCRA org in CRM<br>2. Verify in Fluxx<br>3. Confirm FCRA Status = Non-FCRA |
| **Expected Result** | Non-FCRA status correctly reflected in Fluxx. |
| **Priority** | P2 - High |
| **Automation** | `tests/integration/crm-fluxx-sync.spec.js` - SYNC_003 |

### TC-SYNC-004: Complete Field Mapping Verification
| Field | Details |
|-------|---------|
| **Test ID** | TC-SYNC-004 |
| **Description** | Verify all fields map correctly between CRM and Fluxx |
| **Preconditions** | Valid SSO credentials |
| **Steps** | 1. Create India FCRA org with all fields populated<br>2. Verify each field in Fluxx detail page<br>3. Use structured verification to compare all fields |
| **Expected Result** | Complete field-level mapping verified: Name, Org Type, Recipient Type, FCRA Status, FCRA Reg Number. |
| **Priority** | P1 - Critical |
| **Automation** | `tests/integration/crm-fluxx-sync.spec.js` - SYNC_004 |

### TC-SYNC-005: Batch Sync - Multiple Organisations
| Field | Details |
|-------|---------|
| **Test ID** | TC-SYNC-005 |
| **Description** | Create multiple orgs in CRM and verify all sync to Fluxx |
| **Preconditions** | Valid SSO credentials |
| **Steps** | 1. Create US Individual org in CRM<br>2. Create India Grantee FCRA org in CRM<br>3. Login to Fluxx<br>4. Verify both orgs appear in Fluxx |
| **Expected Result** | Both organisations sync successfully within the retry window. |
| **Priority** | P2 - High |
| **Automation** | `tests/integration/crm-fluxx-sync.spec.js` - SYNC_005 |

---

## Edge Cases & Negative Scenarios

### TC-NEG-001: Organisation Name with Special Characters
| Field | Details |
|-------|---------|
| **Test ID** | TC-NEG-001 |
| **Description** | Create org with special characters in name |
| **Steps** | Create org with name containing &, <, >, quotes |
| **Expected Result** | Org saves correctly, name preserved in both CRM and Fluxx |

### TC-NEG-002: Duplicate Organisation Name
| Field | Details |
|-------|---------|
| **Test ID** | TC-NEG-002 |
| **Description** | Attempt to create org with existing name |
| **Steps** | Create two orgs with identical names |
| **Expected Result** | CRM behavior documented (may allow duplicates or show warning) |

### TC-NEG-003: Save Without Required Fields
| Field | Details |
|-------|---------|
| **Test ID** | TC-NEG-003 |
| **Description** | Attempt to save org without filling mandatory fields |
| **Steps** | Click New > Save immediately without filling any fields |
| **Expected Result** | Validation errors shown for mandatory fields |

### TC-NEG-004: Organisation Not Required in Fluxx Does Not Sync
| Field | Details |
|-------|---------|
| **Test ID** | TC-NEG-004 |
| **Description** | Verify orgs with Required in Fluxx = No do NOT appear in Fluxx |
| **Steps** | 1. Create org with Required in Fluxx = No<br>2. Wait 2+ minutes<br>3. Search in Fluxx |
| **Expected Result** | Organisation does NOT appear in Fluxx |

### TC-NEG-005: Session Expiry Handling
| Field | Details |
|-------|---------|
| **Test ID** | TC-NEG-005 |
| **Description** | Verify framework handles expired session gracefully |
| **Steps** | 1. Delete saved session files<br>2. Run tests without setup project |
| **Expected Result** | Clear error message about missing/expired session |
