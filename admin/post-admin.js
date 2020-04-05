import { Admin } from '/admin/admin.js';
import { EditPost } from '/admin/post-edit.js';

const edit = new EditPost(document.getElementById('content'));

new Admin({
  handleLogin(loggedIn) {
    if (loggedIn) {
      edit.insertBefore(content);
    }
  },
});
