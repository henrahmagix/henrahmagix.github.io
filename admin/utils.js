/** @param {string} s
 * @returns {HTMLElement}
*/
export function createHTML(s) {
  const holder = document.createElement('div');
  holder.innerHTML = s;
  if (holder.childElementCount > 1) {
    throw new Error('createHTML must receive only one root element');
  }
  return /** @type {HTMLElement} */ (holder.children.item(0));
}

/** @param {string} s */
export function slugify(s) {
  return s.toLowerCase().match(/[\w]+/g).join('-');
}

export const yamlString = {
  /** @param {string} s */
  toYaml(s) {
    // Quote to avoid yaml problems.
    return JSON.stringify(s);
  },
  /** @param {string} s
   * @returns {string} */
  toString(s) {
    // Unquote.
    try {
      return JSON.parse(s);
    } catch (err) {
      return s;
    }
  },
};

// https://stackoverflow.com/a/30106551/3150057
export const base64 = {
  /** @param {string} str */
  encode(str) {
    // first we use encodeURIComponent to get percent-encoded UTF-8,
    // then we convert the percent encodings into raw bytes which
    // can be fed into btoa.
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
      function toSolidBytes(match, p1) {
        return String.fromCharCode(Number('0x' + p1));
      }));
  },
  /** @param {string} str */
  decode(str) {
    // Going backwards: from bytestream, to percent-encoding, to original string.
    return decodeURIComponent(atob(str).split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  },
};

/**
 * @param {HTMLElement} el
 * @param {boolean} visible
 */
export function show(el, visible) {
  if (visible == null) {
    visible = true;
  }
  return el.hidden = !visible;
}
/** @param {HTMLElement} el */
export function showing(el) {
  return !el.hidden;
}

 /**
  * @typedef {object} StateListener
  * @property {string} [from]
  * @property {string} [to]
  * @property {() => void} fn
  */

export class State {
  /**
   * @param {...string} states
   */
  constructor(...states) {
    this._states = states;
    this._state = this._states[0];
    /** @type {StateListener[]} */
    this._listeners = [];

    if (!this._states || this._states.length < 2) {
      throw new Error('States must have more than 1 states');
    }
  }

  /**
   * @param {string} s
   * @returns {boolean}
   */
  is(s) {
    return this._state === s;
  }
  /** @param {string} to */
  moveTo(to) {
    const from = this._state;
    this._state = to;
    this._callChangeListeners(from, to);
  }

  /**
   * @param {string} from
   * @param {string} to
   */
  _callChangeListeners(from, to) {
    this._listeners.forEach(l => {
      const matchesFromTo = l.from === from && l.to === to;
      const justFunction = l.from == null && l.to == null;

      if (matchesFromTo || justFunction) {
        l.fn();
      }
    });
  }

  /**
   * @param {(() => void) | string} fnOrFrom
   * @param {string | undefined} [to]
   * @param {(() => void) | undefined} [fn]
   */
  addChangeListener(fnOrFrom, to, fn) {
    if (typeof fnOrFrom === 'function') {
      this._listeners.push({fn: fnOrFrom});
      return;
    }
    if (
      typeof fnOrFrom === 'string'
      && typeof to === 'string'
      && typeof fn === 'function'
    ) {
      this._listeners.push({ from: fnOrFrom, to, fn });
      return;
    }

    throw new TypeError(`addChangeListener args must be just function, or from:string to:string callback:function, but was ${arguments}`);
  }
}

/**
 * @param {string} a
 * @param {string} b
 * @returns {string}
 */
// https://gist.github.com/zmmbreeze/7747971
export function resolvePath(a, b) {
  try {
    const url = new URL(a);
    // treat a like a url
    return url.origin + resolvePath(url.pathname, b);
  } catch (err) {
    // treat a like a path, carry on
  }

  if (b.charAt(0) === '/') {
    return b;
  }
  const aParts = a.split('/');
  const bParts = b.split('/');

  aParts[aParts.length - 1] = '';

  let part, i = 0;
  while (typeof (part = bParts[i]) === 'string') {
    if (part === '..') {
      aParts.pop();
      aParts.pop();
      aParts.push('');
    } else if (part !== '.') {
      aParts.pop();
      aParts.push(part);
      aParts.push('');
    }
    i++;
  }

  if (aParts[aParts.length - 1] === '') {
    aParts.pop();
  }
  return aParts.join('/');
}
