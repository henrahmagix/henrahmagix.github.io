import { EditPostView } from './post-edit.js';
import { Admin } from './admin.js';
import { PageBuildStatus } from './page-builds.js';
import { show, createHTML } from './utils.js';
import { PostFile } from './post-file.js';

addStyle('/admin/admin.css');

export async function addPostAdmin({
  contentElement,
  markdownRenderer,
  diffBuilder,
  currentCommit,
  filepath,
  env,
}) {
  // Allow overriding jekyll filepath with query param exists.
  filepath = new URLSearchParams(location.search).get('filepath') || filepath;

  const lib = await setupLib();

  new Admin({
    handleLogin: async (loggedIn) => {
      if (!loggedIn) {
        return;
      }

      const buildWaiting = new PageBuildStatus();

      const postFile = new PostFile({
        filepath,
        diffBuilder: lib.diffBuilder,
      });

      const editView = new EditPostView(contentElement, {
        markdownRenderer: lib.markdownRenderer,
        afterCommit: async (newCommit) => {
          checkPageStatus(newCommit);
          changeURLFilepath(editView.postFile.filepath);
        },
        afterPublish: async (publishedPath) => {
          changeURLFilepath(publishedPath);
        },
      });

      // First check if any editing should be shown.
      await checkPageStatus(currentCommit);

      // Render when file is ready.
      await postFile.fetch();
      editView.setFile(postFile);
      contentElement.before(editView.el);
      contentElement.before(buildWaiting.el);

      async function checkPageStatus(commit) {
        const pageOutOfDate = env.production && await buildWaiting.checkForCommit(commit);
        show(buildWaiting.el, pageOutOfDate);
        show(editView.el, !pageOutOfDate);
      }

      function changeURLFilepath(path) {
        if (!window.location.pathname.includes('admin/edit')) {
          return;
        }

        const url = new URL(window.location.href);
        url.searchParams.set('filepath', path);
        window.history.replaceState(null, null, url.toString());
      }
    },
  });
}

async function setupLib() {
  await addScript('https://cdn.jsdelivr.net/npm/marked/marked.min.js');

  window.marked.setOptions({
    gfm: true // github-flavoured markdown
  });
  const markdownRenderer = {
    markdownToHTML: function (md) {
      return window.marked(md);
    },
  };

  addStyle('https://cemerick.github.io/jsdifflib/diffview.css');
  await addScript('https://cemerick.github.io/jsdifflib/diffview.js');
  await addScript('https://cemerick.github.io/jsdifflib/difflib.js');

  const diffBuilder = {
    buildView(baseName, baseString, newName, newString) {
      const baseLines = window.difflib.stringAsLines(baseString);
      const newLines = window.difflib.stringAsLines(newString);

      const diff = new window.difflib.SequenceMatcher(baseLines, newLines);
      const opcodes = diff.get_opcodes();

      const hasDiff = opcodes.length > 1 || (opcodes[0] && opcodes[0][0] !== 'equal');
      if (!hasDiff) {
        return createHTML('<p>No changes</p>');
      }

      return window.diffview.buildView({
        baseTextLines: baseLines,
        newTextLines: newLines,
        opcodes,
        baseTextName: baseName,
        newTextName: newName,
        contextSize: 3,
        viewType: 1, // inline
      });
    },
  };

  return {
    markdownRenderer,
    diffBuilder,
  };
}

async function addScript(src, type) {
  const script = document.createElement('script');
  script.src = src;
  script.async = false;
  if (type) {
    script.type = type;
  }
  const onload = resourcePromise(script);
  document.body.appendChild(script);
  return onload;
}

async function addStyle(href) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  const onload = resourcePromise(link);
  document.head.appendChild(link);
  return onload;
}

function resourcePromise(el) {
  return new Promise((resolve, reject) => {
    el.onload = resolve;
    el.onerror = reject;
  });
}
