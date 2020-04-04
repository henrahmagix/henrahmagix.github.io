import { Admin } from '/admin/admin.js';
import { createHTML } from '/admin/utils.js';

const content = document.getElementById('content');
const originalContent = content.innerHTML;

class EditPost {
  constructor() {
    this.el = createHTML('<a href="#"><i class="icon fas"></i>Text</a>');
    this.icon = this.el.childNodes.item(0);
    this.text = this.el.childNodes.item(1);

    this.el.onclick = () => this.click();

    this.texts = ['Edit', 'Cancel'];
    this.iconClasses = ['fa-pencil-alt', 'fa-times'];

    this.editing = false;
  }

  click() {
    this.editing = !this.editing;
    if (!this.editing) {
      // Cancelling.
      content.innerHTML = originalContent;
    }
  }

  insertBefore(target) {
    target.before(this.el);
  }

  get editing() { return this._editing; }
  set editing(isEditing) {
    this._editing = Boolean(isEditing);

    content.contentEditable = this._editing;

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
