const { provider } = require('jimple');
/**
 * @module node/rootRequire
 */

/**
 * Exactly like `require`, but th epath is relative to the project root directory.
 *
 * @callback RootRequireFn
 * @param {string} path The path to the file, relative to the project root directory.
 * @returns {Object}
 * @parent module:node/rootRequire
 * @tutorial rootRequire
 */

/**
 * Generates a function to require a file relative to the project root directory.
 *
 * @param {PathUtils} pathUtils To build the path to the files it will `require`.
 * @returns {RootRequireFn}
 * @tutorial rootRequire
 */
const rootRequire = (pathUtils) => (path) =>
  // eslint-disable-next-line global-require,import/no-dynamic-require,implicit-arrow-linebreak
  require(pathUtils.join(path));

/**
 * The service provider that once registered on the app container will set the result of
 * {@link module:node/rootRequire~rootRequire|rootRequire} as the `rootRequire` service.
 *
 * @example
 * // Register it on the container
 * container.register(rootRequireProvider);
 * // Getting access to the service instance
 * const rootRequireFn = container.get('rootRequire');
 *
 * @type {Provider}
 * @tutorial rootRequire
 */
const rootRequireProvider = provider((app) => {
  app.set('rootRequire', () => rootRequire(app.get('pathUtils')));
});

module.exports.rootRequire = rootRequire;
module.exports.rootRequireProvider = rootRequireProvider;
