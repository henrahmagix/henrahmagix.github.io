import { createHTML } from '/admin/utils.js';

function noop() { }
function handleError(err) {
  alert(err);
}

window.onerror = handleError;
window.addEventListener('unhandledrejection', event => {
  event.preventDefault();
  window.onerror(event.reason);
});

const USER = 'henrahmagix';
const API_URL = `https://api.github.com/repos/${USER}/henrahmagix.github.io`;
const API_URL_AUTH_TEST = API_URL + '/keys';

const TOKEN_KEY = 'gh_token';

const loadingElement = createHTML('<div id="loading" hidden><i class="fas fa-spinner fa-pulse"></i></div>');
document.body.appendChild(loadingElement);

export class Admin {
  constructor({
    handleLogin,
  }) {
    this.handleLogin = handleLogin || noop;

    const existingToken = localStorage.getItem(TOKEN_KEY);
    if (existingToken) {
      this.login(existingToken);
    }
  }

  set loading(isLoading) {
    loadingElement.hidden = !isLoading;
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
      handleError(Error('Access token must not be empty'));
      return;
    }

    this.api = new Api(token);

    this.loading = true;
    try {
      await this.api.fetch(API_URL_AUTH_TEST);
      this.loggedIn = true;
      localStorage.setItem(TOKEN_KEY, token);
    } catch (err) {
      this.loggedIn = false;
      handleError(Error(`failed to login: ${err}`));
    } finally {
      this.loading = false;
    }
  }
}

class Api {
  constructor(token) {
    this.token = token;
  }

  get authHeader() {
    if (!this.token) {
      throw new Error('Access token is empty');
    }
    const auth = btoa(`${USER}:${this.token}`); // base64 encoded
    return `Basic ${auth}`;
  }

  async fetch(url) {
    const headers = new Headers();
    headers.set('Authorization', this.authHeader);

    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(`fetch failed: ${res.status} body=${await res.text()}`);
    }

    return res.json();
  }
}
