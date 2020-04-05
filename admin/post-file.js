import { Api } from '/admin/admin.js';
import { base64 } from '/admin/utils.js';

export class PostFile {
  constructor({
    path,
  }) {
    this.path = path;
    this.api = new Api();
  }

  setTitle(s) {
    this.frontMatter = this.frontMatter.replace(
      /\ntitle: [^\n]*/,
      `\ntitle: ${s}`,
    );
  }

  setSubtitle(s) {
    this.frontMatter = this.frontMatter.replace(
      /\nsubtitle: [^\n]*/,
      `\nsubtitle: ${s}`,
    );
  }

  setContent(s) {
    this.contents = s;
  }

  async fetch() {
    this.data = await this.api.fetch(`/contents/${window.github_data.page_path}`);
    this.oldContent = base64.decode(this.data.content);

    this.frontMatter = [];
    this.contents = [];

    let frontMatterMatches = 0;
    this.oldContent.split('\n').forEach(line => {
      if (frontMatterMatches < 2) {
        this.frontMatter.push(line);
      } else {
        this.contents.push(line);
      }
      if (line.match(/---+/)) {
        frontMatterMatches++;
      }
    });

    this.frontMatter = this.frontMatter.join('\n');
    this.contents = this.contents.join('\n');
  }

  get newContent() {
    return this.frontMatter + '\n' + this.contents.replace(/\n+$/, '\n');
  }

  async save() {
    base64.encode(this.newContent); // for update call
    alert('TODO: commit to github');
    this.oldContent = this.newContent;
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
