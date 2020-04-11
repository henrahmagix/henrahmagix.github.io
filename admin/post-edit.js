import { createHTML, show, State } from './utils.js';
import { PostFile } from './post-file.js';

export class EditPostView {
  /** @returns {HTMLButtonElement} */
  get editButton() { return this.el.querySelector('.button-edit'); }
  /** @returns {HTMLButtonElement} */
  get cancelButton() { return this.el.querySelector('.button-cancel'); }
  /** @returns {HTMLButtonElement} */
  get reviewButton() { return this.el.querySelector('.button-review'); }
  /** @returns {HTMLButtonElement} */
  get submitButton() { return this.el.querySelector('.button-submit'); }
  /** @returns {HTMLButtonElement} */
  get publishButton() { return this.el.querySelector('.button-publish'); }
  /** @returns {HTMLButtonElement} */
  get unpublishButton() { return this.el.querySelector('.button-unpublish'); }
  /** @returns {HTMLButtonElement} */
  get tweetButton() { return this.el.querySelector('.button-tweet'); }

  /** @returns {HTMLElement} */
  get spinnerEl() { return this.el.querySelector('.spinner'); }
  /** @returns {HTMLFormElement} */
  get viewForm() { return this.el.querySelector('form[name="view"]'); }

  /** @returns {HTMLElement} */
  get titleEl() { return (this.contentWrapper.querySelector('.entry-title')); }
  /** @returns {HTMLElement} */
  get subtitleEl() { return (this.contentWrapper.querySelector('.entry-summary')); }
  /** @returns {HTMLElement} */
  get contentEl() { return (this.contentWrapper.querySelector('.entry-content')); }

  get viewStyle() {
    return new FormData(this.viewForm).get('style');
  }

  /** @param {PostFile} postFile */
  setFile(postFile) {
    this.postFile = postFile;
    this.renderState();

    if (postFile.isDraft) {
      this.render();
    }

    if (postFile.isNew || postFile.hasLocalChanges) {
      this.state.moveToEdit();
    }
  }

