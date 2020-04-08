export function createHTML(s) {
  const holder = document.createElement('div');
  holder.innerHTML = s;
  return holder.children.item(0);
}

// https://stackoverflow.com/a/30106551/3150057
export const base64 = {
  encode(str) {
    // first we use encodeURIComponent to get percent-encoded UTF-8,
    // then we convert the percent encodings into raw bytes which
    // can be fed into btoa.
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
      function toSolidBytes(match, p1) {
        return String.fromCharCode('0x' + p1);
      }));
  },
  decode(str) {
    // Going backwards: from bytestream, to percent-encoding, to original string.
    return decodeURIComponent(atob(str).split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  },
};

export function show(el, visible) {
  if (visible == null) {
    visible = true;
  }
  return el.hidden = !visible;
}
export function showing(el) {
  return !el.hidden;
}

export class State {
  constructor(/*...states*/) {
    this._states = arguments;
    this._state = this._states[0];
    this._listeners = [];

    if (!this._states || this._states.length < 2) {
      throw new Error('States must have more than 1 states');
    }
  }

  is(s) {
    return this._state === s;
  }
  moveTo(to) {
    const from = this._state;
    this._state = to;
    this._callChangeListeners(from, to);
  }

  _callChangeListeners(from, to) {
    this._listeners.forEach(l => {
      if (typeof l === 'function') {
        l();
        return;
      }

      if (l.from === from && l.to === to) {
        l.fn();
        return;
      }
    });
  }

  addChangeListener() {
    let listener = arguments[0];
    if (
      arguments.length === 3
      && Boolean(typeof arguments[0])
      && Boolean(typeof arguments[1])
      && typeof arguments[2] !== 'function'
    ) {
      listener = {
        from: arguments[0],
        to: arguments[1],
        fn: arguments[2],
      };
    } else if (typeof listener !== 'function') {
      throw new TypeError(`addChangeListener args must be just function, or from:string to:string callback:function, but was ${arguments}`);
    }
    this._listeners.push(listener);
  }
}
