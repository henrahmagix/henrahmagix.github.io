import { resolvePath } from './utils.js';

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
    /** @type {string[]} */
    this.renderOnSetters = [];
  }

  /** @param {HTMLComponentConfig} config */
  merge(config) {
    return Object.assign(this, config);
  }
}

/**
 * @typedef {object} HTMLComponentView
 * @type {{new(template: DocumentFragment, dataset: DOMStringMap): HTMLComponentView, [key: string]: any}}
 *
*/

/**
 * @param {string} href
 * @returns {typeof HTMLImportComponent}
 */
export function HTMLComponentForHref(href) {
  return class extends HTMLElement {
    constructor() {
      super();
      fetchHTMLComponent(this, resolvePath(import.meta.url, href));
    }
  }
}

export class HTMLImportComponent extends HTMLElement {
  constructor() {
    super();
    fetchHTMLComponent(this, resolvePath(import.meta.url, this.dataset.href));
  }
}

customElements.define('html-import', HTMLImportComponent);

const rValueExpression = /\{\{([^}]+)\}\}/g;
const rStructuralExpression = /^{(.+)}$/; // must not be global, so .match() receives capture groups

/** @type {(str: string, data: any) => string} */
function replaceValue(str, data) {
  return str.replace(rValueExpression, (_, expr) => data[expr.trim()] || '');
}

/**
 * @param {HTMLComponentView} view
 * @param {HTMLComponentConfig} config
 * @param {HTMLTemplateElement} template
 * @param {HTMLElement} thisElement
 * @returns {HTMLTemplateElement}
 */
function render(view, config, template, thisElement) {
  const copy = /** @type {HTMLTemplateElement} */ (template.cloneNode(true));
  evalStructuralExpressions(copy.content.children, view);
  // Replace any value expressions left over.
  copy.innerHTML = replaceValue(copy.innerHTML, view);
  return copy;
}

/**
 * @param {HTMLCollection} children
 * @param {HTMLComponentView} view
 */
function evalStructuralExpressions(children, view) {
  const childrenIterable = Array.from(children);
  // First eval expressions on children.
  childrenIterable.forEach(child => {
    child.getAttributeNames().forEach(attr => {

      const [matched, expr] = attr.match(rStructuralExpression) || [];
      if (!matched) return;
      if (!expr) {
        throw new Error(`empty expression on ${logElement(child)}`);
      }

      child.removeAttribute(attr);

      const [, forName] = expr.match(/^for-(.+)$/) || [];
      if (forName) {
        const fragment = document.createDocumentFragment();

        /** @type {any[]} */
        const data = view[forName] || [];
        data.forEach(item => {
          const holder = document.createElement('div');
          holder.appendChild(child.cloneNode(true));
          holder.innerHTML = replaceValue(holder.innerHTML, item);
          fragment.appendChild(holder.children[0]);
        });
        child.replaceWith(fragment);
      }
    });
  });
  // Then recurse.
  childrenIterable.forEach(child => evalStructuralExpressions(child.children, view));
}

/** @param {Element} el */
function logElement(el) {
  return el.outerHTML.replace(el.innerHTML, '');
}

/**
 * @param {HTMLElement} thisElement
 * @param {string} componentHref
 */
async function fetchHTMLComponent(thisElement, componentHref) {
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

  const allTemplates = comp.getElementsByTagName('template');
  if (!allTemplates[0]) {
    throw new HTMLComponentError('Component must have a <template>', componentHref);
  }
  if (allTemplates.length > 1) {
    throw new HTMLComponentError('Component has too many <template>: only one please', componentHref);
  }
  const template = allTemplates[0];

  // Remove template so it doesn't get included again.
  comp.removeChild(template);

  // Copy all other parts of the component so we can find the view script export.
  reInitResourcesInto(comp, fragment);

  // Import and instantiate available views.
  /** @type {HTMLScriptElement[]} */
  const viewScripts = Array.from(fragment.querySelectorAll('script[type=module][src]'));

  /** @type {HTMLComponentView} */
  let view;
  const viewConfig = new HTMLComponentConfig();

  await Promise.all(viewScripts.map(async (script) => {
    try {
      /** @type {ComponentModule} */
      const module = await import(script.src);
      if (module.View) {
        if (view) {
          throw new HTMLComponentError('only one view script allowed', componentHref);
        }

        if (module.config) {
          viewConfig.merge(module.config);
        }
        // Pass through original template so the view can change it.
        view = new module.View(template.content, thisElement.dataset);
      }
    } catch (err) {
      throw HTMLComponentError.wrap(err, componentHref);
    }
  }));

  let renderView = function () {
    fragment.appendChild(template.content.cloneNode(true))
  };

  if (view) {
    /** @type {Element[]} */
    let childReferences = [];

    renderView = function () {
      const rendered = render(view, viewConfig, template, thisElement);
      const newChildReferences = Array.from(rendered.content.children).slice(0);

      const insertBefore = childReferences[0];
      if (insertBefore) {
        insertBefore.before(rendered.content);
      } else {
        fragment.appendChild(rendered.content);
      }
      childReferences.forEach(child => {
        child.remove();
      });
      childReferences = newChildReferences;
    };

    // Replace watch properties with setters so we can render when they are set.
    viewConfig.renderOnSetters.forEach(prop => {
      /** @type {number} */
      let renderRAF;

      let _value = view[prop];
      Object.defineProperty(view, prop, {
        set: function(value) {
          _value = value;
          cancelAnimationFrame(renderRAF);
          renderRAF = requestAnimationFrame(() => {
            renderView();
          });
        },
        get: function() {
          return _value;
        },
      });
    });
  }

  // Render only after the view has initialised.
  renderView();

  // Add the built fragment to load child components.
  if (viewConfig.useShadowDOM) {
    const shadowRoot = thisElement.attachShadow({ mode: 'open' });
    shadowRoot.appendChild(fragment);
  } else {
    thisElement.appendChild(fragment);
  }

  /**
   * @param {HTMLElement|DocumentFragment} source
   * @param {HTMLElement|DocumentFragment} target
   */
  function reInitResourcesInto(source, target) {
    ['style', 'link', 'script'].forEach(tagName => {
      source.querySelectorAll(tagName).forEach(/** @param {HTMLElement} el */(el) => {
        target.appendChild(clone(el));
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
