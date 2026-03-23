import { test, expect } from '@playwright/test';


test.describe('CRM Contacts Tests', () => {

    test('test1', async ({ page }) => {
        await page.goto('https://ciffdev.crm4.dynamics.com/main.aspx?forceUCI=1&pagetype=apps');
        await page.waitForTimeout(5000);
        console.log('✅ CRM loaded');

        console.log('🚀 STEP 2: Open Sales Hub\n');
        await page.frameLocator('iframe[title="AppLandingPage"]')
            .getByLabel('Sales Hub Modernize the sales')
            .click();
        await page.waitForTimeout(5000);
        console.log('✅ Sales Hub opened');

        await page.getByText('Contacts').click();
        await page.waitForTimeout(3000);
        await page.getByLabel('New', { exact: true }).click();
        
        await page.getByRole('tab', { name: 'Summary' }).click();
        let fullname = '';
        await page.waitForTimeout(2000);
        await page.getByRole('textbox', { name: 'First Name' }).click();
        await page.getByRole('textbox', { name: 'First Name' }).fill('UI_Test');
        fullname += 'UI_Test';

        await page.getByRole('textbox', { name: 'Last Name' }).click();
        await page.getByRole('textbox', { name: 'Last Name' }).fill('User1');
        fullname += ' User1';

        await page.getByRole('textbox', { name: 'Email', exact: true }).fill('uitestuser1@gmail.com');

        await page.getByRole('button', { name: 'Search records for Primary' }).click();
        await page.getByPlaceholder('Look for records').fill('UI_');
        await page.getByPlaceholder('Look for records').press('Enter');

    
        await page.getByLabel('Save (CTRL+S)').click();
        await page.waitForTimeout(15000);
        console.log('✅ Contact saved');
        console.log('Full name:', fullname);

        await expect(page.locator('#formHeaderTitle_2')).toContainText(fullname + '- Saved');
    });

    test('test', async ({ page }) => {
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
        await page.getByLabel('Organisation', { exact: true }).getByText('Organisation').click();
        
        await page.getByPlaceholder('Filter by keyword').click();
        await page.getByPlaceholder('Filter by keyword').fill('UI_Test_Org');
        await page.getByPlaceholder('Filter by keyword').press('Enter');

        await page.getByLabel('UI_Test_Org_India_Grantee_FCRA951288').click();
        await page.getByRole('tab', { name: 'Summary' }).click();

        await page.waitForTimeout(3000);
        await page.getByLabel('More commands for Contact').click();
        await page.getByLabel('New Contact. Add New Contact').click();

        await page.getByLabel('First Name').click();
        await page.getByLabel('First Name').fill('UI_Test');

        await page.getByLabel('Last Name').click();
        await page.getByLabel('Last Name').fill('User2');

        await page.getByLabel('Email', { exact: true }).click();
        await page.getByPlaceholder('Provide an email').fill('uitestuser2@gmail.com');

        await page.getByPlaceholder('Provide an email').press('ControlOrMeta+s');

        await page.waitForTimeout(5000);
        await expect(page.getByLabel('UI_Test User2').locator('span')).toContainText('UI_Test User2');
    });

});
