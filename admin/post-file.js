import { Api } from './admin.js';
import { base64, slugify } from './utils.js';
import { yaml, buildDiffView } from './lib.js';

export class PostFile {
  /**
   * @param {object} opts
   * @param {string} opts.filepath
   */
  constructor({
    filepath,
  }) {
    this.filepath = filepath;
    this.lastCommit = '';

    /**
     * @private
     * @type {post.frontmatter}
     */
    this._postFrontMatter = {title: '', subtitle: '', syndications: {}};
    /** @private */
    this.postContent = '';

    this.isNew = filepath === 'admin/edit.html';
    /** @private */
    this.storageKey = `gh_post_${this.isNew ? 'new' : filepath}`;
    /** @private */
    this.api = new Api();
  }

  /** @private */
  get postFrontMatter() {
    const val = this._postFrontMatter;
    let yamlString = '';
    if (val != null && JSON.stringify(val) !== '{}') {
      yamlString = yaml.jsToYaml(val).trim();
    }
    return '---\n' + yamlString + '\n---';
  }
  /** @private */
  set postFrontMatter(s) {
    this._postFrontMatter = yaml.yamlToJS(s)[0] || {};
  }

  /** @param {string} name */
  hasSyndication(name) {
    if (!this._postFrontMatter.syndications) {
      return false;
    }
    return this._postFrontMatter.syndications.hasOwnProperty(name);
  }
  /**
   * @param {string} name
   * @param {string} value
   */
  setSyndication(name, value) {
    if (!this._postFrontMatter.syndications) {
      this._postFrontMatter.syndications = {};
    }
    this._postFrontMatter.syndications[name] = value;
  }

  /** @param {string} attr */
  get(attr) {
    if (attr === 'content') {
      return this.postContent || '';
    }
    return this._postFrontMatter[attr] || '';
  }
  /**
   * @param {string} attr
   * @param {string} s
   */
  set(attr, s) {
    s = s.trim();
    if (attr === 'content') {
      this.postContent = s;
    } else {
      this._postFrontMatter[attr] = s;
    }
    this.onChange();
  }

  getRaw() {
    return this.newContent;
  }
  /** @param {string} s */
  setRaw(s) {
    this.buildContent(s);
    this.onChange();
  }

  /** @private */
  onChange() {
    localStorage.setItem(this.storageKey, base64.encode(this.newContent));
  }

  /** @private */
  clearStorage() {
    localStorage.removeItem(this.storageKey);
  }

