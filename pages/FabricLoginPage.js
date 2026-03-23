import { BasePage } from './BasePage.js';
import { getFabricConfig } from '../config/environments.js';
import { TIMEOUTS } from '../config/constants.js';

export class FabricLoginPage extends BasePage {
  constructor(page) {
    super(page, 'FabricLogin');
    const config = getFabricConfig();
    this.workspaceUrl = config.workspaceUrl;
    this.reportUrl = config.reportUrl;
    this.workspaceName = config.workspaceName;
  }

  async navigateToWorkspace() {
    this.log.step(1, 'Navigate to Fabric workspace');
    await this.navigate(this.workspaceUrl);
    await this.page.waitForTimeout(TIMEOUTS.LONG_WAIT);
  }

  async navigateToReport() {
    this.log.step(1, 'Navigate to Fabric report');
    await this.navigate(this.reportUrl);
    await this.page.waitForTimeout(TIMEOUTS.LONG_WAIT * 2);
  }

  async verifyWorkspaceLoaded() {
    const heading = this.page.getByRole('heading', { name: this.workspaceName });
    return await heading.isVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE }).catch(() => false);
  }

  async openReport(reportName) {
    this.log.info(`Opening report: ${reportName}`);
    const link = this.page.getByRole('link', { name: reportName });
    await link.click();
    await this.page.waitForTimeout(TIMEOUTS.LONG_WAIT * 2);
  }
}
