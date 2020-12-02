/**
 * @module shared/extendPromise
 */

/**
 * Helper class that creates a proxy for a {@link Promise} in order to add custom
 * properties.
 *
 * The only reason this class exists is so it can "scope" the necessary methods to extend
 * {@link Promise} and avoid workarounds in order to declare them, as they need to call
 * themselves recursively.
 *
 * @parent module:shared/extendPromise
 * @tutorial extendPromise
 */
class PromiseExtender {
  /**
   * @param {Promise}              promise     The promise to extend.
   * @param {Object.<string, any>} properties  A dictionary of custom properties to
   *                                           _inject_ in the promise chain.
   */
  constructor(promise, properties) {
    /**
     * The proxied promise.
     *
     * @type {Proxy<Promise>}
     * @access private
     * @ignore
     */
    this._promise = this._extend(promise, properties);
  }
  /**
   * The extended promise.
   *
   * @type {Proxy<Promise>}
   */
  get promise() {
    return this._promise;
  }
  /**
   * The method that actually extends a promise: it creates a proxy of the promise in
   * order to intercept the getters so it can return the custom properties if requested,
   * and return new proxies when `then`, `catch` and `finally` are called; the reason new
   * proxies are created is because those methods return new promises, and without being
   * proxied, the custom properties would be lost.
   *
   * @param {Promise} promise     The promise to proxy.
   * @param {Object}  properties  A dictionary of custom properties to _inject_ in the
   *                              promise chain.
   * @returns {Proxy<Promise>}
   * @throws {Error} If `promise` is not a valid instance of {@link Promise}.
   * @throws {Error} If `properties` is not an object or if it doesn't have any
   *                 properties.
   * @access private
   * @ignore
   */
  _extend(promise, properties) {
    if (!(promise instanceof Promise)) {
      throw new Error("'promise' must be a valid Promise instance");
    } else if (!properties || !Object.keys(properties).length) {
      throw new Error("'properties' must be an object with at least one key");
    }

    return new Proxy(promise, {
      /**
       * This is a trap for when something is trying to read/access a property for the
       * promise.
       * The function first validates if it's one of the functions
       * (`then`/`catch`/`finally`) in order to return a proxied function; then, if it's
       * another function (one that doesn't return another promise), it just calls the
       * original; finally, before doing a fallback to the original promise, it checks if
       * it's one of the custom properties that exented the promise.
       *
       * @param {Promise} target  The original promise.
       * @param {string}  name    The name of the property.
       * @returns {*}
       */
      get: (target, name) => {
        let result;
        if (['then', 'catch', 'finally'].includes(name)) {
          result = this._extendFunction(target[name].bind(target), properties);
        } else if (target[name] && typeof target[name].bind === 'function') {
          result = target[name].bind(target);
        } else if (properties[name]) {
          result = properties[name];
        } else {
          result = target[name];
        }

        return result;
      },
    });
  }
  /**
   * Creates a proxy for a promise function (`then`/`catch`/`finally`) so the returned
   * promise can also be extended.
   *
   * @param {Function} fn          The promise function to proxy.
   * @param {Object}   properties  A dictionary of custom properties to _inject_ in the
   *                               promise chain.
   * @returns {Proxy<Function>}
   * @access private
   * @ignore
   */
  _extendFunction(fn, properties) {
    return new Proxy(fn, {
      /**
       * This is a trap for when a function gets called (remember this gets used for
       * `then`/
       * `catch`/`finally`); it processes the result using the oringinal function and
       * since promise methods return a promise, instead of returning the original result,
       * it returns an _extended_ version of it.
       *
       * @param {Function} target   The original function.
       * @param {Promise}  thisArg  The promise the function belongs to.
       * @param {Array}    args     The list of arguments sent to the trap.
       * @returns {Promise}
       */
      apply: (target, thisArg, args) => {
        const value = target.bind(thisArg)(...args);
        return this._extend(value, properties);
      },
    });
  }
}

/**
 * Extends a {@link Promise} by injecting custom properties using a {@link Proxy}. The
 * custom properties will be available on the promise chain no matter how many `then`s,
 * `catch`s or `finally`s are added.
 *
 * @param {Promise} promise     The promise to extend.
 * @param {Object}  properties  A dictionary of custom properties to _inject_ in the
 *                              promise chain.
 * @returns {Proxy<Promise>}
 * @throws {Error} If `promise` is not a valid instance of {@link Promise}.
 * @throws {Error} If `properties` is not an object or if it doesn't have any
 *                 properties.
 * @tutorial extendPromise
 */
const extendPromise = (promise, properties) =>
  new PromiseExtender(promise, properties).promise;

module.exports = extendPromise;
