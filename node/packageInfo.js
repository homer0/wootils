const fs = require('fs-extra');
const { provider } = require('jimple');
/**
 * @module node/packageInfo
 */

/**
 * @typedef {import('./pathUtils').PathUtils} PathUtils
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
 * {@link module:node/packageInfo~packageInfo|packageInfo} as the `packageInfo` resource.
 *
 * @example
 * // Register it on the container
 * container.register(packageInfoProvider);
 * // Getting access to the service value
 * const info = container.get('packageInfo');
 *
 * @type {Provider}
 * @tutorial packageInfo
 */
const packageInfoProvider = provider((app) => {
  app.set('packageInfo', () => packageInfo(app.get('pathUtils')));
});

module.exports.packageInfo = packageInfo;
module.exports.packageInfoProvider = packageInfoProvider;
