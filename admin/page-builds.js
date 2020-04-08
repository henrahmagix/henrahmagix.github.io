import { Api } from '/admin/admin.js';
import { createHTML, show } from '/admin/utils.js';

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

  async checkForCommit(commit) {
    this.commit = commit;

    this.api.makeRequest('/pages/builds').then(res => {
      const latest = res[0];
      show(this.waitingEl, latest.status !== 'built' || this.commit !== latest.commit);
    });
  }
}
