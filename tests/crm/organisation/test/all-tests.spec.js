import { test, expect } from '@playwright/test';
import { beforeEach } from 'node:test';

test.describe('CRM Organisation Tests', () => {

    let organisationName = '';

    test('Create organisation with `india`, flux is `true` and Recipient Type is not `Grantee`', async ({ page }) => {
        organisationName = 'UI_Test_Org_India_Not_Grantee_'+ Date.now().toString().slice(-6);
        console.log('📍 STEP 1: Navigate to CRM\n');
        await page.goto('https://ciffdev.crm4.dynamics.com/');
        await page.waitForTimeout(3000);
        console.log('✅ CRM loaded');

        console.log('🚀 STEP 2: Open Sales Hub\n');
        await page.frameLocator('iframe[title="AppLandingPage"]')
            .getByLabel('Sales Hub Modernize the sales')
            .click();
        await page.waitForTimeout(3000);
        console.log('✅ Sales Hub opened');

        console.log('📋 STEP 3: Navigate to Organisation\n');
        await page.getByText('Organisation').click();
        await page.waitForTimeout(3000);
        console.log('✅ Organisation list loaded');

        console.log('➕ STEP 4: Open new organisation form\n');
        await page.getByLabel('New', { exact: true }).click();
        await page.waitForTimeout(1000);

        console.log('➕ STEP 4: Fill organisation name\n');
        await page.getByLabel('Organisation Name').click();
        await page.getByLabel('Organisation Name').fill(organisationName);

        console.log('➕ STEP 5: Set Required in Fluxx to Yes\n');
        await page.getByLabel('Required in Fluxx').click();
        await page.getByRole('option', { name: 'Yes' }).click();

        console.log('➕ STEP 6: Select Country of Registration\n');
        await page.getByLabel('Country of Registration, Lookup', { exact: true }).click();
        await page.getByPlaceholder('Look for Country of').fill('india');
        await page.getByLabel('India, 01/08/2023 07:').click();

        console.log('➕ STEP 7: Set Fluxx Organisation Type to Individual\n');
        await page.getByLabel('Fluxx Organisation Type').click();
        await page.getByRole('option', { name: 'Individual' }).click();

        await page.getByLabel('City', { exact: true }).click();
        await page.getByLabel('City', { exact: true }).fill('Gurgoan');

        console.log('➕ STEP 10: Set Recipient Type to Service Provider (Entity)\n');
        await page.getByLabel('Recipient Type').click();
        await page.getByRole('option', { name: 'Service Provider (Entity)' }).click();

        //   console.log('➕ STEP 11: Set Recipient Type to Consultancy (Individual)\n');
        //   await page.getByLabel('Recipient Type').click();
        //   await page.getByRole('option', { name: 'Consultancy (Individual)' }).click();


        //  console.log('if Set Recipient Type to Grantee then opens FCRA fields');
        //   console.log('➕ STEP 12: Set Recipient Type to Grantee\n');
        //   await page.getByLabel('Recipient Type').click();
        //   await page.getByRole('option', { name: 'Grantee' }).click();

        //   console.log('➕ STEP 13: Set FCRA Status to FCRA\n');
        //   await page.getByLabel('FCRA Status').click();
        //   await page.getByRole('option', { name: 'FCRA', exact: true }).click();

        //   console.log('if FCRA Status is FCRA then opens FCRA Registration number and Date of FCRA certificate fields');
        //   console.log('➕ STEP 13.1: Set FCRA Registration number\n');
        //   await page.getByLabel('FCRA Registration number').click();
        //   await page.getByLabel('FCRA Registration number').fill('FCRAN12');

        //   console.log('➕ STEP 14: Set Date of FCRA certificate\n');
        //   await page.getByLabel('Date of FCRA certificate').click();
        //   await page.getByLabel('Date of FCRA certificate').fill('12-04-2026');

        await page.getByLabel('Save (CTRL+S)').click();

        await page.waitForTimeout(20000);
        await expect(page.locator('#formHeaderTitle_2')).toContainText(organisationName + '- Saved');
    });

    test('Create organisation with `india`, flux is `true` , Recipient Type is `Grantee` and FCRA Status is `FCRA`', async ({ page }) => {
        organisationName = 'UI_Test_Org_India_Grantee_FCRA'+ Date.now().toString().slice(-6);
        console.log('📍 STEP 1: Navigate to CRM\n');
        await page.goto('https://ciffdev.crm4.dynamics.com/main.aspx?forceUCI=1&pagetype=apps');
        await page.waitForTimeout(3000);
        console.log('✅ CRM loaded');

        console.log('🚀 STEP 2: Open Sales Hub\n');
        await page.frameLocator('iframe[title="AppLandingPage"]')
            .getByLabel('Sales Hub Modernize the sales')
            .click();
        await page.waitForTimeout(3000);
        console.log('✅ Sales Hub opened');

        console.log('📋 STEP 3: Navigate to Organisation\n');
        await page.getByText('Organisation').click();
        await page.waitForTimeout(3000);
        console.log('✅ Organisation list loaded');

        console.log('➕ STEP 4: Open new organisation form\n');
        await page.getByLabel('New', { exact: true }).click();
        await page.waitForTimeout(1000);

        console.log('➕ STEP 4: Fill organisation name\n');
        await page.getByLabel('Organisation Name').click();
        await page.getByLabel('Organisation Name').fill(organisationName);

        console.log('➕ STEP 5: Set Required in Fluxx to Yes\n');
        await page.getByLabel('Required in Fluxx').click();
        await page.getByRole('option', { name: 'Yes' }).click();

        console.log('➕ STEP 6: Select Country of Registration\n');
        await page.getByLabel('Country of Registration, Lookup', { exact: true }).click();
        await page.getByPlaceholder('Look for Country of').fill('india');
        await page.getByLabel('India, 01/08/2023 07:').click();

        console.log('➕ STEP 7: Set Fluxx Organisation Type to Individual\n');
        await page.getByLabel('Fluxx Organisation Type').click();
        await page.getByRole('option', { name: 'Individual' }).click();

        await page.getByLabel('City', { exact: true }).click();
        await page.getByLabel('City', { exact: true }).fill('Gurgoan');

         console.log('if Set Recipient Type to Grantee then opens FCRA fields');
          console.log('➕ STEP 12: Set Recipient Type to Grantee\n');
          await page.getByLabel('Recipient Type').click();
          await page.getByRole('option', { name: 'Grantee' }).click();

          console.log('➕ STEP 13: Set FCRA Status to FCRA\n');
          await page.getByLabel('FCRA Status').click();
          await page.getByRole('option', { name: 'FCRA', exact: true }).click();

          console.log('if FCRA Status is FCRA then opens FCRA Registration number and Date of FCRA certificate fields');
          console.log('➕ STEP 13.1: Set FCRA Registration number\n');
          await page.getByLabel('FCRA Registration number').click();
          await page.getByLabel('FCRA Registration number').fill('FCRAN12');

          console.log('➕ STEP 14: Set Date of FCRA certificate\n');
          await page.getByLabel('Date of FCRA certificate').click();
          await page.getByLabel('Date of FCRA certificate').fill('12-04-2026');

        await page.getByLabel('Save (CTRL+S)').click();

        await page.waitForTimeout(20000);
        await expect(page.locator('#formHeaderTitle_2')).toContainText(organisationName + '- Saved');
    });

    test('Create organisation without `india`(United States) and flux is `true`', async ({ page }) => {
        organisationName = 'UI_Test_Org_Other_Country_Flux'+ Date.now().toString().slice(-6);
        console.log('📍 STEP 1: Navigate to CRM\n');
        await page.goto('https://ciffdev.crm4.dynamics.com/main.aspx?forceUCI=1&pagetype=apps');
        await page.waitForTimeout(3000);
        console.log('✅ CRM loaded');

        console.log('🚀 STEP 2: Open Sales Hub\n');
        await page.frameLocator('iframe[title="AppLandingPage"]')
            .getByLabel('Sales Hub Modernize the sales')
            .click();
        await page.waitForTimeout(3000);
        console.log('✅ Sales Hub opened');

        console.log('📋 STEP 3: Navigate to Organisation\n');
        await page.getByText('Organisation').click();
        await page.waitForTimeout(3000);
        console.log('✅ Organisation list loaded');

        console.log('➕ STEP 4: Open new organisation form\n');
        await page.getByLabel('New', { exact: true }).click();
        await page.waitForTimeout(1000);

        console.log('➕ STEP 5: Set Organisation Name\n');
        await page.getByLabel('Organisation Name').click();
        await page.getByLabel('Organisation Name').fill(organisationName);
        
        console.log('➕ STEP 6: Set Required in Fluxx\n');
        await page.getByLabel('Required in Fluxx').click();
        await page.getByRole('option', { name: 'Yes' }).click();

        console.log('➕ STEP 7: Set Fluxx Organisation Type to Individual\n');
        await page.getByLabel('Fluxx Organisation Type').click();
        await page.getByRole('option', { name: 'Individual' }).click();
        
        console.log('➕ STEP 8: Set Country of Registration\n');
        await page.getByLabel('Country of Registration, Lookup', { exact: true }).click();
        await page.getByPlaceholder('Look for Country of').fill('United States');
        await page.getByLabel('United States, 01/08/2023 07:').click(); 
        
        console.log('➕ STEP 9: Set City\n');
        await page.getByLabel('City', { exact: true }).click();
        await page.getByLabel('City', { exact: true }).fill('Gurgoan');
        
        console.log('➕ STEP 10: Save Organisation\n');
        await page.getByLabel('Save (CTRL+S)').click();
        await page.getByText('Saving...').click();
        await expect(page.getByLabel('Saving...').locator('label')).toContainText('Saving...');
        
        await page.waitForTimeout(20000);
        await expect(page.locator('#formHeaderTitle_2')).toContainText(organisationName + '- Saved');
        console.log('✅ Organisation saved successfully\n');
    });

});
