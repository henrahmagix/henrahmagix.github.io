import { Admin } from './admin.js';
import { createHTML, show } from './utils.js';
import { PostDraft } from './post-draft.js';

export function addPostListAdminView({
  contentElement,
}) {
  const adminInterface = createHTML(`
    <section>
      <p>This is the admin interface</p>

      <ul id="drafts">
        Drafts:
        <li data-keep><a href="/admin/edit"><i class="icon fas fa-plus"></i>New</a></li>
        <li><i class="icon fas fa-spinner fa-pulse"></i></li>
      </ul>
    </section>
  `);
  contentElement.before(adminInterface);

  const draftsList = adminInterface.querySelector('#drafts');

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
