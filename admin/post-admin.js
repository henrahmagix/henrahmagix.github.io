import { Admin } from '/admin/admin.js';
import { EditPostView } from '/admin/post-edit.js';
import { PageBuildStatus } from '/admin/page-builds.js';

const contentElement = document.getElementById('content');

const admin = new Admin({
  handleLogin(loggedIn) {
    if (loggedIn) {
      const buildWaiting = new PageBuildStatus();

      const edit = new EditPostView(contentElement, {
        filepath: new URLSearchParams(location.search).get('filepath') || window.github_data.page_path,
        afterCommit(newCommit) {
          buildWaiting.checkForCommit(newCommit);
          if (location.pathname.includes('admin/edit')) {
            const url = new URL(location);
            url.searchParams.set('filename', edit.postFile.filepath);
            window.history.replaceState(null, null, url);
          }
        }
      });

      edit.insertBefore(contentElement);
      contentElement.before(buildWaiting.el);

      buildWaiting.checkForCommit(window.github_data.build_revision);
    }
  },
});
