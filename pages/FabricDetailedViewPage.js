import { BasePage } from './BasePage.js';
import { TIMEOUTS, FABRIC_SELECTORS } from '../config/constants.js';

export class FabricDetailedViewPage extends BasePage {
  constructor(page) {
    super(page, 'FabricDetailedView');
  }

  async verifyProgrammeTeamTables() {
    const teams = ['Africa', 'CEO', 'Climate'];
    const results = [];
    for (const t of teams) {
      results.push({ team: t, visible: await this.page.locator(`text=${t}`).first().isVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE }).catch(() => false) });
    }
    return results;
  }

  async verifyTableColumns() {
    const cols = ['Investment', 'Last Rated Date', 'Last Rating'];
    const results = [];
    for (const c of cols) {
      results.push({ column: c, visible: await this.page.locator(`text=${c}`).first().isVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE }).catch(() => false) });
    }
    return results;
  }

  async verifyColorBars() {
    return await this.page.locator('text=Blue').first().isVisible().catch(() => false);
  }

  async filterByProgrammeManager(value) {
    this.log.info(`Filter Programme Manager: ${value}`);
    const filter = this.page.getByRole('combobox', { name: /Programme Manager/i });
    await filter.click();
    await this.page.waitForTimeout(TIMEOUTS.SHORT_WAIT);
    if (value !== 'All') await this.page.getByRole('option', { name: value }).first().click();
    await this.page.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);
  }

  async filterByExecutiveDirector(value) {
    this.log.info(`Filter Executive Director: ${value}`);
    const filter = this.page.getByRole('combobox', { name: /Executive Director/i });
    await filter.click();
    await this.page.waitForTimeout(TIMEOUTS.SHORT_WAIT);
    if (value !== 'All') await this.page.getByRole('option', { name: value }).first().click();
    await this.page.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);
  }

  async filterByInvestment(value) {
    this.log.info(`Filter Investment: ${value}`);
    const filter = this.page.getByRole('combobox', { name: /Investment/i });
    await filter.click();
    await this.page.waitForTimeout(TIMEOUTS.SHORT_WAIT);
    if (value !== 'All') await this.page.getByRole('option', { name: value }).first().click();
    await this.page.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);
  }
}
