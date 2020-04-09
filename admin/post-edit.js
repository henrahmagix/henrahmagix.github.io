import { PostFile } from '/admin/post-file.js';
import { createHTML, show, State } from '/admin/utils.js';

export class EditPostView {
  get editButton() { return this.el.querySelector('.button-edit'); }
  get cancelButton() { return this.el.querySelector('.button-cancel'); }
  get reviewButton() { return this.el.querySelector('.button-review'); }
  get submitButton() { return this.el.querySelector('.button-submit'); }
  get publishButton() { return this.el.querySelector('.button-publish'); }
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
      filepath,
      afterCommit,
      afterPublish,
    }
  ) {
    this.afterCommit = afterCommit;
    this.afterPublish = afterPublish;

    function buttonHTML({text, type, classname, icon}) {
      type = type || 'button';
      return `<button type="${type}" class="${classname}"><i class="icon ${icon}"></i>${text}</button>`;
    }
    this.el = createHTML(`
      <div class="edit-wrapper">
        <p><a href="/admin">Back to admin</a></p>

        ${buttonHTML({text: 'Edit', classname: 'button-edit', icon: 'fas fa-pencil-alt'})}
        ${buttonHTML({text: 'Cancel', classname: 'button-cancel', icon: 'fas fa-times'})}
        ${buttonHTML({text: 'Submit', type: 'submit', classname: 'button-submit', icon: 'fas fa-check'})}
        ${buttonHTML({text: 'Publish', classname: 'button-publish', icon: 'fas fa-cloud-upload-alt'})}

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

    this.contentWrapper = contentWrapper;
    this.contentWrapper.addEventListener('input', () => this.updatePost());

    this.state = new EditPostState();
    this.state.addChangeListener(() => this.render());

    this.postFile = new PostFile({ filepath });
    this.readyPromise = this.postFile.fetch().then(() => {
      this.renderState();

      if (this.postFile.isDraft) {
        this.render();
      }

      if (this.postFile.isNew || this.postFile.hasLocalChanges) {
        this.state.moveToEdit();
      }
    });

    this.editButton.addEventListener('click', () => this.clickEdit());
    this.cancelButton.addEventListener('click', () => this.clickCancel());
    this.submitButton.addEventListener('click', () => this.clickSubmit());
    this.publishButton.addEventListener('click', () => this.clickPublish());

    this.viewForm.addEventListener('change', () => this.render());

    show(this.titleEl, true);
    show(this.subtitleEl, true);
    this.titleEl.setAttribute('placeholder', 'Title');
    this.subtitleEl.setAttribute('placeholder', 'Subitle');
    this.contentEl.setAttribute('placeholder', 'Content');

    [this.titleEl, this.subtitleEl].forEach(el => {
      el.addEventListener('keyup', preventEnterKey);
      el.addEventListener('keydown', preventEnterKey);
    });
    [this.titleEl, this.subtitleEl, this.contentEl].forEach(el => {
      el.addEventListener('paste', pasteWithoutFormatting);
    });
    function preventEnterKey(event) {
      if (event.code === 'Enter') {
        event.preventDefault();
      }
    }
    function pasteWithoutFormatting(event) {
      // cancel paste
      event.preventDefault();
      // get text representation of clipboard
      var text = event.clipboardData.getData('text/plain');
      // insert text manually
      document.execCommand('insertHTML', false, text);
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
    });
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
    if (!this.postFile.getTitle()) {
      throw new Error('Post must have a title');
    }
    this.state.moveToSubmitting();
    this.submitPost();
  }
  clickPublish() {
    this.state.moveToPublishing();
    this.publishPost();
  }

  get waiting() {
    return this.submitting || this.publishing;
  }
  get submitting() {
    return this.state.submitting;
  }
  get publishing() {
    return this.state.publishing;
  }
  get editing () {
    return this.state.editing && !this.waiting;
  }
  get writing() {
    return this.editing && this.viewStyle === 'write';
  }
  get diffing() {
    return this.editing && this.viewStyle === 'diff';
  }
  get canSubmit() {
    return this.editing && this.needsReview();
  }
  get canPublish() {
    return !this.editing && !this.waiting && this.postFile.isDraft;
  }
  renderState() {
    this.titleEl.contentEditable =
      this.subtitleEl.contentEditable =
      this.contentEl.contentEditable =
      this.writing;
    // When contenteditable changes, run execCommands to work on the editable areas.
    document.execCommand('defaultParagraphSeparator', false, 'p');

    show(this.editButton, !this.editing && !this.waiting);
    show(this.cancelButton, this.editing);
    show(this.submitButton, this.canSubmit);
    show(this.publishButton, this.canPublish);
    show(this.spinnerEl, this.waiting);
    show(this.viewForm, this.editing);
  }

  render() {
    this.renderState();

    if (this.diffing) {
      this.diffEl = this.postFile.diff();
      this.contentWrapper.replaceWith(this.diffEl);
    } else if (this.diffEl) {
      this.diffEl.replaceWith(this.contentWrapper);
    }

    this.titleEl.innerText = this.postFile.getTitle();
    this.subtitleEl.innerText = this.postFile.getSubtitle();

    if (this.writing) {
      this.contentEl.innerText = this.postFile.getContent();
    } else {
      this.contentEl.innerHTML = window.markdownToHTML(this.postFile.getContent());
    }
  }

  updatePost() {
    this.postFile.setTitle(this.titleEl.innerText);
    this.postFile.setSubtitle(this.subtitleEl.innerText);
    this.postFile.setContent(this.contentEl.innerText);

    this.renderState();
  }

  needsReview() {
    return this.postFile.hasChanges();
  }

  reset() {
    this.postFile.reset();
    this.viewForm.reset();
    this.state.reset();
  }

  async submitPost() {
    await this.postFile.commit();

    this.state.reset();
    if (typeof this.afterCommit === 'function') {
      this.afterCommit(this.postFile.lastCommit);
    }
  }

  async publishPost() {
    await this.postFile.publish();

    this.state.reset();
    if (typeof this.afterPublish === 'function') {
      this.afterPublish(this.postFile.filepath);
    }
  }
}

class EditPostState {
  constructor() {
    this._state = new State('view', 'edit', 'submitting', 'publishing');
  }

  get editing() {
    return this._state.is('edit');
  }
  get submitting() {
    return this._state.is('submitting');
  }
  get publishing() {
    return this._state.is('publishing');
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

  moveToPublishing() {
    this._state.moveTo('publishing');
  }
}
