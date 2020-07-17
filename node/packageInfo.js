const fs = require('fs-extra');
const { providerCreator } = require('../shared/jimpleFns');
const { deepAssign } = require('../shared/deepAssign');
/**
 * @module node/packageInfo
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
 * @typedef {Object} PackageInfoServiceMap
 * @property {string|PathUtils} [pathUtils]
 * The name of service for {@link PathUtils} or an instance of it. `pathUtils` by default.
 * @parent module:node/packageInfo
 */

/**
 * @typedef {Object} PackageInfoProviderOptions
 * @property {string} serviceName
 * The name that will be used to register the result of
 * {@link module:node/packageInfo~packageInfo|packageInfo}. Its default value is `packageInfo`.
 * @property {PackageInfoServiceMap} services
 * A dictionary with the services that need to be injected on the function.
 * @parent module:node/packageInfo
 */

/**
 * Gets the contents of the implementation's `package.json`.
 *
 * @param {PathUtils} pathUtils To build the path to the `package.json`.
 * @returns {Object.<string,*>}
 * @tutorial packageInfo
 * @todo This should be `async`, or at least have an async alternative.
 */
const packageInfo = (pathUtils) => fs.readJsonSync(pathUtils.join('package.json'));

/**
 * The service provider that once registered on the app container will set the result of
 * {@link module:node/packageInfo~packageInfo|packageInfo} as a service.
 *
 * @type {ProviderCreatorWithOptions<PackageInfoProviderOptions>}
 * @tutorial packageInfo
 */
const packageInfoProvider = providerCreator((options = {}) => (app) => {
  app.set(options.serviceName || 'packageInfo', () => {
    /**
     * @type {PackageInfoProviderOptions}
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

    return packageInfo(usePathUtils);
  });
});

module.exports.packageInfo = packageInfo;
module.exports.packageInfoProvider = packageInfoProvider;
