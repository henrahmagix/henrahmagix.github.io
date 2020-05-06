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
 * @type {{new(dataset: DOMStringMap, events: EventTarget): HTMLComponentView, [key: string]: any}}
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
  };
}

export class HTMLImportComponent extends HTMLElement {
  constructor() {
    super();
    fetchHTMLComponent(this, resolvePath(import.meta.url, this.dataset.href));
  }
}

customElements.define('html-import', HTMLImportComponent);

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
    throw new HTMLComponentError(`Failed to fetch: ${res.status} ${await res.text()}`, componentHref);
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
        view = new module.View(thisElement.dataset, thisElement);
      }
    } catch (err) {
      throw HTMLComponentError.wrap(err, componentHref);
    }
  }));

  if (view) {
    fragment.appendChild(dynamicComponent(view, template, viewConfig.renderOnSetters));
  }

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

/**
 * @typedef {{[key: string]: any}} RenderData
 */

/**
 * @param {RenderData} view
 * @param {HTMLTemplateElement} template
 * @param {string[]} watchProperties
 * @returns {DocumentFragment}
 */
function dynamicComponent(view, template, watchProperties) {
  const fragment = document.createDocumentFragment();

  /** @type {PropNode[]} */
  const nodes = [];
  template.content.childNodes.forEach(node => {
    const propNode = newPropNode(node);
    if (propNode) {
      nodes.push(propNode);
    }
  });

  /** @type {{[datakey: string]: PropNode[]}} */
  const nodesByData = {};
  /**
   * @param {string} key
   * @param {PropNode} node
   */
  const addNodeByData = (key, node) => {
    if (!nodesByData.hasOwnProperty(key)) {
      nodesByData[key] = [];
    }
    nodesByData[key].push(node);
  };
  /** @type {(node: PropNode, parentkey?: string) => void} node */
  const walkNodeProps = (node, parentKey) => {
    if (node instanceof PropElementNode && node.forProp) {
      const datakey = node.forProp.datakey;
      parentKey = parentKey ? `${parentKey}.${datakey}` : datakey;
      addNodeByData(datakey, node);
    }

    node.props.forEach(p => {
      addNodeByData(p.datakey, node);
      if (parentKey) {
        addNodeByData(`${parentKey}.${p.datakey}`, node);
      }
    });
    node.children.forEach(node => walkNodeProps(node, parentKey));
  };
  nodes.forEach(node => walkNodeProps(node, ''));

  /** @type {{[key: string]: number}} */
  let renderRAFsByProp = {};

  watchProperties.forEach(prop => {
    let _value = watchValue(prop, view[prop]);

    Object.defineProperty(view, prop, {
      enumerable: true,
      get: () => {
        return _value;
      },
      set: (val) => {
        const oldValue = _value;
        _value = watchValue(prop, val);
        if (_value !== oldValue) {
          renderChange(prop, view);
        }
      },
    });
  });

  // 🙌 https://stackoverflow.com/a/57179513/3150057
  for (const [property, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(Object.getPrototypeOf(view)))) {
    if (typeof descriptor.get === 'function') {
      descriptor.enumerable = true;
      Object.defineProperty(view, property, descriptor);
    }
  }

  nodes.forEach(n => {
    n.render(view);
    fragment.appendChild(n.node);
  });
  return fragment;

  /**
   * @param {string} prop
   * @param {RenderData} data
   * @param {string|number} [sub]
   */
  function renderChange(prop, data, sub) {
    if (nodesByData.hasOwnProperty(prop)) {
      cancelAnimationFrame(renderRAFsByProp[prop]);
      renderRAFsByProp[prop] = requestAnimationFrame(() => {
        nodesByData[prop].forEach(n => {
          n.renderProp(prop, data, sub);
        });
      });
    }
  };

  /**
   * @param {string} prop
   * @param {any} val
   * @returns
   */
  function watchValue(prop, val) {
    if (typeof val !== 'object') {
      return val;
    }
    return watch(val, (target, key) => {
      if (Array.isArray(val) && val.includes(target)) {
        const index = val.indexOf(target);
        renderChange(`${prop}.${key}`, val[index], index);
      } else if (key in val) {
        renderChange(prop, view, key);
      } else {
        renderChange(prop, view);
      }
    });
  };
}