  /**
   * @param {HTMLElement} contentWrapper
   * @param {object} opts
   * @param {lib.markdownRenderer} opts.markdownRenderer
   * @param {(commit: string) => void} opts.afterCommit
   * @param {(filepath: string) => void} opts.afterPublish
   * @param {(filepath: string) => void} opts.afterUnpublish
   */
  constructor(
    contentWrapper,
    {
      markdownRenderer,
      afterCommit,
      afterPublish,
      afterUnpublish,
    }
  ) {
    this.contentWrapper = contentWrapper;
    this.markdownRenderer = markdownRenderer;
    this.afterCommit = afterCommit;
    this.afterPublish = afterPublish;
    this.afterUnpublish = afterUnpublish;

    this.state = new EditPostState();

    /**
     * @param {object} opts
     * @param {string} opts.text
     * @param {string} opts.classname
     * @param {string} opts.icon
     * @returns {string}
     */
    function buttonHTML({text, classname, icon}) {
      return `<button class="${classname}"><i class="icon ${icon}"></i>${text}</button>`;
    }
    this.el = createHTML(`
      <div id="admin-post-edit">
        ${buttonHTML({text: 'Edit', classname: 'button-edit', icon: 'fas fa-pencil-alt'})}
        ${buttonHTML({text: 'Cancel', classname: 'button-cancel', icon: 'fas fa-times'})}
        ${buttonHTML({text: 'Submit', classname: 'button-submit', icon: 'fas fa-check'})}
        ${buttonHTML({text: 'Publish', classname: 'button-publish', icon: 'fas fa-cloud-upload-alt'})}
        ${buttonHTML({text: 'Unpublish', classname: 'button-unpublish', icon: 'fas fa-cloud-download-alt'})}
        ${buttonHTML({text: 'Tweet', classname: 'button-tweet', icon: 'fab fa-twitter'})}

        <span class="spinner"><i hidden class="fas fa-spinner fa-pulse"></i></span>

        <form hidden name="view" class="view-wrapper" onsubmit="return false;">
          View:
          <label>
            <input type="radio" name="style" value="html" checked>
            <span>HTML</span>
          </label>
          |
          <label>
            <input type="radio" name="style" value="raw">
            <span>Raw</span>
          </label>
          |
          <label>
            <input type="radio" name="style" value="diff">
            <span>Diff</span>
          </label>
        </form>
      </div>
    `);

    this.textarea = document.createElement('textarea');
    this.textarea.addEventListener('input', () => {
      this.fixTextareaHeight();
      this.updatePost();
    });

    /** @type {HTMLElement} */
    this.diffEl = document.createElement('div'); // so it always exists

    this.contentWrapper.addEventListener('input', () => this.updatePost());

    this.state.addChangeListener(() => this.render());

    this.editButton.addEventListener('click', () => this.clickEdit());
    this.cancelButton.addEventListener('click', () => this.clickCancel());
    this.submitButton.addEventListener('click', () => this.clickSubmit());
    this.publishButton.addEventListener('click', () => this.clickPublish());
    this.unpublishButton.addEventListener('click', () => this.clickUnpublish());
    this.tweetButton.addEventListener('click', () => this.clickTweet());

    this.viewForm.addEventListener('change', () => this.render());

    show(this.titleEl, true);
    show(this.subtitleEl, true);
    this.titleEl.setAttribute('placeholder', 'Title');
    this.subtitleEl.setAttribute('placeholder', 'Subitle');
    this.contentEl.setAttribute('placeholder', 'Content');

    [this.titleEl, this.subtitleEl].forEach(el => {
      el.addEventListener('keyup', preventEnterKey);
      el.addEventListener('keydown', preventEnterKey);
      el.addEventListener('paste', pasteWithoutFormatting);
    });
    this.contentEl.addEventListener('paste', (event) => {
      if (this.writingHTML) {
        pasteWithoutFormatting(event);
      }
    });

    window.addEventListener('beforeunload', event => {
      if (this.needsReview()) {
        event.preventDefault();
        event.returnValue = '';
      }
    });
  }

