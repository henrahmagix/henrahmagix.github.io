import { Admin } from './admin.js';
import { createHTML, show } from './utils.js';
import { PostDraft } from './post-draft.js';

const template = createHTML(`
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

/** @param {string} href */
function linkStylesheet(href) {
  const linkElem = document.createElement('link');
  linkElem.setAttribute('rel', 'stylesheet');
  linkElem.setAttribute('href', href);
  return linkElem;
}

export class PostListAdminView extends HTMLElement {
  constructor() {
    super();

    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.appendChild(template.cloneNode(true));

    document.head.querySelectorAll('link[rel=stylesheet]').forEach(link => {
      shadowRoot.appendChild(link.cloneNode());
    });
    shadowRoot.appendChild(linkStylesheet('/admin/admin.css'));

    const draftsList = this.shadowRoot.querySelector('ul.drafts');
    const unsavedList = this.shadowRoot.querySelector('ul.unsaved');

    new Admin({
      handleLogin: (loggedIn) => {
        if (!loggedIn) {
          return;
        }

        show(this, true);

        for (let i = 0; i < localStorage.length; i++) {
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
}
