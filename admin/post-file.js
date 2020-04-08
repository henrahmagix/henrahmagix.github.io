import { Api } from '/admin/admin.js';
import { base64, createHTML, slugify } from '/admin/utils.js';

export class PostFile {
  constructor({
    filepath,
  }) {
    this.isNew = filepath.includes('admin/edit');
    this.filepath = filepath;
    this.storageKey = `gh_post_${this.isNew ? 'new' : filepath}`;
    this.api = new Api();

    this.rTitle = /(\ntitle:) *([^\n]*)/;
    this.rSubtitle = /(\nsubtitle:) *([^\n]*)/;
  }

  getTitle() {
    const m = this.postFrontMatter.match(this.rTitle);
    return m ? m[2] : '';
  }
  setTitle(s) {
    this.postFrontMatter = this.postFrontMatter.replace(this.rTitle, (_, m1, m2) => `${m1} ${s}`);
    this.onChange();
  }

  getSubtitle() {
    const m = this.postFrontMatter.match(this.rSubtitle);
    return m ? m[2] : '';
  }
  setSubtitle(s) {
    this.postFrontMatter = this.postFrontMatter.replace(this.rSubtitle, (_, m1, m2) => `${m1} ${s}`);
    this.onChange();
  }

  getContent() {
    return this.postContent;
  }
  setContent(s) {
    this.postContent = s;
    this.onChange();
  }

  onChange() {
    localStorage.setItem(this.storageKey, base64.encode(this.newContent));
  }

  clearStorage() {
    localStorage.removeItem(this.storageKey);
  }

  async fetch() {
    const res = await this.api.makeRequest(`/contents/${this.filepath}?ref=master`);
    this.content = res.content;
    this.sha = res.sha;

    const existingContentStore = localStorage.getItem(this.storageKey);
    if (existingContentStore) {
      const existingContent = base64.decode(existingContentStore);
      if (existingContent !== this.originalContent) {
        if (confirm('Keep local changes?')) {
          this.hasLocalChanges = true;
          this.buildContent(existingContent);
          return;
        }
      }
    }

    this.buildContent(this.originalContent);
    this.clearStorage();
  }

  buildContent(content) {
    const frontMatterLines = [];
    const contentsLines = [];

    let frontMatterMatches = 0;
    content.split('\n').forEach(line => {
      if (frontMatterMatches < 2) {
        frontMatterLines.push(line);
      } else {
        contentsLines.push(line);
      }
      if (line.match(/---+/)) {
        frontMatterMatches++;
      }
    });

    this.postFrontMatter = frontMatterLines.join('\n');
    this.postContent = contentsLines.join('\n');
  }

  get originalContent() {
    return base64.decode(this.content);
  }

  get newContent() {
    return this.postFrontMatter + '\n' + this.postContent.replace(/\n+$/, '\n'); // trim trailing newlines
  }

  reset() {
    this.buildContent(this.originalContent);
    this.clearStorage();
  }

  hasChanges() {
    return this.newContent !== this.originalContent;
  }

  get isDraft() {
    return /^_drafts\//.test(this.filepath);
  }

  async commit() {
    if (!this.getTitle()) {
      throw new Error('Post must have a title');
    }

    if (this.isNew) {
      const name = slugify(this.getTitle());
      this.filepath = `_drafts/${name}.md`;
    }

    const content = base64.encode(this.newContent);
    const res = await this.api.makeRequest(`/contents/${this.filepath}`, {
      method: 'PUT',
      body: {
        message: `Edit ${this.filepath}`,
        content,
        sha: this.sha,
        branch: 'master',
      },
    });
    this.content = content;
    this.sha = res.content.sha;
    this.lastCommit = res.commit.sha;

    this.isNew = false;
    this.hasLocalChanges = false;
    this.clearStorage();
  }

  async publish() {
    if (this.isNew || !this.isDraft) {
      throw new Error('Cannot publish new draft or existing post: must be submitted draft');
    }

    // Get tree for this file.
    const rootBranch = await this.api.makeRequest(`/branches/master`);
    const rootTree = await this.api.makeRequest(`/git/trees/${rootBranch.commit.sha}`);

    const draftsTree = await this.api.makeRequest(`/git/trees/${rootTree.tree.find(t=>t.path === '_drafts').sha}`);
    const postsTree = await this.api.makeRequest(`/git/trees/${rootTree.tree.find(t=>t.path === '_posts').sha}`);

    const filename = this.filepath.replace('_drafts/', '');
    console.log('filename', filename);
    const file = draftsTree.tree.find(t => t.path === filename);

    if (!file) {
      // if (rootTree.truncated) {
      //   throw new Error(`TODO: fetch individual trees because recursive was truncated`);
      // }
      throw new Error(`Cannot find tree blog for ${this.filepath}`);
    }

    const ymd = new Date().toISOString().split('T')[0];
    const newFilename = `${ymd}-${filename}`;

    // Create new trees:
    // - _drafts without file
    // - _posts with renamed file
    // - root with changed _drafts and _posts
    const postTree = async (base_tree, tree) => {
      return await this.api.makeRequest(`/git/trees?recursive=1`, {
        method: 'POST',
        // body: { base_tree, tree },
        // Don't include base_tree, else files cannot be deleted.
        body: { tree },
      });
    }
    const newDraftsTree = await postTree(draftsTree.sha,
      draftsTree.tree.filter(t => t.path !== filename),
    );
    const newPostsTree = await postTree(postsTree.sha, [
      ...postsTree.tree,
      { ...file, path: newFilename },
    ]);
    const newRootTree = await postTree(rootTree.sha,
      rootTree.tree.map(t => {
        if (t.path === '_drafts') {
          return { ...t, sha: newDraftsTree.sha };
        }
        if (t.path === '_posts') {
          return { ...t, sha: newPostsTree.sha };
        }
        return t;
      }),
    );

    // Commit:
    // - make a commit on the branch pointing to the new root tree
    // - point the branch to the commit
    const commit = await this.api.makeRequest(`/git/commits`, {
      method: 'POST',
      body: {
        message: `Publish ${newFilename}`,
        tree: newRootTree.sha,
        parents: [rootBranch.commit.sha],
      },
    });
    await this.api.makeRequest(`/git/refs/heads/${rootBranch.name}`, {
      method: 'PATCH',
      body: {
        sha: commit.sha,
      },
    });

    this.filepath = `_posts/${newFilename}`;
  }

  diff() {
    const base = difflib.stringAsLines(this.originalContent);
    const newtxt = difflib.stringAsLines(this.newContent);

    const diff = new difflib.SequenceMatcher(base, newtxt);
    const opcodes = diff.get_opcodes();

    const hasDiff = opcodes.length > 1 || (opcodes[0] && opcodes[0][0] !== 'equal');
    if (!hasDiff) {
      return createHTML('<p>No changes</p>');
    }

    return diffview.buildView({
      baseTextLines: base,
      newTextLines: newtxt,
      opcodes,
      baseTextName: 'base',
      newTextName: 'new',
      contextSize: 3,
      viewType: 1, // inline
    });
  }
}
