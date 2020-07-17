const { providerCreator } = require('../shared/jimpleFns');
const { deepAssign } = require('../shared/deepAssign');
/**
 * @module node/rootRequire
 */

/**
 * @typedef {import('./pathUtils').PathUtils} PathUtils
 */

/**
 * @typedef {import('../shared/jimpleFns').ProviderCreatorWithOptions<O>}
 * ProviderCreatorWithOptions
 * @template O
 */

/**
 * @typedef {Object} RootRequireServiceMap
 * @property {string|PathUtils} [pathUtils]
 * The name of service for {@link PathUtils} or an instance of it. `pathUtils` by default.
 * @parent module:node/rootRequire
 */

/**
 * @typedef {Object} RootRequireProviderOptions
 * @property {string} serviceName
 * The name that will be used to register the result of
 * {@link module:node/rootRequire~rootRequire|rootRequire}. Its default value is `rootRequire`.
 * @property {RootRequireServiceMap} services
 * A dictionary with the services that need to be injected on the function.
 * @parent module:node/rootRequire
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
 * {@link module:node/rootRequire~rootRequire|rootRequire} as a service.
 *
 * @type {ProviderCreatorWithOptions<RootRequireProviderOptions>}
 * @tutorial rootRequire
 */
const rootRequireProvider = providerCreator((options = {}) => (app) => {
  app.set(options.serviceName || 'rootRequire', () => {
    /**
     * @type {RootRequireProviderOptions}
     * @ignore
     */
    const useOptions = deepAssign(
      {
        services: {
          pathUtils: 'pathUtils',
        },
      },
      options,
    );

    const { pathUtils } = useOptions.services;
    const usePathUtils = typeof pathUtils === 'string' ?
      app.get(pathUtils) :
      pathUtils;

    return rootRequire(usePathUtils);
  });
});

module.exports.rootRequire = rootRequire;
module.exports.rootRequireProvider = rootRequireProvider;
