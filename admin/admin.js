import { createHTML, show } from './utils.js';

function noop() { }

/** @param {Error} err */
function handleError(err) {
  // TODO: print error in DOM so it can be seen on mobile.
  if (err.hasOwnProperty('stack') && err.stack.includes(err.toString())) {
    alert(err.stack);
  } else {
    alert(err);
  }
  console.error(err);
  return true;
}

window.onerror = (msg, src, lineno, colno, err) => {
  // If the error stack doesn't include a link to the src, allow this error to
  // continue bubbling up so the browser console can make the link.
  if (err.stack && !err.stack.includes(src)) {
    alert(`${msg} ${src}:${lineno}:${colno}`);
    // Allow to continue, else we won't get a link to the src in the console.
    return false;
  }
  return handleError(err);
}
window.addEventListener('unhandledrejection', event => {
  event.preventDefault();
  handleError(event.reason);
});

const USER = 'henrahmagix';
const API_URL = `https://api.github.com/repos/${USER}/henrahmagix.github.io`;

const TOKEN_KEY = 'gh_token';

const loadingElement = createHTML('<div id="loading" hidden><i class="fas fa-spinner fa-pulse"></i></div>');
document.body.appendChild(loadingElement);

export class Admin {
  /** @typedef {(loggedIn: boolean) => void} HandleLogin */

  /** @param {HandleLogin} handleLogin */
  static onLogin(handleLogin) {
    new this({ handleLogin });
  }

  /**
   * @param {object} opts
   * @param {HandleLogin} opts.handleLogin
   */
  constructor({
    handleLogin,
  }) {
    this.handleLogin = handleLogin || noop;

    const existingToken = localStorage.getItem(TOKEN_KEY);
    if (existingToken) {
      this.loggedIn = true;
    }
  }

  /** @param {boolean} loggedIn */
  set loggedIn(loggedIn) {
    if (!loggedIn) {
      localStorage.setItem(TOKEN_KEY, '');
    }

    try {
      this.handleLogin(Boolean(loggedIn));
    } catch (err) {
      handleError(err);
    }
  }

  logout() {
    this.loggedIn = false;
  }

  /** @param {string} token */
  async login(token) {
    if (!token) {
      this.loggedIn = false;
      handleError(new Error('Access token must not be empty'));
      return;
    }

    try {
      await new Api(token).makeRequest('/keys'); // fails for anonymous
      localStorage.setItem(TOKEN_KEY, token);
      this.loggedIn = true;
    } catch (err) {
      this.loggedIn = false;
      handleError(new Error(`failed to login: ${err}`));
    }
  }
}

export class Api {
  /** @param {string} [token] */
  constructor(token) {
    this.token = token || localStorage.getItem(TOKEN_KEY);
    this.apiUrl = API_URL;
  }

  /** @param {boolean} isLoading */
  set loading(isLoading) {
    show(loadingElement, isLoading);
  }

  /**
   * @readonly
   * @returns {string}
   */
  get authHeader() {
    if (!this.token) {
      throw new Error('Access token is empty');
    }
    const auth = btoa(`${USER}:${this.token}`); // base64 encoded
    return `Basic ${auth}`;
  }

  /**
   * @param {string} url
   * @param {RequestInit} [opts]
   * @returns {Promise<any|Api.ResponseError>}
   */
  async makeRequest(url, opts) {
    opts = opts || {};
    opts.method = opts.method || 'GET';

    opts.headers = new Headers(opts.headers);
    opts.headers.set('Authorization', this.authHeader);

    this.loading = true;
    try {
      const res = await fetch(this.apiUrl + url, opts);
      if (!res.ok) {
        throw new Api.ResponseError('fetch failed', {status: res.status, body: await res.text()});
      }

      if (res.headers.get('Content-Type').includes('json')) {
        return await res.json();
      }
      return await res.text();
    } finally {
      this.loading = false;
    }
  }
}

Api.ResponseError = class extends Error {
  /**
   * @param {string} message
   * @param {{status:number, body:string}} body
   */
  constructor(message, {status, body}) {
    super(`${message}: ${status} ${body}`);
    this.name = 'ApiResponseError';
    this.status = status;
    this.body = body;
  }
}
