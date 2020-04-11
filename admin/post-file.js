import { Api } from './admin.js';
import { base64, slugify, yamlString } from './utils.js';

export class PostFile {
  /**
   * @param {object} opts
   * @param {lib.diffBuilder} opts.diffBuilder
   * @param {lib.yaml} opts.yaml
   * @param {string} opts.filepath
   */
  constructor({
    diffBuilder,
    yaml,
    filepath,
  }) {
    /** @private */
    this.diffBuilder = diffBuilder;
    /** @private */
    this.yaml = yaml;

    /** @type {string} override bug: https://github.com/microsoft/TypeScript/issues/37893 */
    this.filepath = filepath;

    /**
     * @private
     * @type {string} override bug: https://github.com/microsoft/TypeScript/issues/37893
     */
    this.postFrontMatter = '';
    /** @private */
    this.postContent = '';

    this.isNew = filepath === 'admin/edit.html';
    /** @private */
    this.storageKey = `gh_post_${this.isNew ? 'new' : filepath}`;
    /** @private */
    this.api = new Api();
  }

  /**
   * @param {string} key
   * @returns {RegExp}
   */
  rFrontMatter(key) {
    return new RegExp(`\n${key}: *([^\n]*)`);
  }
  /**
   * @param {string} key
   * @returns {string|null}
   */
  getFrontMatterValue(key) {
    const m = this.postFrontMatter.match(this.rFrontMatter(key));
    return m && yamlString.toString(m[1]);
  }
  /**
   * @param {string} key
   * @param {string} s
   * @returns {boolean}
   */
  setFrontMatterValue(key, s) {
    if (this.getFrontMatterValue(key) == null) {
      return false;
    }

    s = yamlString.toYaml(s.trim());
    s = s && ` ${s}`; // separate from yaml colon if non-empty
    this.postFrontMatter = this.postFrontMatter.replace(
      this.rFrontMatter(key),
      `\n${key}:${s}`,
    );
    return true;
  }
  /**
   * @param {string} key
   * @param {string} s
   * @param {object} [opts]
   * @param {string} [opts.before]
   * @param {string} [opts.after]
   */
  addFrontMatterValue(key, s, opts) {
    s = yamlString.toYaml(s.trim());
    s = s && ` ${s}`; // separate from yaml colon if non-empty

    let { before, after } = opts || {};

    const rInsert = new RegExp(before || after || '\n---+$');
    if (!rInsert.test(this.postFrontMatter)) {
      throw new Error(`addFrontMatterValue cannot find line to insert: ${rInsert}`);
    }

    const newLine = `\n${key}:${s}`;
    this.postFrontMatter = this.postFrontMatter.replace(
      rInsert, // must be a RegExp to allow function replacing
      (l) => before ? newLine + l : l + newLine,
    );
  }

  /** @param {string} name */
  hasSyndication(name) {
    /** @type {post.frontmatter} */
    const data = this.yaml.toJS(this.postFrontMatter)[0];
    return data.syndications && data.syndications.hasOwnProperty(name);
  }

  getTitle() {
    return this.getFrontMatterValue('title');
  }
  /** @param {string} s */
  setTitle(s) {
    const isSet = this.setFrontMatterValue('title', s);
    if (!isSet) {
      this.addFrontMatterValue('title', s);
    }
    this.onChange();
  }

  getSubtitle() {
    return this.getFrontMatterValue('subtitle');
  }
  /** @param {string} s */
  setSubtitle(s) {
    const isSet = this.setFrontMatterValue('subtitle', s);
    if (!isSet) {
      this.addFrontMatterValue('subtitle', s, { after: 'title' });
    }
    this.onChange();
  }

  getContent() {
    return this.postContent;
  }
  /** @param {string} s */
  setContent(s) {
    this.postContent = s.trim();
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

    // Get tree for this file.
    /** @type {github.GetBranchResponse} */
    const rootBranch = await this.api.makeRequest(`/branches/master`);
    /** @type {github.GetTreeResponse} */
    const rootTree = await this.api.makeRequest(`/git/trees/${rootBranch.commit.sha}`);

    /** @type {github.GetTreeResponse} */
    const draftsTree = await this.api.makeRequest(`/git/trees/${rootTree.tree.find(t=>t.path === '_drafts').sha}`);
    /** @type {github.GetTreeResponse} */
    const postsTree = await this.api.makeRequest(`/git/trees/${rootTree.tree.find(t=>t.path === '_posts').sha}`);

    const filename = this.filepath.replace('_drafts/', '');
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
    const newDraftsTree = await postTree({
      base_tree: draftsTree.sha,
      tree: draftsTree.tree.filter(t => t.path !== filename),
    });
    const newPostsTree = await postTree({
      base_tree: postsTree.sha,
      tree: [
        ...postsTree.tree,
        { ...file, path: newFilename },
      ]
    });
    const newRootTree = await postTree({
      base_tree: rootTree.sha,
      tree: rootTree.tree.map(t => {
        if (t.path === '_drafts') {
          return { ...t, sha: newDraftsTree.sha };
        }
        if (t.path === '_posts') {
          return { ...t, sha: newPostsTree.sha };
        }
        return t;
      }),
    });

    // Commit:
    // - make a commit on the branch pointing to the new root tree
    // - point the branch to the commit
    /** @type {github.PostCommitRequest} */
    const commitBody = {
      message: `Publish ${newFilename}`,
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

    this.filepath = `_posts/${newFilename}`;
  }

  diff() {
    return this.diffBuilder.buildView(
      'base', this.originalContent,
      'new', this.newContent,
    );
  }
}