  async fetch() {
    /** @type {github.GetContentFileResponse} */
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

  /**
   * @private
   * @param {string} content
   */
  buildContent(content) {
    /** @type {string[]} */
    const frontMatterLines = [];
    /** @type {string[]} */
    const contentsLines = [];

    let frontMatterMatches = 0;
    content.split('\n').forEach((line, i) => {
      if (i === 0 && line.match(/---+/)) {
        frontMatterLines.push(line);
      } else if (frontMatterMatches > 0 && frontMatterMatches < 2) {
        frontMatterLines.push(line);
      } else {
        contentsLines.push(line);
      }
      if (line.match(/---+/)) {
        frontMatterMatches++;
      }
    });

    this.postFrontMatter = frontMatterLines.join('\n').trim();
    this.postContent = contentsLines.join('\n').trim();
  }

  get originalContent() {
    return base64.decode(this.content);
  }

  get newContent() {
    const frontMatter = this.postFrontMatter.trim() + '\n';
    const content = this.postContent.trim();

    if (!content) {
      return frontMatter;
    }
    return frontMatter + '\n' + content + '\n';
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
    /** @type {github.PutContentFileResponse} */
    const res = await this.api.makeRequest(`/contents/${this.filepath}`, {
      method: 'PUT',
      body: JSON.stringify({
        message: `Edit ${this.filepath}`,
        content,
        sha: this.sha,
        branch: 'master',
      }),
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

    const filename = this.filepath.replace('_drafts/', '');
    const ymd = new Date().toISOString().split('T')[0];
    const newFilename = `${ymd}-${filename}`;

    return this.moveFolder('Publish',
      '_drafts', filename,
      '_posts', newFilename,
    );
  }

  async unpublish() {
    if (this.isNew || this.isDraft) {
      throw new Error('Cannot unpublish draft post: must be published post');
    }

    const filename = this.filepath.replace('_posts/', '');
    const newFilename = filename.replace(/\d{4}-\d{2}-\d{2}-/, '');

    return this.moveFolder('Unpublish',
      '_posts', filename,
      '_drafts', newFilename,
    );
  }

  /**
   * @private
   * @param {string} message
   * @param {string} srcFolder
   * @param {string} srcFile
   * @param {string} dstFolder
   * @param {string} dstFile
   */
  async moveFolder(message, srcFolder, srcFile, dstFolder, dstFile) {
    // Get tree for this file.
    /** @type {github.GetBranchResponse} */
    const rootBranch = await this.api.makeRequest(`/branches/master`);
    /** @type {github.GetTreeResponse} */
    const rootTree = await this.api.makeRequest(`/git/trees/${rootBranch.commit.sha}`);

    /** @type {github.GetTreeResponse} */
    const srcTree = await this.api.makeRequest(`/git/trees/${rootTree.tree.find(t=>t.path === srcFolder).sha}`);
    /** @type {github.GetTreeResponse} */
    const dstTree = await this.api.makeRequest(`/git/trees/${rootTree.tree.find(t=>t.path === dstFolder).sha}`);

    const file = srcTree.tree.find(t => t.path === srcFile);

    if (!file) {
      throw new Error(`Cannot find tree blob for ${this.filepath}`);
    }

    // Create new trees:
    // - src without file
    // - dst with renamed file
    // - root with changed src and dst
    /**
     * @param {github.PostTreeRequest} request
     * @returns {Promise<github.PostTreeResponse>}
    */
    const postTree = async ({base_tree, tree}) => {
      return await this.api.makeRequest(`/git/trees?recursive=1`, {
        method: 'POST',
        // body: { base_tree, tree },
        // Don't include base_tree, else files cannot be deleted.
        body: JSON.stringify({ tree }),
      });
    }
    const newSrcTree = await postTree({
      base_tree: srcTree.sha,
      tree: srcTree.tree.filter(t => t.path !== srcFile),
    });
    const newDstTree = await postTree({
      base_tree: dstTree.sha,
      tree: [
        ...dstTree.tree,
        { ...file, path: dstFile },
      ]
    });
    const newRootTree = await postTree({
      base_tree: rootTree.sha,
      tree: rootTree.tree.map(t => {
        if (t.path === srcFolder) {
          return { ...t, sha: newSrcTree.sha };
        }
        if (t.path === dstFolder) {
          return { ...t, sha: newDstTree.sha };
        }
        return t;
      }),
    });

    // Commit:
    // - make a commit on the branch pointing to the new root tree
    // - point the branch to the commit
    /** @type {github.PostCommitRequest} */
    const commitBody = {
      message: `${message} ${dstFile}`,
      tree: newRootTree.sha,
      parents: [rootBranch.commit.sha],
    };
    const commit = await this.api.makeRequest(`/git/commits`, {
      method: 'POST',
      body: JSON.stringify(commitBody),
    });

    /** @type {github.PatchRefsHeadsRequest} */
    const refHeadBody = {
      sha: commit.sha,
    };
    await this.api.makeRequest(`/git/refs/heads/${rootBranch.name}`, {
      method: 'PATCH',
      body: JSON.stringify(refHeadBody),
    });

    this.filepath = `${dstFolder}/${dstFile}`;
  }

  diff() {
    return buildDiffView(
      'base', this.originalContent,
      'new', this.newContent,
    );
  }
}
