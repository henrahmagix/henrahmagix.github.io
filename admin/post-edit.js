import { Admin } from '/admin/admin.js';
import { createHTML } from '/admin/utils.js';

const content = document.getElementById('content');
const originalContent = content.innerHTML;

class EditPost {
  constructor() {
    this.el = createHTML(`
    <div class="edit-wrapper">
      <a href="#" class="edit-toggle"><i class="icon fas"></i>Text</a>
      <a href="#" class="edit-submit"><i class="icon fas fa-check"></i>Submit</a>
    </div>
    `);

    this.toggle = this.el.children.item(0);
    this.icon = this.toggle.childNodes.item(0);
    this.text = this.toggle.childNodes.item(1);

    this.submit = this.el.children.item(1);

    this.toggle.onclick = () => this.onclick();
    this.submit.onclick = () => this.onsubmit();

    this.texts = ['Edit', 'Cancel'];
    this.iconClasses = ['fa-pencil-alt', 'fa-times'];

    this.editing = false;
  }

  onclick() {
    this.editing = !this.editing;
    if (!this.editing) {
      // Cancelling.
      content.innerHTML = originalContent;
    }
  }

  onsubmit() {
    console.log('submit');
  }

  insertBefore(target) {
    target.before(this.el);
  }

  get editing() { return this._editing; }
  set editing(isEditing) {
    isEditing = Boolean(isEditing);
    this._editing = isEditing;

    content.contentEditable = isEditing;
    this.submit.hidden = !isEditing;

    if (isEditing) {
      this.text.data = this.texts[1];
      this.icon.classList.remove(this.iconClasses[0]);
      this.icon.classList.add(this.iconClasses[1]);
    } else {
      this.text.data = this.texts[0];
      this.icon.classList.remove(this.iconClasses[1]);
      this.icon.classList.add(this.iconClasses[0]);
    }
  }
}

const edit = new EditPost();

window.admin = new Admin({
  handleLogin: (loggedIn) => {
    if (loggedIn) {
      edit.insertBefore(content);
    }
  }
});
