import { BasePage } from './BasePage.js';
import { TIMEOUTS, FABRIC_SELECTORS } from '../config/constants.js';

export class FabricDashboardPage extends BasePage {
  constructor(page) {
    super(page, 'FabricDashboard');
  }

  async verifyReportTitle() {
    this.log.info('Verifying report title');
    return await this.page.locator('text=Programme Rating Dashboard').isVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE }).catch(() => false);
  }

  async getKPIValue(kpiName) {
    this.log.info(`Reading KPI: ${kpiName}`);
    const el = this.page.locator(`text=${kpiName}`).first();
    if (await el.isVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE }).catch(() => false)) {
      return await el.locator('..').textContent();
    }
    return null;
  }

  async verifyRatingStatusChart() {
    return await this.page.locator('text=Rating Status').isVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE }).catch(() => false);
  }

  async verifyInvestmentsHealthPie() {
    const visible = await this.page.locator('text=CIFF Investments Health').isVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE }).catch(() => false);
    if (!visible) return { visible: false, ratings: [] };
    const ratings = [];
    for (const r of FABRIC_SELECTORS.RATING_COLORS) {
      ratings.push({ name: r, visible: await this.page.locator(`text=${r}`).first().isVisible().catch(() => false) });
    }
    return { visible: true, ratings };
  }

  async verifyProgrammeTeamBar() {
    const visible = await this.page.locator('text=Portfolio Health Programme Team').isVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE }).catch(() => false);
    if (!visible) return { visible: false, teams: [] };
    const teams = [];
    for (const t of FABRIC_SELECTORS.PROGRAMME_TEAMS) {
      teams.push({ name: t, visible: await this.page.getByRole('option', { name: t }).first().isVisible().catch(() => false) });
    }
    return { visible: true, teams };
  }

  async selectFilter(filterName, value) {
    this.log.info(`Filter ${filterName} → ${value}`);
    const combo = this.page.getByRole('combobox', { name: filterName });
    await combo.click();
    await this.page.waitForTimeout(TIMEOUTS.SHORT_WAIT);
    await this.page.getByRole('option', { name: value }).first().click();
    await this.page.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);
  }

  async resetFilters() {
    this.log.info('Resetting filters');
    const btn = this.page.locator('text=Reset').first();
    if (await btn.isVisible().catch(() => false)) { await btn.click(); await this.page.waitForTimeout(TIMEOUTS.MEDIUM_WAIT); }
  }

  async clickBookmark(name) {
    this.log.info(`Bookmark: ${name}`);
    await this.page.locator(`text=${name}`).first().click();
    await this.page.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);
  }

  async switchToTab(tabName) {
    this.log.info(`Tab: ${tabName}`);
    await this.page.getByRole('tab', { name: tabName }).click();
    await this.page.waitForTimeout(TIMEOUTS.LONG_WAIT);
  }

  async getCurrentTab() {
    return await this.page.locator('[role="tab"][aria-selected="true"]').textContent();
  }
}
