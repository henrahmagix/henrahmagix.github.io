import { PostFile } from '/admin/post-file.js';
import { createHTML, show, State } from '/admin/utils.js';

export class EditPostView {
  get editButton() { return this.el.querySelector('.button-edit'); }
  get cancelButton() { return this.el.querySelector('.button-cancel'); }
  get reviewButton() { return this.el.querySelector('.button-review'); }
  get submitButton() { return this.el.querySelector('.button-submit'); }
  get spinnerEl() { return this.el.querySelector('.spinner'); }
  get viewForm() { return this.el.querySelector('form[name="view"]'); }

  get titleEl() { return this.contentWrapper.querySelector('.entry-title'); }
  get subtitleEl() { return this.contentWrapper.querySelector('.entry-summary'); }
  get contentEl() { return this.contentWrapper.querySelector('.entry-content'); }

  get viewStyle() {
    return new FormData(this.viewForm).get('style');
  }

  constructor(
    contentWrapper,
    {
      afterSubmit,
    }
  ) {
    this.afterSubmit = afterSubmit;

    function buttonHTML({text, type, classname, icon}) {
      type = type || 'button';
      return `<button type="${type}" class="${classname}"><i class="icon ${icon}"></i>${text}</button>`;
    }
    this.el = createHTML(`
      <div class="edit-wrapper">
        ${buttonHTML({text: 'Edit', classname: 'button-edit', icon: 'fas fa-pencil-alt'})}
        ${buttonHTML({text: 'Cancel', classname: 'button-cancel', icon: 'fas fa-times'})}
        ${buttonHTML({text: 'Submit', type: 'submit', classname: 'button-submit', icon: 'fas fa-check'})}
        <span class="spinner"><i hidden class="fas fa-spinner fa-pulse"></i></span>

        <form hidden name="view" class="view-wrapper" onsubmit="return false;">
          View:
          <label>
            <input type="radio" name="style" value="write" checked>
            <span>Write</span>
          </label>
          |
          <label>
            <input type="radio" name="style" value="preview">
            <span>Preview</span>
          </label>
          |
          <label>
            <input type="radio" name="style" value="diff">
            <span>Diff</span>
          </label>
        </form>
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
    this.submitButton.addEventListener('click', () => this.clickSubmit());

    this.viewForm.addEventListener('change', () => this.render());

    [this.titleEl, this.subtitleEl].forEach(el => {
      if (!el) {
        return;
      }
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
  clickSubmit() {
    this.state.moveToSubmitting();
    this.submitPost().then(() => {
      if (typeof this.afterSubmit === 'function') {
        this.afterSubmit(this.postFile.commit);
      }
    });
  }

  render() {
    const submitting = this.state.submitting;
    const editing = this.state.editing && !submitting;
    const writing = editing && this.viewStyle === 'write';

    this.titleEl.contentEditable =
      this.subtitleEl.contentEditable =
      this.contentEl.contentEditable =
      writing;
    // When contenteditable changes, run execCommands to work on the editable areas.
    document.execCommand('defaultParagraphSeparator', false, 'p');

    show(this.editButton, !editing && !submitting);
    show(this.cancelButton, editing);
    show(this.submitButton, editing);
    show(this.spinnerEl, submitting);
    show(this.viewForm, editing);

    if (this.viewStyle === 'diff') {
      this.diffEl = this.postFile.diff();
      this.contentWrapper.before(this.diffEl);
    } else if (this.diffEl) {
      this.diffEl.remove();
    }

    if (this.titleEl) {
      this.titleEl.innerText = this.postFile.getTitle();
    }
    if (this.subtitleEl) {
      this.subtitleEl.innerText = this.postFile.getSubtitle();
    }

    if (writing) {
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
    this._state = new State('view', 'edit', 'submitting');
  }

  get editing() {
    return this._state.is('edit');
  }
  get submitting() {
    return this._state.is('submitting');
  }

  addChangeListener(fn) {
    this._state.addChangeListener(fn);
  }

  reset() {
    this._state.moveTo('view');
  }

  moveToEdit() {
    this._state.moveTo('edit');
  }

  moveToSubmitting() {
    this._state.moveTo('submitting');
  }
}
