const { provider } = require('jimple');
/**
 * @module node/environmentUtils
 */

/**
 * A simple service to avoid calling `process.env` on multiples places of an app.
 *
 * @memberof module.node/environmentUtils
 */
class EnvironmentUtils {
  /**
   * Class constructor.
   */
  constructor() {
    /**
     * The current `NODE_ENV`. If the variable is empty, the value will be `development`.
     *
     * @type {string}
     */
    this.env = this.get('NODE_ENV', 'development');
    /**
     * Whether or not the environment is production.
     *
     * @type {boolean}
     */
    this.production = this.env === 'production';
  }
  /**
   * Checks whether an environment variable exists or not.
   *
   * @param {string} name The name of the variable.
   * @returns {boolean}
   */
  exists(name) {
    // eslint-disable-next-line no-process-env
    return typeof process.env[name] !== 'undefined';
  }
  /**
   * Gets the value of an environment variable.
   *
   * @param {string}  name              The name of the variable.
   * @param {string}  [defaultValue=''] A fallback value in case the variable is `undefined`.
   * @param {boolean} [required=false]  If the variable is required and `undefined`, it will throw
   *                                    an error.
   * @returns {string}
   * @throws {Error} If `required` is set to `true` and the variable is `undefined`.
   */
  get(name, defaultValue = '', required = false) {
    let value;
    if (this.exists(name)) {
      // eslint-disable-next-line no-process-env
      value = process.env[name];
    } else {
      if (required) {
        throw new Error(`The following environment variable is missing: ${name}`);
      }

      value = defaultValue;
    }

    return value;
  }
  /**
   * Sets the value of an environment variable.
   *
   * @param {string} name              The name of the variable.
   * @param {string} value             The value of the variable.
   * @param {string} [overwrite=false] If the variable already exists, the method won't overwrite
   *                                   it, unless you set this parameter to `true`.
   * @returns {boolean} Whether or not the variable was set.
   */
  set(name, value, overwrite = false) {
    let result;
    if (!this.exists(name) || overwrite) {
      // eslint-disable-next-line no-process-env
      process.env[name] = value;
      result = true;
    } else {
      result = false;
    }

    return result;
  }
  /**
   * Check whether or not the environment is for development.
   *
   * @returns {boolean}
   */
  get development() {
    return !this.production;
  }
}
/**
 * The service provider that once registered on the app container will set an instance of
 * `EnvironmentUtils` as the `environmentUtils` service.
 *
 * @example
 * // Register it on the container
 * container.register(environmentUtils);
 * // Getting access to the service instance
 * const environmentUtils = container.get('environmentUtils');
 *
 * @type {Provider}
 */
const environmentUtils = provider((app) => {
  app.set('environmentUtils', () => new EnvironmentUtils());
});

module.exports.EnvironmentUtils = EnvironmentUtils;
module.exports.environmentUtils = environmentUtils;
