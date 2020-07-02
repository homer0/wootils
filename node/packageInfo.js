const fs = require('fs-extra');
const { provider } = require('jimple');
/**
 * Returns the contents of the project `package.json`.
 *
 * @param {PathUtils} pathUtils To build the path to the `package.json`.
 * @returns {Object}
 */
const packageInfo = (pathUtils) => fs.readJsonSync(pathUtils.join('package.json'));
/**
 * The service provider that once registered on the app container will set the result of
 * `packageInfo()` as the `packageInfo` service.
 *
 * @example
 * // Register it on the container
 * container.register(packageInfoProvider);
 * // Getting access to the service value
 * const packageInfo = container.get('packageInfo');
 *
 * @type {Provider}
 */
const packageInfoProvider = provider((app) => {
  app.set('packageInfo', () => packageInfo(app.get('pathUtils')));
});

module.exports.packageInfo = packageInfo;
module.exports.packageInfoProvider = packageInfoProvider;
