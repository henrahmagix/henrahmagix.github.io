import { Admin } from '/admin/admin.js';
import { createHTML, base64 } from '/admin/utils.js';

const contentWrapper = document.getElementById('content');
let originalContent = contentWrapper.innerHTML;

class PostFile {
  constructor({
    path,
  }) {
    this.path = path;
    this.api = window.admin.api;
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

class EditPost {
  constructor() {
    this.el = createHTML(`
    <div class="edit-wrapper">
      <button class="button-link edit-toggle"><i class="icon fas"></i>Text</button>
      <button hidden class="button-link edit-preview"><i class="icon fas fa-eye"></i>Preview</button>
      <button class="button-link edit-submit"><i class="icon fas fa-check"></i>Submit</button>
    </div>
    `);

    this.textarea = createHTML('<textarea class="edit-textarea">');

    this.toggleButton = this.el.children.item(0);
    this.iconEl = this.toggleButton.childNodes.item(0);
    this.textEl = this.toggleButton.childNodes.item(1);

    this.previewButton = this.el.children.item(1);
    this.submitButton = this.el.children.item(2);

    this.toggleButton.onclick = () => this.onclick();
    // this.previewButton.onclick = () => this.onpreview();
    this.submitButton.onclick = () => {
      if (!this.reviewing) {
        this.reviewing = true;
        this.onreview();
      } else {
        this.onsubmit();
      }
    }

    this.texts = ['Edit', 'Cancel'];
    this.iconClasses = ['fa-pencil-alt', 'fa-times'];

    this.editing = false;

    this.titleEl.onkeyup = this.titleEl.onkeydown = this.subtitleEl.onkeyup = this.subtitleEl.onkeydown = event => {
      if (event.code === 'Enter') {
        event.preventDefault();
      }
    };

    this.postFile = new PostFile(window.github_data.page_path);
    this.readyPromise = this.postFile.fetch();
  }

  get titleEl() { return contentWrapper.querySelector('.entry-title'); }
  get subtitleEl() { return contentWrapper.querySelector('.entry-summary'); }
  get contentEl() { return contentWrapper.querySelector('.entry-content'); }

  onclick() {
    this.reviewing = false;
    if (this.editing) {
      contentWrapper.innerHTML = originalContent;
      this.editing = false;
    } else {
      this.editing = true;
    }
  }

  onreview() {
    if (this.titleEl) {
      this.postFile.setTitle(this.titleEl.innerText);
    }
    if (this.subtitleEl) {
      this.postFile.setSubtitle(this.subtitleEl.innerText);
    }
    this.postFile.setContent(this.contentEl.innerText);

    this.diffEl = this.postFile.diff();
    if (this.diffEl) {
      contentWrapper.before(this.diffEl);
    } else {
      alert('No changes');
      this.toggleButton.click();
    }
  }

  onsubmit() {
    this.postFile.save()
      .then(() => {
        alert('TODO: wait for build then refresh');
        this.reviewing = false;
        this.contentEl.innerHTML = marked(this.contentEl.innerText);
        this.diffEl.remove();
        this.editing = false;
      });
  }

  // onpreview() {
  //   this.contentEl.innerHTML = window.marked(this.contentEl.innerText);
  // }

  insertBefore(target) {
    this.readyPromise.then(() => {
      target.before(this.el);
    });
  }

  get editing() { return this._editing; }
  set editing(isEditing) {
    isEditing = Boolean(isEditing);
    this._editing = isEditing;

    this.titleEl.contentEditable = isEditing;
    this.subtitleEl.contentEditable = isEditing;
    this.contentEl.contentEditable = isEditing;

    this.submitButton.hidden = !isEditing;
    // this.previewButton.hidden = !isEditing;

    if (isEditing) {
      this.textEl.data = this.texts[1];
      this.iconEl.classList.remove(this.iconClasses[0]);
      this.iconEl.classList.add(this.iconClasses[1]);

      this.contentEl.innerText = this.postFile.contents;
      this.contentEl.style.whiteSpace = 'pre-wrap';

      document.execCommand('defaultParagraphSeparator', false, 'p');
    } else {
      this.textEl.data = this.texts[0];
      this.iconEl.classList.remove(this.iconClasses[1]);
      this.iconEl.classList.add(this.iconClasses[0]);

      this.contentEl.style.whiteSpace = '';
      originalContent = contentWrapper.innerHTML;
    }
  }
}

window.admin = new Admin({ handleLogin });
const edit = new EditPost();

function handleLogin(loggedIn) {
  if (loggedIn) {
    edit.insertBefore(content);
  }
}
