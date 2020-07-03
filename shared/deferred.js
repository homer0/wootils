/**
 * @typedef {Object} DeferredPromise
 * @property {Promise}  promise The deferred promise.
 * @property {Function} resolve The functon to resolve the promise.
 * @property {Function} reject  The functon to reject the promise.
 */

/**
 * Create a deferred promise using a native Promise.
 *
 * @returns {DeferredPromise}
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