const rValueExpression = /{{([^}]+)}}/;
const rAttributeExpression = /^{(.+)}$/;

/** @type {(str: string, data: any) => string} */
function replaceValue(str, data) {
  return str.replace(new RegExp(rValueExpression, 'g'), (_, expr) => {
    expr = expr.trim();
    return renderExpression(expr, data) || '';
  });
}

/** @param {Node} node */
function logNode(node) {
  if (node instanceof Text) {
    return `Text<${node.data}>`;
  } else if (node instanceof Element) {
    return node.outerHTML.replace(node.innerHTML, '');
  }
}

/**
 * @typedef {{raw: string, type: 'text', datakey: string}} TextProp
 * @typedef {{raw: string, type: 'attr', datakey: string, attr: string, value?: string}} AttrProp
 * @typedef {{raw: string, type: 'for', datakey: string}} ForProp
 * @typedef {{raw: string, type: 'on', datakey: string, event: string}} OnProp
 * @typedef {TextProp|AttrProp|ForProp|OnProp} Prop
 */

/**
 * @typedef PropNode
 * @property {Node} node
 * @property {Prop[]} props
 * @property {PropNode[]} children
 * @property {() => void} remove
 * @property {(data: RenderData) => void} render
 * @property {(prop: string, data: RenderData, sub?: string|number) => void} renderProp
 */

/** @type {(node: Node) => PropNode} */
function newPropNode(node) {
  if (node instanceof Text) {
    return new PropTextNode(node);
  }
  if (node instanceof Element) {
    return new PropElementNode(node);
  }
  if (node instanceof Comment) {
    return null;
  }
  throw new Error(`unknown node type: ${node.constructor}`);
}

class PropTextNode {
  /** @param {Text} node */
  constructor(node) {
    /** @type {PropNode} Assert implements */ (this);

    this.sourceData = node.data;
    this.node = node;

    /** @type {[]} */
    this.children = [];

    const textExpressions = this.node.data.match(new RegExp(rValueExpression, 'g')) || [];
    /** @type {TextProp[]} */
    this.props = textExpressions.map(expr => ({
      raw: expr,
      type: 'text',
      datakey: expr.match(rValueExpression)[1].trim(),
    }));
  }

  remove() {
    this.node.remove();
  }

  /** @type {(data: RenderData) => void} */
  render(data) {
    if (this.props.length === 0) {
      return;
    }
    this.node.data = replaceValue(this.sourceData, data);
  }

  /** @type {(prop: string, data: RenderData) => void} */
  renderProp(prop, data) {
    // Ignore single prop and render all text to latest.
    this.render(data);
  }
}

class PropElementNode {
  /** @param {Element} node */
  constructor(node) {
    /** @type {PropNode} Assert implements */ (this);

    this.sourceNode = /** @type {Element} */ (node.cloneNode(true));
    /** @type {Element} */
    this.node = node;

    /** @type {PropNode[]} */
    this.children = [];
    /** @type {PropElementNode[]} */
    this.forClones = [];

    /** @type {Prop[]} */
    this.props = [];
    /** @type {ForProp} */
    this.forProp = null;

    this.node.getAttributeNames().forEach(attr => {
      const value = this.node.getAttribute(attr);
      let [_, expr] = attr.match(rAttributeExpression) || [];
      expr = expr && expr.trim();

      if (!expr && rValueExpression.test(value)) {
        const textExpressions = value.match(new RegExp(rValueExpression, 'g')) || [];
        textExpressions.forEach(expr => {
          this.props.push({
            raw: expr,
            type: 'attr',
            datakey: expr.match(rValueExpression)[1].trim(),
            attr,
            value,
          });
        });
        return;
      }

      if (!expr) {
        return;
      }

      if (expr === 'for') {
        this.forProp = { raw: attr, type: 'for', datakey: value };
        return;
      }

      const [, onName] = expr.match(/^on-(.+)$/) || [];
      if (onName) {
        this.props.push({ raw: attr, type: 'on', event: onName, datakey: value });
        return;
      }

      this.props.push({ raw: attr, type: 'attr', attr: expr, datakey: value });
    });

    this.node.childNodes.forEach(child => {
      const propNode = newPropNode(child);
      if (propNode) {
        this.children.push(propNode);
      }
    });
  }

