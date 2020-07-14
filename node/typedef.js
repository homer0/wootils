/**
 * @typedef {import('jimple')} Jimple
 * @external Jimple
 * @see https://yarnpkg.com/en/package/jimple
 */

/**
 * @callback ProviderRegisterMethod
 * @param {Jimple} app A reference to the dependency injection container.
 */

/**
 * @typedef {Object} Provider
 * @property {ProviderRegisterMethod} register The method that gets called when
 *                                             registering the provider.
 */
