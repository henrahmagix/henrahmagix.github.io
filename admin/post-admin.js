import { Admin } from '/admin/admin.js';
import { EditPost } from '/admin/post-edit.js';
import { createHTML } from '/admin/utils.js';

const buildWaiting = createHTML('<p id="build-waiting">Build waiting <button class="button-link" onclick="location.reload()"><i class="fas fa-sync-alt"></i></button></p>');
document.getElementById('content').before(buildWaiting);

const admin = new Admin({
  handleLogin(loggedIn) {
    if (loggedIn) {
      const edit = new EditPost(document.getElementById('content'));
      edit.insertBefore(content);

      admin.api.fetch('/pages/builds').then(res => {
        if (window.github_data.build_revision === res[0].commit) {
          buildWaiting.hidden = true;
        }
      });
    }
  },
});
