import { PostFile } from '/admin/post-file.js';
import { createHTML, show, showing } from '/admin/utils.js';

export class EditPostView {
  get editButton() { return this.el.querySelector('.button-edit'); }
  get cancelButton() { return this.el.querySelector('.button-cancel'); }
  get reviewButton() { return this.el.querySelector('.button-review'); }
  get submitButton() { return this.el.querySelector('.button-submit'); }

  get titleEl() { return this.contentWrapper.querySelector('.entry-title'); }
  get subtitleEl() { return this.contentWrapper.querySelector('.entry-summary'); }
  get contentEl() { return this.contentWrapper.querySelector('.entry-content'); }

  constructor(
    contentWrapper,
    {
      afterSubmit,
    }
  ) {
    this.afterSubmit = afterSubmit;

    function buttonHTML({text, type, classname, icon}) {
      type = type || 'button';
      return `<button type="${type}" class="button-link ${classname}"><i class="icon ${icon}"></i>${text}</button>`;
    }
    this.el = createHTML(`
      <div class="edit-wrapper">
        ${buttonHTML({text: 'Edit', classname: 'button-edit', icon: 'fas fa-pencil-alt'})}
        ${buttonHTML({text: 'Cancel', classname: 'button-cancel', icon: 'fas fa-times'})}
        ${buttonHTML({text: 'Review', classname: 'button-review', icon: 'fas fa-eye'})}
        ${buttonHTML({text: 'Submit', type: 'submit', classname: 'button-submit', icon: 'fas fa-check'})}
      </div>
    `);
    this.bottomEl = createHTML('<button class="button-link">Back to top</button>')

    this.contentWrapper = contentWrapper;
    this.contentWrapper.addEventListener('input', () => this.updatePost());

    this.state = new EditPostState();
    this.state.addChangeListener(() => this.render());

    this.postFile = new PostFile({
      filepath: window.github_data.page_path,
    });
    this.readyPromise = this.postFile.fetch().then(() => {
      this.render();
    });

    this.bottomEl.addEventListener('click', () => this.el.scrollIntoView());
    this.editButton.addEventListener('click', () => this.clickEdit());
    this.cancelButton.addEventListener('click', () => this.clickCancel());
    this.reviewButton.addEventListener('click', () => this.clickReview());
    this.submitButton.addEventListener('click', () => this.clickSubmit());

    [this.titleEl, this.subtitleEl].forEach(el => {
      el.addEventListener('keyup', preventEnterKey);
      el.addEventListener('keydown', preventEnterKey);
    });
    function preventEnterKey(event) {
      if (event.code === 'Enter') {
        event.preventDefault();
      }
    }

    window.addEventListener('beforeunload', event => {
      if (this.needsReview()) {
        event.preventDefault();
        event.returnValue = '';
      }
    });
  }

  insertBefore(target) {
    this.readyPromise.then(() => {
      target.before(this.el);
      target.after(this.bottomEl);
    });
  }

  markdownToHTML(md) {
    return window.marked(md);
  }

  clickEdit() {
    this.state.moveToEdit();
  }
  clickCancel() {
    if (this.needsReview() && !confirm('You will lose unsaved changes. Are you sure')) {
      return;
    }

    this.reset();
  }
  clickReview() {
    this.state.moveToReview();
    this.showDiff();
  }
  clickSubmit() {
    this.submitPost().then(() => {
      if (typeof this.afterSubmit === 'function') {
        this.afterSubmit(this.postFile.commit);
      }
    });
  }

  renderState() {
    const editing = this.state.editing;
    const reviewing = this.state.reviewing;

    this.titleEl.contentEditable =
      this.subtitleEl.contentEditable =
      this.contentEl.contentEditable =
      editing;
    // When contenteditable changes, run execCommands to work on the editable areas.
    document.execCommand('defaultParagraphSeparator', false, 'p');

    show(this.editButton, !editing);
    show(this.cancelButton, editing);
    show(this.reviewButton, editing && this.needsReview());
    show(this.submitButton, reviewing);
  }

  render() {
    this.renderState();

    if (!this.state.reviewing && this.diffEl) {
      this.diffEl.remove();
    }

    if (this.titleEl) {
      this.titleEl.innerText = this.postFile.getTitle();
    }
    if (this.subtitleEl) {
      this.subtitleEl.innerText = this.postFile.getSubtitle();
    }

    if (this.state.editing) {
      this.contentEl.innerText = this.postFile.getContent();
    } else {
      this.contentEl.innerHTML = this.markdownToHTML(this.postFile.getContent());
    }
  }

  updatePost() {
    if (this.titleEl) {
      this.postFile.setTitle(this.titleEl.innerText);
    }
    if (this.subtitleEl) {
      this.postFile.setSubtitle(this.subtitleEl.innerText);
    }
    this.postFile.setContent(this.contentEl.innerText);

    this.renderState();
  }

  showDiff() {
    this.diffEl = this.postFile.diff();
    this.bottomEl.after(this.diffEl);
    this.bottomEl.scrollIntoView();
  }

  needsReview() {
    return this.postFile.hasChanges();
  }

  reset() {
    this.state.reset();
    this.postFile.reset();
  }

  async submitPost() {
    await this.postFile.commit()
      .then(() => {
        this.state.reset();
      });
  }
}

class EditPostState {
  constructor() {
    this._listeners = [];

    this.reset();
  }

  get editing() {
    return this.state === 'edit';
  }
  get reviewing() {
    return this.state === 'review';
  }

  get state() {
    return this._state;
  }
  set state(s) {
    this._state = s;
    this._callChangeListeners();
  }

  _callChangeListeners() {
    this._listeners.forEach(fn => fn());
  }

  addChangeListener(fn) {
    this._listeners.push(fn);
  }

  reset() {
    this.state = '';
  }

  moveToEdit() {
    this.state = 'edit';
  }

  moveToReview() {
    this.state = 'review';
  }
}
