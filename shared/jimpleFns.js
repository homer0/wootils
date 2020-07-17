/* eslint-disable jsdoc/require-jsdoc */

/**
 * @module shared/jimpleFns
 */

/**
 * @typedef {import('jimple')} Jimple
 * @external Jimple
 * @see https://yarnpkg.com/en/package/jimple
 */

/**
 * @callback ProviderRegisterFn
 * @param {Jimple} app A reference to the dependency injection container.
 * @parent module:shared/jimpleFns
 */

/**
 * @typedef {Object} Provider
 * @property {ProviderRegisterFn} register The method that gets called when registering the
 *                                         provider.
 * @parent module:shared/jimpleFns
 */

/**
 * @callback ProviderCreatorFn
 * @returns {Provider}
 * @parent module:shared/jimpleFns
 */

/**
 * @typedef {Object} Resource
 * @property {Function} key  The function (`fn`) sent to the
 *                           {@link module:shared/jimpleFns~resource|resource} function.
 * @property {boolean}  name This will always be `true` and it's the `name` sent to
 *                           the {@link module:shared/jimpleFns~resource|resource} function.
 * @parent module:shared/jimpleFns
 */

/**
 * @typedef {Proxy<Function>} ResourceCreator
 * @property {Function} key  The result of the `creatorFn` sent to the
 *                           {@link module:shared/jimpleFns~resourceCreator|resourceCreator}
 *                           function.
 * @property {boolean}  name This will always be `true` and it's the `name` sent to
 *                           the {@link module:shared/jimpleFns~resourceCreator|resourceCreator}
 *                           function.
 * @parent module:shared/jimpleFns
 */

/**
 * @callback ResourcesCollectionCreator
 * @param {Object.<string,R>} items The dictionary of items to add to the collection.
 * @returns {Object.<string,R>} In additions to the original dictionary of items, the returned
 *                              object will have the collection flag (`name`), and the `key`
 *                              function (`fn`) to interact with the collection.
 * @template R
 * @throws {Error} If one of the items key is the collection `name` or `key`.
 * @throws {Error} If one of the items doesn't have a `key` function.
 * @parent module:shared/jimpleFns
 */

/**
 * @callback ResourcesCollectionFn
 * @param {Object.<string,R>} items The dictionary of items to add to the collection.
 * @param {...*}              args  The arguments that were sent to the collection `key` function.
 * @template R
 * @parent module:shared/jimpleFns
 */

/**
 * Generates a resource entity with a specific function Jimple or an abstraction of jimple can
 * make use of.
 *
 * @example
 * <caption>The `provider` shorthand functino is an _entity_ with a `register` function:</caption>
 * const someProvider = resource('provider', 'register', (app) => {
 *   // ...
 * });
 *
 * @param {string}   name The name of the resource. The generated object will have a property with
 *                        its name and the value `true`.
 * @param {string}   key  The name of the key that will have the function on the generated object.
 * @param {Function} fn   The function to interact with the resource.
 *
 * @returns {Resource}
 */
const resource = (name, key, fn) => ({
  [key]: fn,
  [name]: true,
});
/**
 * This is a helper to dynamically configure a resource before creating it. The idea here is that
 * the returned object can be used as a function, to configure the resource, or as a resource.
 * The difference with {@link module:shared/jimpleFns~resource|resource} is that, instead of
 * providing the function to interact with the generated resource, the `creatorFn` parameter is a
 * function that returns a function like the one you would use on
 * {@link module:shared/jimpleFns~resource|resource}. What this function actually returns is a
 * {@link Proxy}, that when used as a function, it will return a resource; but when used as a
 * resource, it will internally call `creatorFn` (and cache it) without parameters. It's very
 * important that all the parameters of the `creatorFn` are optional, otherwise it will cause an
 * error if called as a resource.
 *
 * @example
 * <caption>Let's use `provider` again, that requires a `register` function:</caption>
 * const someProvider = resourceCreator(
 *   'provider',
 *   'register',
 *   (options = {}) => (app) => {
 *     // ...
 *   },
 * );
 *
 * // Register it as a resource
 * container.register(someProvider);
 *
 * // Register it after creating a configured resource
 * container.register(someProvider({ enabled: false }));
 *
 * @param {string}   name      The name of the resource. The generated object will have a property
 *                             with its name and the value `true`.
 * @param {string}   key       The name of the key that will have the function on the generated
 *                             object.
 * @param {Function} creatorFn The function that will generate the 'resource function'.
 *
 * @returns {ResourceCreator}
 */
