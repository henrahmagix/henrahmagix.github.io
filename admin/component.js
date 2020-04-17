import { resolvePath } from './utils.js';

const TAG_NAME = 'html-import'; // see customElements.define at the end

class HTMLComponentError extends Error {
  /**
   * @param {string} message
   * @param {string} href
   * @param {Error} [cause]
   */
  constructor(message, href, cause) {
    super(`for ${href}: ${message}`);
    this.cause = cause;
    this.href = href;
    this.name = 'HTMLComponentError';
  }

  /**
   * @param {Error} err
   * @param {string} href
   */
  static wrap(err, href) {
    const newErr = new this(err.message, href, err);
    err.message = `${newErr.name} ${newErr.message}`;
    return err;
  }
}

export class HTMLComponentConfig {
  constructor() {
    /** @type {Boolean} */
    this.useShadowDOM = true;
  }

  /** @param {HTMLComponentConfig} config */
  merge(config) {
    return Object.assign(this, config);
  }
}

export class HTMLComponent extends HTMLElement {
  constructor() {
    super();

    this.fetch(resolvePath(import.meta.url, this.dataset.href));
  }

  /** @param {string} componentHref */
  async fetch(componentHref) {
    if (!componentHref) {
      return;
    }

    const res = await fetch(componentHref);
    if (!res.ok) {
      throw new Error(`component fetch failed: ${res.status} ${await res.text()}`);
    }

    const fragment = document.createDocumentFragment();
    const comp = document.createElement('div');
    comp.innerHTML = await res.text();

    const templateSource = comp.getElementsByTagName('template')[0];
    if (!templateSource) {
      throw new HTMLComponentError('Component must have a <template>', componentHref);
    }

    const template = /** @type {HTMLTemplateElement} */ (templateSource.content.cloneNode(true));

    // Add template. Replace resources in the source.
    reInitResourcesInto(template, template);
    fragment.appendChild(template);
    // Copy all other parts of the component.
    comp.removeChild(templateSource);
    reInitResourcesInto(comp, fragment);

    // Import and instantiate available views.
    /** @type {HTMLScriptElement[]} */
    const viewScripts = Array.from(fragment.querySelectorAll('script[type=module][src]'));
    let hasInitialisedView = false;
    const viewConfig = new HTMLComponentConfig();

    await Promise.all(viewScripts.map(async (script) => {
      try {
        /** @type {ComponentModule} */
        const module = await import(script.src);
        if (module.View) {
          if (hasInitialisedView) {
            throw new HTMLComponentError('only one view script allowed', componentHref);
          }
          hasInitialisedView = true;
          new module.View(fragment, this.dataset);
          if (module.config) {
            viewConfig.merge(module.config);
          }
        }
      } catch (err) {
        throw HTMLComponentError.wrap(err, componentHref);
      }
    }));

    // Add the built fragment to load child components.
    if (viewConfig.useShadowDOM) {
      const shadowRoot = this.attachShadow({ mode: 'open' });
      shadowRoot.appendChild(fragment);
    } else {
      this.appendChild(fragment);
    }

    /**
     * @param {HTMLElement} source
     * @param {HTMLElement|DocumentFragment} target
     */
    function reInitResourcesInto(source, target) {
      target = target || source;
      ['style', 'link', 'script'].forEach(tagName => {
        source.querySelectorAll(tagName).forEach(/** @param {HTMLElement} el */(el) => {
          const cloned = clone(el);
          if (source === target) {
            el.replaceWith(cloned);
          } else {
            target.appendChild(cloned);
          }
        });
      });
    }

    /**
     * @template {HTMLElement} T
     * @param {T} el
     * @returns {T}
     */
    function clone(el) {
      // Recreate the element to ensure it's executed again.
      const newEl = /** @type {T} */ (document.createElement(el.tagName));
      el.getAttributeNames().forEach(name => newEl.setAttribute(name, el.getAttribute(name)));

      // Rewrite relative attributes.
      ['src', 'href'].forEach(attr => {
        const val = el.getAttribute(attr);
        if (val && val.charAt(0) !== '/' && !val.match(/^http/)) {
          newEl.setAttribute(attr, resolvePath(componentHref, val));
        }
      });

      let html = el.innerHTML;

      // Rewrite relative CSS @import statements.
      if (newEl instanceof HTMLStyleElement) {
        html = html.replace(/@import '([^;]+)';/g, (_, m1) => {
          return `@import '${resolvePath(componentHref, m1)}';`;
        });
      }

      if (newEl instanceof HTMLScriptElement) {
        // Rewrite relative JS import statements.
        html = html.replace(
          /from ['"](.+)['"]/g,
          (whole, path) => whole.replace(path, resolvePath(componentHref, path)),
        );
        // Allow importing from inline modules.
        if (newEl.type === 'module' && !newEl.src) {
          newEl.src = URL.createObjectURL(
            new Blob([html], { type: 'application/javascript' })
          );
        }
      }

      newEl.innerHTML = html;
      return newEl;
    }
  }
}

customElements.define(TAG_NAME, HTMLComponent);
