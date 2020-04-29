/**
 * @typedef {any} HandlerData
 * @typedef {(data: HandlerData) => void} Handler
 */

export const Events = new class {
  constructor() {
    /**
     * @type {{[key: string]: Array<Handler>}}
     * @private
     **/
    this._events = {};
  }

  /**
   * @param {string} name
   * @param {HandlerData} data
   */
  send(name, data) {
    const handlers = this._events[name];
    if (!handlers) {
      return;
    }
    handlers.forEach(h => h.call(h, data));
  }

  /**
   * @param {string} name
   * @param {Handler} handler
   */
  on(name, handler) {
    const handlers = this._events[name] || (this._events[name] = []);
    handlers.push(handler);
  }

  /**
   * @param {string} name
   * @param {Handler} handler
   */
  off(name, handler) {
    const handlers = this._events[name];
    if (!handlers) {
      return;
    }
    this._events[name] = handlers.filter(h => h !== handler);
  }
}
