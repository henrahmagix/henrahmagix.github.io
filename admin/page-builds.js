import { Api } from './admin.js';
import { createHTML } from './utils.js';

export class PageBuildStatus {
  get waitingEl() { return this.el.querySelector('.waiting'); }

  constructor() {
    this.api = new Api();

    this.el = createHTML(`
      <div>
        <p class="waiting">
          Build waiting
          <button class="button-link" onclick="location.reload()">
            <i class="fas fa-sync-alt"></i>
          </button>
        </p>
      </div>
    `);
  }

  /**
   * @param {string} commit
   * @returns {Promise<boolean>}
   */
  async checkForCommit(commit) {
    const res = await this.api.makeRequest('/pages/builds')
    const latest = res[0];
    const buildWaiting = latest.status !== 'built' || latest.commit !== commit;

    return buildWaiting;
  }
}