const resourceCreator = (name, key, creatorFn) => new Proxy(
  (...args) => resource(name, key, creatorFn(...args)),
  {
    name,
    resource: null,
    get(target, property) {
      let result;
      if (property === this.name) {
        result = true;
      } else if (property === key) {
        if (this.resource === null) {
          this.resource = creatorFn();
        }
        result = this.resource;
      } else {
        result = target[property];
      }

      return result;
    },
  },
);
/**
 * Generates a collection of resources that can be called individually or all together via the
 * `key` function.
 *
 * @example
 * <caption>
 * Following all the other examples(and the implementations), let's create a a providers collection.
 * </caption>
 * const firstProvider = resource('provider', 'register', (app) => {
 *   // ...
 * });
 * const secondProvider = resourceCreator(
 *   'provider',
 *   'register',
 *   (options = {}) => (app) => {
 *     // ...
 *   },
 * );
 *
 * const bothProviders = resourcesCollection('providers', 'register')({
 *   firstProvider,
 *   secondProvider,
 * });
 *
 *
 * // Register all at once
 * container.register(bothProviders);
 * // Register only one
 * container.register(bothProviders.firstProvider);
 * // Register only one, after configuring it
 * container.register(bothProviders.secondProvider({ enabled: false }));
 *
 * @param {string}                 name      The name of the collection. When a collection is
 *                                           generated, the returned object will have a property
 *                                           with its name and the value `true`.
 * @param {string}                 key       The name of the key that will have the function to
 *                                           interact with the collection on the final object.
 * @param {?ResourcesCollectionFn} [fn=null] By default, if the `key` function of the collection
 *                                           gets called, all the items of the collection will be
 *                                           called with the same arguments. But you can specify a
 *                                           function that will receive all the items and all the
 *                                           arguments to customize the interaction.
 * @returns {ResourcesCollectionCreator<Resource>}
 */
const resourcesCollection = (name, key, fn = null) => (items) => {
  const invalidKeys = [name, key];
  const itemsKeys = Object.keys(items);
  const invalidKey = itemsKeys.some((itemKey) => invalidKeys.includes(itemKey));
  if (invalidKey) {
    throw new Error(
      `No item on the collection can have the keys \`${name}\` nor \`${key}\``,
    );
  }

  const invalidItem = itemsKeys.find((itemKey) => typeof items[itemKey][key] !== 'function');
  if (invalidItem) {
    throw new Error(
      `The item \`${invalidItem}\` is invalid: it doesn't have a \`${key}\` function`,
    );
  }

  const useFn = fn ?
    (...args) => fn(items, ...args) :
    (...args) => itemsKeys.forEach((item) => {
      items[item][key](...args);
    });

  return {
    ...resource(
      name,
      key,
      useFn,
    ),
    ...items,
  };
};
/**
 * Creates a provider resource.
 *
 * @param {ProviderRegisterFn} registerFn The function the container will call in order to
 *                                        register the provider.
 * @returns {Provider}
 */
const provider = (registerFn) => resource('provider', 'register', registerFn);
/**
 * Creates a configurable provider.
 *
 * @param {ProviderCreatorFn} creatorFn The function that will be used to create the provider.
 * @returns {ResourceCreator}
 */
const providerCreator = (creatorFn) => resourceCreator('provider', 'register', creatorFn);
/**
 * Creates a collection of providers.
 *
 * @type {ResourcesCollectionCreator<Provider>}
 */
const providers = resourcesCollection('providers', 'register');

module.exports.resource = resource;
module.exports.resourceCreator = resourceCreator;
module.exports.resourcesCollection = resourcesCollection;
module.exports.provider = provider;
module.exports.providerCreator = providerCreator;
module.exports.providers = providers;
