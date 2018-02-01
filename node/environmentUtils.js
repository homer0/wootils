const { provider } = require('jimple');
/**
 * A simple service to avoid calling `process.env` on multiples places of an app.
 */
class EnvironmentUtils {
  /**
   * Class constructor.
   */
  constructor() {
    /**
     * The current `NODE_ENV`. If the variable is empty, the value will be `development`.
     * @type {string}
     */
    this.env = this.get('NODE_ENV', 'development');
    /**
     * Whether or not the environment is production.
     * @type {boolean}
     */
    this.production = this.env === 'production';
  }
  /**
   * Get the value of an environment variable.
   * @param {string} name              The name of the variable.
   * @param {string} [defaultValue=''] A fallback value in case the variable is `undefined`
   * @return {string}
   * @todo add a `require` parameter to throw an error if the variable is not preset.
   */
  get(name, defaultValue = '') {
    // eslint-disable-next-line no-process-env
    let value = process.env[name];
    if (typeof value === 'undefined') {
      value = defaultValue;
    }

    return value;
  }
  /**
   * Check whether or not the environment is for development.
   * @return {boolean}
   */
  get development() {
    return !this.production;
  }
}
/**
 * The service provider that once registered on the app container will set an instance of
 * `EnvironmentUtils` as the `environmentUtils` service.
 * @example
 * // Register it on the container
 * container.register(environmentUtils);
 * // Getting access to the service instance
 * const environmentUtils = container.get('environmentUtils');
 * @type {Provider}
 */
const environmentUtils = provider((app) => {
  app.set('environmentUtils', () => new EnvironmentUtils());
});

module.exports = {
  EnvironmentUtils,
  environmentUtils,
};
