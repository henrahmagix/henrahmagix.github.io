import { Admin } from '/admin/admin.js';
import { EditPostView } from '/admin/post-edit.js';
import { PageBuildStatus } from '/admin/page-builds.js';
import { show } from '/admin/utils.js';

const contentElement = document.getElementById('content');

const admin = new Admin({
  handleLogin: async (loggedIn) => {
    if (loggedIn) {
      const buildWaiting = new PageBuildStatus();

      const filepath = new URLSearchParams(location.search).get('filepath') || window.github_data.page_path;

      const edit = new EditPostView(contentElement, {
        filepath,
        afterCommit: async (newCommit) => {
          checkPageStatus(newCommit);
          changeURLFilepath(edit.postFile.filepath);
        },
        afterPublish: async (publishedPath) => {
          changeURLFilepath(publishedPath);
        },
      });

      // First check if any editing should be shown.
      await checkPageStatus(window.github_data.build_revision);

      edit.insertBefore(contentElement);
      contentElement.before(buildWaiting.el);

      async function checkPageStatus(commit) {
        const pageOutOfDate = window.github_data.production && await buildWaiting.checkForCommit(commit);
        show(buildWaiting.el, pageOutOfDate);
        show(edit.el, !pageOutOfDate);
      }

      function changeURLFilepath(path) {
        if (!location.pathname.includes('admin/edit')) {
          return;
        }

        const url = new URL(location);
        url.searchParams.set('filepath', path);
        window.history.replaceState(null, null, url);
      }
    }
  },
});
