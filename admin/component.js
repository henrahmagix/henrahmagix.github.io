import { resolvePath } from './utils.js';

import * as adminModule from './admin.js';
import * as utilsModule from './utils.js';
import * as postDraftModule from './post-draft.js';
import * as postEditModule from './post-edit.js';
import * as postFileModule from './post-file.js';

const TAG_NAME = 'html-import'; // see customElements.define at the end

const dependencies = {
  'admin': {...adminModule},
  'utils': {...utilsModule},
  'post-draft': {...postDraftModule},
  'post-edit': {...postEditModule},
  'post-file': {...postFileModule},
};

export class Component extends HTMLElement {
  constructor() {
    super();

    const shadowRoot = this.attachShadow({ mode: 'open' });

    this.fetch(shadowRoot, this.dataset.href);
  }

  /**
   * @param {ShadowRoot} shadowRoot
   * @param {string} componentHref
   */
  async fetch(shadowRoot, componentHref) {
    if (!componentHref) {
      return;
    }

    const res = await fetch(componentHref);
    if (!res.ok) {
      throw new Error(`component fetch failed: ${res.status} ${await res.text()}`);
    }

    const comp = document.createElement('div');
    comp.innerHTML = await res.text();

    const templateSource = comp.getElementsByTagName('template')[0];
    const template = /** @type {HTMLTemplateElement} */ (templateSource.content.cloneNode(true));

    // Add template. Replace resources in the source.
    reInitResourcesInto(template, template);
    shadowRoot.appendChild(template);
    // Copy all other parts of the component.
    comp.removeChild(templateSource);
    reInitResourcesInto(comp, shadowRoot);

    // Import and instantiate available views.
    const scripts = Array.from(shadowRoot.querySelectorAll('script'));
    await Promise.all(scripts.map(async (script) => {
      if (script.src && script.type === 'module') {
        const module = await import(script.src);
        if (module.View) {
          new module.View(shadowRoot, dependencies);
        }
      }
    }));

    /**
     * @param {HTMLElement|ShadowRoot} source
     * @param {HTMLElement|ShadowRoot} target
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
        if (val && val.charAt(0) !== '/') {
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

customElements.define(TAG_NAME, Component);
