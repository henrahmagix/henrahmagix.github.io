const USER = 'henrahmagix';
const REPO = 'henrahmagix.github.io';
const API_URL = `https://api.github.com/repos/${USER}/${REPO}`;
const API_URL_AUTH_TEST = API_URL + '/keys';

function noop() {}
function defaultErrorHandler(err) { throw err; }

export class Admin {
  constructor({
    handleLoading,
    handleLogin,
    handleError,
  }) {
    this.handleLoading = handleLoading || noop;
    this.handleLogin = handleLogin || noop;
    this.handleError = handleError || defaultErrorHandler;
  }

  set loading(isLoading) {
    this.handleLoading(isLoading);
  }

  set loggedIn(loggedIn) {
    this.handleLogin(Boolean(loggedIn));
  }

  async login() {
    const token = prompt('Enter GitHub access token');
    if (!token) {
      this.loggedIn = false;
      this.handleError(Error('Access token must not be empty'));
      return;
    }

    this.api = new Api(token);

    this.loading = true;
    try {
      await this.api.fetch(API_URL_AUTH_TEST);
      this.loggedIn = true;
    } catch (err) {
      this.loggedIn = false;
      this.handleError(Error(`failed to login: ${err}`));
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
