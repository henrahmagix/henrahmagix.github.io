import { createHTML, show } from './utils.js';

function noop() { }
function handleError(err) {
  // TODO: print error in DOM so it can be seen on mobile.
  alert(err);
  console.error(err);
  return true;
}

window.onerror = (msg, src, lineno, colno, err) => handleError(err);
window.addEventListener('unhandledrejection', event => {
  event.preventDefault();
  handleError(event.reason);
});

const USER = 'henrahmagix';
const API_URL = `https://api.github.com/repos/${USER}/henrahmagix.github.io`;

const TOKEN_KEY = 'gh_token';

const loadingElement = createHTML('<div id="loading"><i class="fas fa-spinner fa-pulse"></i></div>');
document.body.appendChild(loadingElement);

export class Admin {
  constructor({
    handleLogin,
  }) {
    this.handleLogin = handleLogin || noop;

    const existingToken = localStorage.getItem(TOKEN_KEY);
    if (existingToken) {
      this.login(existingToken);
    } else {
      show(loadingElement, false);
    }
  }

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

  async login(token) {
    if (!token) {
      this.loggedIn = false;
      handleError(new Error('Access token must not be empty'));
      return;
    }

    this.api = new Api(token);

    try {
      await this.api.makeRequest('/keys'); // fails for anonymous
      localStorage.setItem(TOKEN_KEY, token);
      this.loggedIn = true;
    } catch (err) {
      this.loggedIn = false;
      handleError(new Error(`failed to login: ${err}`));
    }
  }
}

export class Api {
  constructor(token) {
    this.token = token || localStorage.getItem(TOKEN_KEY);
    this.apiUrl = API_URL;
  }

  set loading(isLoading) {
    show(loadingElement, isLoading);
  }

  get authHeader() {
    if (!this.token) {
      throw new Error('Access token is empty');
    }
    const auth = btoa(`${USER}:${this.token}`); // base64 encoded
    return `Basic ${auth}`;
  }

  async makeRequest(url, opts) {
    opts = opts || {};
    opts.method = opts.method || 'GET';
    opts.body = opts.body && JSON.stringify(opts.body);

    opts.headers = opts.headers || new Headers();
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
  constructor(message, {status, body}) {
    super(`${message}: ${status} ${body}`);
    this.name = 'ApiResponseError';
    this.status = status;
    this.body = body;
  }
}