  remove() {
    this.node.remove();
  }

  /**
   * @param {string} datakey
   * @param {RenderData} data
   * @param {string|number} [subkey]
   */
  renderProp(datakey, data, subkey) {
    if (this.forProp) {
      const [parentKey, itemKey] = datakey.split('.');
      if (this.forProp.datakey === datakey || this.forProp.datakey === parentKey) {
        if (typeof subkey === 'number' && itemKey) {
          const indexToRender = [this, ...this.forClones][subkey];
          indexToRender.renderProp(itemKey, data);
          indexToRender.children.forEach(n => n.renderProp(itemKey, data));
        } else {
          this.renderForProp(this.forProp, data);
        }
      }
    }
    const prop = this.props.find(p => p.datakey === datakey);
    if (prop) {
      if (prop.type === 'attr') {
        this.renderAttrProp(prop, data);
      }
    }
  }

  /** @type {(data: RenderData) => void} */
  render(data) {
    if (this.forProp) {
      this.renderForProp(this.forProp, data);
    } else {
      this.renderAllAttrsAndEvents(data);
      this.children.forEach(c => c.render(data));
    }
  }

  /** @type {(prop: ForProp, data: RenderData) => void} */
  renderForProp(prop, data) {
    this.forClones.forEach(f => f.remove());

    const newFragment = document.createDocumentFragment();
    const loopData = /** @type {any[]} */ (data[prop.datakey] || []);
    this.forClones = [];
    for (let i = 0; i < loopData.length; i++) {
      const item = loopData[i];
      const cloneNode = /** @type {Element} */ (this.sourceNode.cloneNode(true));
      cloneNode.removeAttribute(prop.raw);
      const clone = new PropElementNode(cloneNode);
      this.forClones.push(clone);
      // // Allow for clones to render both parent data and the loop data.
      // clone.render(data);
      clone.render(item);
      newFragment.appendChild(clone.node);
    }

    if (this.forClones.length > 0) {
      this.node.replaceWith(newFragment);
      const first = this.forClones.shift();
      this.node = first.node;
      this.children = first.children;
    } else {
      const placeholder = document.createComment(this.forProp.raw);
      this.node.replaceWith(placeholder);
      this.node = placeholder;
      this.children = [];
    }
  }

  /** @type {(data: RenderData) => void} */
  renderAllAttrsAndEvents(data) {
    if (!data) {
      return;
    }

    this.props.forEach(p => {
      if (p.type === 'attr') {
        this.renderAttrProp(p, data);
      } else if (p.type === 'on') {
        this.renderOnProp(p, data);
      }
    });
  }

  /** @type {(prop: AttrProp, data: RenderData) => void} */
  renderAttrProp(prop, data) {
    if (prop.value) {
      this.node.setAttribute(prop.attr, replaceValue(prop.value, data));
      return;
    }

    this.node.removeAttribute(prop.raw);
    let value = renderExpression(prop.datakey, data);
    if (value && prop.attr === 'value' && this.node instanceof HTMLInputElement && this.node.type === 'file') {
      // DOMException: Failed to set the 'value' property on 'HTMLInputElement':
      // This input element accepts a filename, which may only be
      // programmatically set to the empty string.
      return;
    }

    if (prop.attr in this.node) {
      const attrType = typeof /** @type {any} */ (this.node)[prop.attr];
      if (value == null) {
        if (attrType === 'string') {
          value = '';
        }
      }
      /** @type {any} */ (this.node)[prop.attr] = value;
    } else {
      this.node.setAttribute(prop.attr, value);
    }
  }

