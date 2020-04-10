import { Admin } from './admin.js';
import { createHTML, show } from './utils.js';
import { PostDraft } from './post-draft.js';

/**
 * @param {object} opts
 * @param {HTMLElement} opts.contentElement
 */
export function addPostListAdminView({
  contentElement,
}) {
  const adminInterface = createHTML(`
    <section id="admin-post-list">
      <h2>Blog Admin</h2>

      <ul>
        Drafts:
        <li data-keep><a href="/admin/edit"><i class="icon fas fa-plus"></i>New</a></li>
        <li><i class="icon fas fa-spinner fa-pulse"></i></li>
      </ul>

      <hr>
    </section>
  `);
  contentElement.before(adminInterface);

  const draftsList = adminInterface.querySelector('ul');

  new Admin({
    handleLogin: (loggedIn) => {
      if (!loggedIn) {
        return;
      }

      show(adminInterface, true);

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
