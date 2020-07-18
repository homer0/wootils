const { providerCreator } = require('../shared/jimpleFns');
/**
 * @module node/environmentUtils
 */

/**
 * @typedef {import('../shared/jimpleFns').ProviderCreatorWithOptions<O>}
 * ProviderCreatorWithOptions
 * @template O
 */

/**
 * @typedef {Object} EnvironmentUtilsProviderOptions
 * @property {string} serviceName
 * The name that will be used to register an instance of {@link EnvironmentUtils}. Its default
 * value is `environmentUtils`.
 *
 * @parent module:node/environmentUtils
 */

/**
 * A simple service to avoid calling `process.env` on multiples places of an app.
 *
 * @parent module:node/environmentUtils
 * @tutorial environmentUtils
 */
class EnvironmentUtils {
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
   * Whether or not the environment is for development.
   *
   * @type {boolean}
   */
  get development() {
    return !this.production;
  }
}
/**
 * The service provider to register an instance of {@link EnvironmentUtils} on the container.
 *
 * @type {ProviderCreatorWithOptions<EnvironmentUtilsProviderOptions>}
 * @tutorial environmentUtils
 */
const environmentUtils = providerCreator((options = {}) => (app) => {
  app.set(options.serviceName || 'environmentUtils', () => new EnvironmentUtils());
});

module.exports.EnvironmentUtils = EnvironmentUtils;
module.exports.environmentUtils = environmentUtils;
