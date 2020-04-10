import { Admin } from './admin.js';
import { createHTML, show } from './utils.js';
import { PostDraft } from './post-draft.js';
import { addStyle } from './post-admin.js';

/**
 * @param {object} opts
 * @param {HTMLElement} opts.contentElement
 */
export function addPostListAdminView({
  contentElement,
}) {
  addStyle('/admin/admin.css');

  const adminInterface = createHTML(`
    <section id="admin-post-list">
      <h2>Blog Admin</h2>

      <div class="side-by-side">
        <ul class="drafts">
          Drafts:
          <li data-keep><a href="/admin/edit"><i class="icon fas fa-plus"></i>New</a></li>
          <li><i class="icon fas fa-spinner fa-pulse"></i></li>
        </ul>

        <ul class="unsaved">
          Unsaved changes:
        </ul>
      </div>

      <hr>
    </section>
  `);
  contentElement.before(adminInterface);

  const draftsList = adminInterface.querySelector('ul.drafts');
  const unsavedList = adminInterface.querySelector('ul.unsaved');

  new Admin({
    handleLogin: (loggedIn) => {
      if (!loggedIn) {
        return;
      }

      show(adminInterface, true);

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const keyParts = localStorage.key(i).match(/^gh_post_(.*)/)
        const filepath = keyParts && keyParts[1];
        if (!filepath || filepath === 'new') {
          // This is accessible in the drafts list already.
          continue;
        }

        const params = new URLSearchParams();
        params.set('filepath', filepath);
        unsavedList.appendChild(createHTML(`<li><a href="/admin/edit?${params}">${filepath}</a></li>`));
      }

      PostDraft.list().then(drafts => {
        draftsList.querySelectorAll('li').forEach(li => {
          if (li.dataset.hasOwnProperty('keep')) {
            return;
          }
          li.remove();
        });
        drafts.forEach(d => {
          const li = createHTML('<li></li>');
          li.appendChild(d.el);
          draftsList.appendChild(li);
        });
      });
    }
  });
}
