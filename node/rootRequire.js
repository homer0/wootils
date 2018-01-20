const { provider } = require('jimple');
/**
 * Generates a function to require a file relative to the project root directory.
 * @param {PathUtils} pathUtils To build the path to the files it will `require`.
 * @return {Function(string):*}
 */
const rootRequire = (pathUtils) =>
  (path) =>
    // eslint-disable-next-line global-require,import/no-dynamic-require
    require(pathUtils.join(path));

/**
 * The service provider that once registered on the app container will set the result of
 * `rootRequire(pathUtils)` as the `rootRequire` service.
 * @example
 * // Register is on the container
 * container.register(rootRequireProvider);
 * // Getting access to the service instance
 * const rootRequire = container.get('rootRequire');
 * @type {Provider}
 */
const rootRequireProvider = provider((app) => {
  app.set('rootRequire', () => rootRequire(app.get('pathUtils')));
});

module.exports = {
  rootRequire,
  rootRequireProvider,
};
