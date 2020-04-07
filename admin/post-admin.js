import { Admin } from '/admin/admin.js';
import { EditPostView } from '/admin/post-edit.js';
import { createHTML } from '/admin/utils.js';

const contentElement = document.getElementById('content');

const buildWaiting = createHTML('<p id="build-waiting">Build waiting <button class="button-link" onclick="location.reload()"><i class="fas fa-sync-alt"></i></button></p>');
contentElement.before(buildWaiting);

const admin = new Admin({
  handleLogin(loggedIn) {
    if (loggedIn) {
      const edit = new EditPostView(contentElement);
      edit.insertBefore(contentElement);

      admin.api.makeRequest('/pages/builds').then(res => {
        if (window.github_data.build_revision === res[0].commit) {
          buildWaiting.hidden = true;
        }
      });
    }
  },
});
