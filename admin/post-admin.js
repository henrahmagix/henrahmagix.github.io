import { Admin } from '/admin/admin.js';
import { EditPostView } from '/admin/post-edit.js';
import { PageBuildStatus } from '/admin/page-builds.js';

const contentElement = document.getElementById('content');

const admin = new Admin({
  handleLogin(loggedIn) {
    if (loggedIn) {
      const buildWaiting = new PageBuildStatus();

      const edit = new EditPostView(contentElement, {
        afterSubmit(newCommit) {
          buildWaiting.checkForCommit(newCommit);
        }
      });

      edit.insertBefore(contentElement);
      contentElement.before(buildWaiting.el);

      buildWaiting.checkForCommit(window.github_data.build_revision);
    }
  },
});
