import { Api } from '/admin/admin.js';
import { createHTML, show } from '/admin/utils.js';

export class PageBuildStatus {
  get waitingEl() { return this.el.querySelector('.waiting'); }
  get historyLink() { return this.el.querySelector('.history'); }
  get latestDiffButton() { return this.el.querySelector('.show-latest-diff'); }
  get latestDiffEl() { return this.el.querySelector('.latest-diff'); }

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
        <p>
          <button hidden class="button-link show-latest-diff"></button>
          <pre hidden class="latest-diff"></pre>
        </p>
      </div>
    `);

    this.latestDiffButton.addEventListener('click', () => this.toggleDiff())
  }

  async checkForCommit(commit) {
    this.commit = commit;

    this.latestDiffButton.innerText = `Show last change: ${this.commit.slice(0, 7)}`;
    show(this.latestDiffButton);

    this.api.makeRequest('/pages/builds').then(res => {
      const latest = res[0];
      show(this.waitingEl, latest.status !== 'built' || this.commit !== latest.commit);
    });
  }

  async toggleDiff() {
    this.showingDiff = !this.showingDiff;
    show(this.latestDiffEl, this.showingDiff);

    if (this.showingDiff) {
      this.latestDiffEl.innerText = await this.getDiff();
    }
  }

  async getDiff() {
    this.diffCache = this.diffCache || {};
    if (this.diffCache[this.commit]) {
      return this.diffCache[this.commit];
    }

    const headers = new Headers();
    headers.set('Accept', 'application/vnd.github.v3.diff');

    return this.diffCache[this.commit] = await this.api.makeRequest(`/commits/${this.commit}`, {
      headers,
    });
  }
}
