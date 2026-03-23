
import { test, chromium, expect } from '@playwright/test';

test('test', async () => {
  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      '--disable-features=BlockThirdPartyCookies',
      '--disable-features=SameSiteByDefaultCookies,CookiesWithoutSameSiteMustBeSecure'
    ]
  });

  const page = await context.newPage();

  await page.goto('https://launcher.myapps.microsoft.com/api/signin/8ec23bcd-3576-4724-8468-b90064ce6a16?tenantId=74f3d84e-f433-4937-aca1-88c022bfc4f7');

  await page.getByPlaceholder('userid@ciff.org').fill('nsachin@ciffconsultants.org');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.locator('#i0118').fill('AdmiN@172r/#!');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.getByRole('button', { name: 'Yes' }).click();
  await page.waitForTimeout(10000);
  await page.getByLabel('Open Quick Actions Hub').click();
  await page.waitForTimeout(5000);
  await page.getByTestId('highlight-feed-quick-filter-input').fill('UI_Test');
  await page.getByTestId('highlight-feed-quick-filter-input').press('Enter');
  await page.getByTestId('open-record-detail-button').click();
  await page.waitForTimeout(5000);
  await expect(page.locator('#organization_recipient_type')).toContainText('Grantee');
  await expect(page.locator('#organization_fcra_status')).toContainText('FCRA');
  await expect(page.locator('#organization_fcra_registration_number')).toContainText('FCRAN12');
  await expect(page.locator('#organization_fcra_certificate_expiry_date')).toContainText('12/4/2026');
  await page.locator('h3').filter({ hasText: 'Organisation Information' }).click();
  await expect(page.locator('#organization_org_type')).toContainText('Individual');
});