  fixTextareaHeight() {
    cancelAnimationFrame(this.fixTextareaHeightRAF);
    this.fixTextareaHeightRAF = requestAnimationFrame(() => {
      this.textarea.style.lineHeight = '1.2';
      this.textarea.style.height = this.postFile.getRaw().match(/\n/g).length * Number(this.textarea.style.lineHeight) + 'em';
      this.textarea.style.height = this.textarea.scrollHeight + 'px';
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
  clickUnpublish() {
    this.state.moveToUnpublishing();
    this.unpublishPost();
  }
  clickTweet() {
    this.state.moveToTweeting();
    const newTweetUrl = new URL('https://twitter.com/intent/tweet');
    newTweetUrl.searchParams.set('text', 'New blog post!');
    newTweetUrl.searchParams.set('url', window.location.href);

    // Delay the next steps on this page so the prompt opens in the background,
    // ready for user input when focus returns.
    setTimeout(() => {
      // Get posted tweet url and save to the file.
      const tweet = prompt('Enter tweet url');
      this.postFile.setSyndication('twitter', tweet);
      // View the diff so it can be submitted.
      this.clickEdit();
      Array.from(this.viewForm.querySelectorAll('input'))
        .find(i => i.value === 'diff')
        .click();
    }, 1000);
    // Open a new tab/window so the above next steps can occur.
    window.open(newTweetUrl.toString(), '_blank');
  }

  get waiting() {
    return this.submitting || this.publishing || this.tweeting;
  }
  get submitting() {
    return this.state.submitting;
  }
  get publishing() {
    return this.state.publishing;
  }
  get tweeting() {
    return this.state.tweeting;
  }
  get editing () {
    return this.state.editing && !this.waiting;
  }
  get writingRaw() {
    return this.editing && this.viewStyle === 'raw';
  }
  get writingHTML() {
    return this.editing && this.viewStyle === 'html';
  }
  get writing() {
    return this.writingRaw || this.writingHTML;
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
  get canUnpublish() {
    return !this.editing && !this.waiting && !this.postFile.isDraft && !this.postFile.isNew;
  }
  get canTweet() {
    return !this.editing && !this.waiting && !this.postFile.isDraft && !this.postFile.hasSyndication('twitter');
  }

  render() {
    this.renderContent();
    this.renderState();
  }

  renderState() {
    let contentEditable = 'false';
    if (this.writingHTML) {
      contentEditable = 'true';
    } else if (this.writingRaw) {
      contentEditable = 'plaintext-only';
    }
    this.setContentEditable(contentEditable);

    show(this.editButton, !this.editing && !this.waiting);
    show(this.cancelButton, this.editing);
    show(this.submitButton, this.canSubmit);
    show(this.publishButton, this.canPublish);
    show(this.unpublishButton, this.canUnpublish);
    show(this.tweetButton, this.canTweet);
    show(this.spinnerEl, this.waiting);
    show(this.viewForm, this.editing);
  }

  renderContent() {
    if (this.diffing) {
      this.diffEl = this.postFile.diff();
      this.contentWrapper.replaceWith(this.diffEl);
      this.textarea.replaceWith(this.diffEl);
      return;
    }

    if (this.writingRaw) {
      this.textarea.value = this.postFile.getRaw();

      this.contentWrapper.replaceWith(this.textarea);
      this.diffEl.replaceWith(this.textarea);
      this.fixTextareaHeight();
    } else {
      this.titleEl.innerHTML = this.markdownRenderer.markdownToHTML(this.postFile.getTitle());
      this.subtitleEl.innerHTML = this.markdownRenderer.markdownToHTML(this.postFile.getSubtitle());
      this.contentEl.innerHTML = this.markdownRenderer.markdownToHTML(this.postFile.getContent());
      // Fix code highlighting after editing.
      this.contentEl.querySelectorAll('pre').forEach(function (el) {
        el.classList.add('highlight');
      });

      this.textarea.replaceWith(this.contentWrapper);
      this.diffEl.replaceWith(this.contentWrapper);
    }
  }

  /** @param {string} value */
  setContentEditable(value) {
    this.titleEl.contentEditable = this.subtitleEl.contentEditable = value;
    if (this.contentEl) {
      this.contentEl.contentEditable = value;
    }
    document.execCommand('defaultParagraphSeparator', false, 'p');
  }

  updatePost() {
    if (this.writingRaw) {
      this.postFile.setRaw(this.textarea.value);
    } else {
      this.postFile.setTitle(this.markdownRenderer.htmlToMarkdown(this.titleEl.innerHTML));
      this.postFile.setSubtitle(this.markdownRenderer.htmlToMarkdown(this.subtitleEl.innerHTML));
      this.postFile.setContent(this.markdownRenderer.htmlToMarkdown(this.contentEl.innerHTML));
    }

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

  async unpublishPost() {
    await this.postFile.unpublish();

    this.state.reset();
    if (typeof this.afterUnpublish === 'function') {
      this.afterUnpublish(this.postFile.filepath);
    }
  }
}

class EditPostState {
  constructor() {
    this._state = new State('view', 'edit', 'submitting', 'publishing', 'unpublishing', 'tweeting');
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
  get unpublishing() {
    return this._state.is('unpublishing');
  }
  get tweeting() {
    return this._state.is('tweeting');
  }

  /** @param {() => void} fn */
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

  moveToUnpublishing() {
    this._state.moveTo('unpublishing');
  }

  moveToTweeting() {
    this._state.moveTo('tweeting');
  }
}

/** @param {KeyboardEvent} event */
function preventEnterKey(event) {
  if (event.code === 'Enter') {
    event.preventDefault();
  }
}
/** @param {ClipboardEvent} event */
function pasteWithoutFormatting(event) {
  // cancel paste
  event.preventDefault();
  // get text representation of clipboard
  var text = event.clipboardData.getData('text/plain');
  // insert text manually
  document.execCommand('insertHTML', false, text);
}