  /** @type {(prop: OnProp, data: RenderData) => void} */
  renderOnProp(prop, data) {
    /** @type {{[key: string]: EventListener}} */
    this.nodeEvents = this.nodeEvents || {};
    this.node.removeAttribute(prop.raw);
    /** @type {function} */
    const value = data[prop.datakey];
    if (typeof value === 'function') {
      const onattr = `on${prop.event}`;
      if (onattr in this.node) {
        /** @type {any} */ (this.node)[onattr] = value.bind(data);
      } else if (!this.nodeEvents.hasOwnProperty(prop.event)) {
        /** @param {CustomEvent} event */
        this.nodeEvents[prop.event] = (event) => {
          value.call(data, event.detail);
        };
        this.node.addEventListener(prop.event, this.nodeEvents[prop.event]);
      }
    }
  }
}

/** @type {(expr: string, data: RenderData) => any} */
function renderExpression(expr, data) {
  if (typeof data !== 'object') {
    return undefined;
  }
  const keys = objectKeys(data);
  const args = `{window,console,${keys.map(reservedWordReplacer).join(',')}}`;
  expr = expr.replace(/(?:^|[^.])\b(\w+)\b/g, (whole, word) => {
    return whole.replace(word, reservedWordReplacer(word))
  });
  const body = `return ${expr}`;
  try {
    const fn = new Function(args, body);
    return fn.call(null, data);
  } catch (err) {
    if (err instanceof ReferenceError) {
      return undefined;
    }
    err.message += ` in function(${args}) { ${body} }`
    err.name = 'ExpressionError';
    throw err;
  }
}

/** @type {(o: any) => string[]} */
function objectKeys(o) {
  let keys = Object.keys(Object.getOwnPropertyDescriptors(o));
  const proto = Object.getPrototypeOf(o);
  if (proto && proto !== Object.getPrototypeOf({})) {
    keys = keys.concat(objectKeys(proto));
  }
  return [...new Set(keys)].filter(k => k !== 'constructor');
}

const reservedWords = [
  'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger',
  'default', 'delete', 'do', 'else', 'export', 'extends', 'finally', 'for',
  'function', 'if', 'import', 'in', 'instanceof', 'new', 'return', 'super',
  'switch', 'this', 'throw', 'try', 'typeof', 'var', 'void', 'while', 'with',
  'yield',
];
/** @param {string} k */
function reservedWordReplacer(k) {
  if (reservedWords.includes(k)) {
    return `x${k}`;
  }
  return k;
}

/**
 * @template {object} T
 * @type {(object: T, onChange: (target: T, property: string|number) => void) => ProxyHandler<T>}
 */
function watch(object, onChange) {
  const handler = {
    /**
     * @param {any} target
     * @param {string|number} property
     * @param {any} receiver
     * @returns {ProxyHandler<T>}
     */
    get(target, property, receiver) {
      if (property === '__proxy_target__') {
        return target.__proxy_target__;
      }
      try {
        const prox = new Proxy(target[property], handler);
        prox.__proxy_target__ = target[property];
        return prox;
      } catch (err) {
        return Reflect.get(target, property, receiver);
      }
    },
    /**
     * @param {T} target
     * @param {string|number} property
     * @param {PropertyDescriptor} descriptor
     */
    defineProperty(target, property, descriptor) {
      const result = Reflect.defineProperty(target, property, descriptor);
      onChange(target, property);
      return result;
    },
    /**
     * @param {T} target
     * @param {string|number} property
     */
    deleteProperty(target, property) {
      const result = Reflect.deleteProperty(target, property);
      onChange(target, property);
      return result;
    }
  };

  const prox = new Proxy(object, handler);
  prox.__proxy_target__ = object;
  return prox;
};
