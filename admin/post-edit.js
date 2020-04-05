import { Admin } from '/admin/admin.js';
import { createHTML, base64 } from '/admin/utils.js';

const contentWrapper = document.getElementById('content');
const originalContent = content.innerHTML;

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

  async save() {
    const newContent = this.frontMatter + '\n' + this.contents.replace(/\n+$/, '\n');
    // console.log(newContent);
    base64.encode(newContent); // for update call

    const base = difflib.stringAsLines(base64.decode(this.data.content));
    const newtxt = difflib.stringAsLines(newContent);
    const diff = new difflib.SequenceMatcher(base, newtxt);
    document.querySelectorAll('table.diff').forEach(el => el.remove());
    const opcodes = diff.get_opcodes();
    const hasDiff = opcodes.length > 1 || (opcodes[0] && opcodes[0][0] !== 'equal');

    if (hasDiff) {
      const diffEl = diffview.buildView({
        baseTextLines: base,
        newTextLines: newtxt,
        opcodes: opcodes,
        baseTextName: 'base',
        newTextName: 'new',
        contextSize: 3,
        viewType: 1, // inline
      });
      document.body.appendChild(diffEl);
      alert('TODO: submit after review');
      diffEl.scrollIntoView();
      return true;
    } else {
      return false;
    }
  }

  async fetch() {
    this.data = await this.api.fetch(`/contents/${window.github_data.page_path}`);

    this.frontMatter = [];
    this.contents = [];

    let frontMatterMatches = 0;
    base64.decode(this.data.content).split('\n').forEach(line => {
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
    this.submitButton.onclick = () => this.onsubmit();

    this.texts = ['Edit', 'Cancel'];
    this.iconClasses = ['fa-pencil-alt', 'fa-times'];

    this.editing = false;

    this.postFile = new PostFile(window.github_data.page_path);
    this.readyPromise = this.postFile.fetch();
  }

  get titleEl() { return content.querySelector('.entry-title'); }
  get subtitleEl() { return content.querySelector('.entry-summary'); }
  get contentEl() { return content.querySelector('.entry-content'); }

  onclick() {
    this.editing = !this.editing;
    if (this.editing) {
      this.contentEl.innerText = this.postFile.contents;
      this.contentEl.style.whiteSpace = 'pre-wrap';
    } else {
      // Cancelling.
      content.innerHTML = originalContent;
      this.contentEl.style.whiteSpace = '';
    }
  }

  onsubmit() {
    if (this.titleEl) {
      this.postFile.setTitle(this.titleEl.innerText);
    }
    if (this.subtitleEl) {
      this.postFile.setSubtitle(this.subtitleEl.innerText);
    }
    const newContent = this.contentEl.innerText;
    this.postFile.setContent(newContent);

    this.postFile.save()
      .then(success => {
        if (success) {
          alert('TODO: wait for build then refresh');
          // And render markdown into html.
        } else {
          alert('No changes');
          this.editing = false;
        }
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
    if (isEditing) {
      document.execCommand('defaultParagraphSeparator', false, 'p');

      this.titleEl.onkeyup = this.titleEl.onkeydown = this.subtitleEl.onkeyup = this.subtitleEl.onkeydown = event => {
        if (event.code === 'Enter') {
          event.preventDefault();
        }
      };
    }

    this.submitButton.hidden = !isEditing;
    // this.previewButton.hidden = !isEditing;

    if (isEditing) {
      this.textEl.data = this.texts[1];
      this.iconEl.classList.remove(this.iconClasses[0]);
      this.iconEl.classList.add(this.iconClasses[1]);
    } else {
      this.textEl.data = this.texts[0];
      this.iconEl.classList.remove(this.iconClasses[1]);
      this.iconEl.classList.add(this.iconClasses[0]);
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
