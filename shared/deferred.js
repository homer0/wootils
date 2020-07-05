/**
 * @module shared/deferred
 */

/**
 * @typedef {Object} DeferredPromise
 * @property {Promise}  promise The deferred promise.
 * @property {Function} resolve The function to resolve the promise.
 * @property {Function} reject  The function to reject the promise.
 * @memberof module.shared/deferred
 */

/**
 * Create a deferred promise using a native Promise.
 *
 * @returns {DeferredPromise}
 * @memberof module.shared/deferred
 */
const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((presolve, preject) => {
    resolve = presolve;
    reject = preject;
  });

  return {
    promise,
    resolve,
    reject,
  };
};

module.exports = deferred;
