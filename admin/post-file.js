import { Api } from '/admin/admin.js';
import { base64 } from '/admin/utils.js';

export class PostFile {
  constructor({
    path,
  }) {
    this.path = path;
    this.storageKey = `gh_post_${path}`;
    this.api = new Api();

    window.onbeforeunload = event => {
      if (this.diff()) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
  }

  rTitle = /(\ntitle: )([^\n]*)/;
  getTitle() {
    const m = this.frontMatter.match(this.rTitle);
    return m ? m[2] : '';
  }
  setTitle(s) {
    this.frontMatter = this.frontMatter.replace(this.rTitle, (_, m1, m2) => m1 + s);
    this.onchange();
  }

  rSubtitle = /(\nsubtitle: )([^\n]*)/;
  getSubtitle() {
    const m = this.frontMatter.match(this.rSubtitle);
    return m ? m[2] : '';
  }
  setSubtitle(s) {
    this.frontMatter = this.frontMatter.replace(this.rSubtitle, (_, m1, m2) => m1 + s);
    this.onchange();
  }

  getContent() {
    return this.contents;
  }
  setContent(s) {
    this.contents = s;
    this.onchange();
  }

  onchange() {
    localStorage.setItem(this.storageKey, base64.encode(this.newContent));
  }

  async fetch() {
    this.data = await this.api.fetch(`/contents/${this.path}`);
    this.oldContent = base64.decode(this.data.content);

    let lines = this.oldContent.split('\n');

    let existingContent = localStorage.getItem(this.storageKey);
    if (existingContent) {
      existingContent = base64.decode(existingContent);
      if (existingContent !== this.oldContent) {
        if (confirm('Keep local changes?')) {
          lines = existingContent.split('\n');
        }
      }
    }

    const frontMatterLines = [];
    const contentsLines = [];

    let frontMatterMatches = 0;
    lines.forEach(line => {
      if (frontMatterMatches < 2) {
        frontMatterLines.push(line);
      } else {
        contentsLines.push(line);
      }
      if (line.match(/---+/)) {
        frontMatterMatches++;
      }
    });

    this.frontMatter = frontMatterLines.join('\n');
    this.contents = contentsLines.join('\n');
  }

  get newContent() {
    return this.frontMatter + '\n' + this.contents.replace(/\n+$/, '\n');
  }

  async save() {
    base64.encode(this.newContent); // for update call
    alert('TODO: commit to github');
    this.oldContent = this.newContent;
    localStorage.removeItem(this.storageKey);
  }

  diff() {
    const base = difflib.stringAsLines(this.oldContent);
    const newtxt = difflib.stringAsLines(this.newContent);
    const diff = new difflib.SequenceMatcher(base, newtxt);
    document.querySelectorAll('table.diff').forEach(el => el.remove());
    const opcodes = diff.get_opcodes();
    const hasDiff = opcodes.length > 1 || (opcodes[0] && opcodes[0][0] !== 'equal');

    if (!hasDiff) {
      return false;
    }

    return diffview.buildView({
      baseTextLines: base,
      newTextLines: newtxt,
      opcodes: opcodes,
      baseTextName: 'base',
      newTextName: 'new',
      contextSize: 3,
      viewType: 1, // inline
    });
  }
}
