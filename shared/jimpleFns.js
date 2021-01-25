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
 * @external PropertyDescriptor
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty
 */

/**
 * @callback ProviderRegisterFn
 * @param {Jimple} app  A reference to the dependency injection container.
 * @parent module:shared/jimpleFns
 */

/**
 * @typedef {Object} Provider
 * @example
 *
 *   container.register(myProvider);
 *
 * @property {ProviderRegisterFn} register  The method that gets called when registering
 *                                          the provider.
 * @parent module:shared/jimpleFns
 */

/**
 * A function called in order to generate a {@link Provider}. They usually have different
 * options that will be sent to the provider creation.
 *
 * @callback ProviderCreatorFn
 * @returns {Provider}
 * @parent module:shared/jimpleFns
 */

/**
 * A special kind of {@link Provider} that can be used as a regular provider, or it can
 * also be called as a function with custom options in order to obtain a "configured
 * {@link Provider}".
 *
 * @callback ProviderCreator
 * @example
 *
 *   // Register it with its default options.
 *   container.register(myProvider);
 *   // Register it with custom options.
 *   container.register(myProvider({ enabled: true }));
 *
 * @param {Partial<O>} [options={}]  The options to create the provider.
 * @property {ProviderRegisterFn} register  The method that gets called when registering
 *                                          the provider.
 * @returns {Provider}
 * @template O
 * @parent module:shared/jimpleFns
 */

/**
 * @typedef {Object.<string, Provider>} ProvidersDictionary
 */

/**
 * @typedef {ProvidersDictionary & ProvidersProperties} Providers
 */

/**
 * @typedef {Object} ProvidersProperties
 * @property {ProviderRegisterFn} register  The function that will register all the
 *                                          providers on the container.
 */

/**
 * Generates a collection of {@link Provider} objects that can be used to register all of
 * them at once.
 *
 * @callback ProvidersCreator
 * @example
 *
 *   // Generate the collection
 *   const myProviders = providers({ oneProvider, otherProvider });
 *   // Register all of them
 *   container.register(myProviders);
 *   // Register only one
 *   container.register(myProviders.otherProvider);
 *
 * @param {Object.<string, Provider>} providers  The dictionary of providers to add to the
 *                                               collection.
 * @returns {Providers}
 */

/**
 * @typedef {Object} Resource
 * @property {Function} key   The function (`fn`) sent to the
 *                            {@link module:shared/jimpleFns~resource|resource} function.
 * @property {boolean}  name  This will always be `true` and it's the `name` sent to the
 *                            {@link module:shared/jimpleFns~resource|resource} function.
 * @parent module:shared/jimpleFns
 */

/**
 * @typedef {Function} ResourceCreator
 * @property {Function} key   The result of the `creatorFn` sent to the
 *                            {@link module:shared/jimpleFns~resourceCreator|resourceCreator}
 *                            function.
 * @property {boolean}  name  This will always be `true` and it's the `name` sent to the
 *                            {@link module:shared/jimpleFns~resourceCreator|resourceCreator}
 *                            function.
 * @parent module:shared/jimpleFns
 */

/**
 * @callback ResourcesCollectionCreator
 * @param {Object.<string, R>} items  The dictionary of items to add to the collection.
 * @returns {Object.<string, R>} In additions to the original dictionary of items, the
 *                               returned object will have the collection flag (`name`),
 *                               and the `key`
 *                               function (`fn`) to interact with the collection.
 * @template R
 * @throws {Error} If one of the items key is the collection `name` or `key`.
 * @throws {Error} If one of the items doesn't have a `key` function.
 * @parent module:shared/jimpleFns
 */

/**
 * @callback ResourcesCollectionFn
 * @param {Object.<string, R>} items  The dictionary of items to add to the collection.
 * @param {...*}               args   The arguments that were sent to the collection `key`
 *                                    function.
 * @template R
 * @parent module:shared/jimpleFns
 */

/**
 * Generates a resource entity with a specific function Jimple or an abstraction of jimple
 * can make use of.
 *
 * @example
 *
 * <caption>
 *   The `provider` shorthand function is an _entity_ with a `register` function:
 * </caption>
 *
 *   const someProvider = resource('provider', 'register', (app) => {
 *     // ...
 *   });
 *
 * @param {string}   name  The name of the resource. The generated object will have a
 *                         property with its name and the value `true`.
 * @param {string}   key   The name of the key that will have the function on the
 *                         generated object.
 * @param {Function} fn    The function to interact with the resource.
 * @returns {Resource}
 */
const resource = (name, key, fn) => ({
  [key]: fn,
  [name]: true,
});
/**
 * This is a helper to dynamically configure a resource before creating it. The idea here
 * is that the returned object can be used as a function, to configure the resource, or as
 * a resource.
 * The difference with {@link module:shared/jimpleFns~resource|resource} is that, instead
 * of providing the function to interact with the generated resource, the `creatorFn`
 * parameter is a function that returns a function like the one you would use on
 * {@link module:shared/jimpleFns~resource|resource}. What this function actually returns
 * is a {@link Proxy}, that when used as a function, it will return a resource; but when
 * used as a resource, it will internally call `creatorFn` (and cache it) without
 * parameters. It's very important that all the parameters of the `creatorFn` are
 * optional, otherwise it will cause an error if called as a resource.
 *
 * @example
 *
 * <caption>Let's use `provider` again, that requires a `register` function:</caption>
 *
 *   const someProvider = resourceCreator(
 *     'provider',
 *     'register',
 *     (options = {}) => (app) => {
 *       // ...
 *     },
 *   );
 *
 *   // Register it as a resource
 *   container.register(someProvider);
 *
 *   // Register it after creating a configured resource
 *   container.register(someProvider({ enabled: false }));
 *
 * @param {string}   name       The name of the resource. The generated object will have a
 *                              property with its name and the value `true`.
 * @param {string}   key        The name of the key that will have the function on the
 *                              generated object.
 * @param {Function} creatorFn  The function that will generate the 'resource function'.
 * @returns {ResourceCreator}
 */
const resourceCreator = (name, key, creatorFn) =>
  new Proxy((...args) => resource(name, key, creatorFn(...args)), {
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
  });
/**
 * Generates a collection of resources that can be called individually or all together via
 * the `key` function.
 *
 * @example
 *
 * <caption>
 *   Following all the other examples(and the implementations), let's create a a providers
 *   collection.
 * </caption>
 *
 *   const firstProvider = resource('provider', 'register', (app) => {
 *     // ...
 *   });
 *   const secondProvider = resourceCreator(
 *     'provider',
 *     'register',
 *     (options = {}) => (app) => {
 *       // ...
 *     },
 *   );
 *
 *   const bothProviders = resourcesCollection(
 *     'providers',
 *     'register',
 *   )({
 *     firstProvider,
 *     secondProvider,
 *   });
 *
 *   // Register all at once
 *   container.register(bothProviders);
 *   // Register only one
 *   container.register(bothProviders.firstProvider);
 *   // Register only one, after configuring it
 *   container.register(bothProviders.secondProvider({ enabled: false }));
 *
 * @param {string}                 name       The name of the collection. When a
 *                                            collection is generated, the returned object
 *                                            will have a property with its name and the
 *                                            value `true`.
 * @param {string}                 key        The name of the key that will have the
 *                                            function to interact with the collection on
 *                                            the final object.
 * @param {?ResourcesCollectionFn} [fn=null]  By default, if the `key` function of the
 *                                            collection gets called, all the items of the
 *                                            collection will be called with the same
 *                                            arguments. But you can specify a function
 *                                            that will receive all the items and all the
 *                                            arguments to customize the interaction.
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

  const invalidItem = itemsKeys.find(
    (itemKey) => typeof items[itemKey][key] !== 'function',
  );
  if (invalidItem) {
    throw new Error(
      `The item \`${invalidItem}\` is invalid: it doesn't have a \`${key}\` function`,
    );
  }

  const useFn = fn
    ? (...args) => fn(items, ...args)
    : (...args) =>
        itemsKeys.forEach((item) => {
          items[item][key](...args);
        });

  return {
    ...resource(name, key, useFn),
    ...items,
  };
};
/**
 * Creates a resource provider.
 *
 * @example
 *
 *   // Define the provider
 *   const myService = provider((app) => {
 *     app.set('myService', () => new MyService());
 *   });
 *
 *   // Register it on the container
 *   container.register(myService);
 *
 * @param {ProviderRegisterFn} registerFn  The function the container will call in order
 *                                         to register the provider.
 * @returns {Provider}
 */
const provider = (registerFn) => resource('provider', 'register', registerFn);
/**
 * Creates a configurable provider. It's configurable because the creator, instead of just
 * being sent to the container to register, it can also be called as a function with
 * custom options and generate a new provider.
 *
 * @example
 *
 *   // Define the provider creator
 *   const myProvider = providerCreator((options = {}) => (app) => {
 *     app.set('myService', () => new MyService(options));
 *   });
 *   // Register it with the default options
 *   container.register(myProvider);
 *   // Register it with custom options
 *   container.register(myProvider({ enabled: true }));
 *
 * @param {ProviderCreatorFn} creatorFn  The function that generates the provider.
 * @returns {ProviderCreator<any>}
 */
const providerCreator = (creatorFn) => resourceCreator('provider', 'register', creatorFn);
/**
 * Creates a collection of providers.
 *
 * @type {ProvidersCreator}
 */
const providers = resourcesCollection('providers', 'register');
/**
 * Helper function for {@link proxyContainer} that gets all the keys of an object, going
 * recursively over its prototype chain.
 *
 * @param {Object} target  The target object.
 * @returns {string[]}
 * @ignore
 */
const getKeys = (target) => {
  let obj = target;
  const keys = [];
  while (obj) {
    keys.push(...Object.getOwnPropertyNames(obj));
    obj = Object.getPrototypeOf(obj);
  }

  return keys.reduce((acc, key) => (acc.includes(key) ? acc : [...acc, key]), []).sort();
};
/**
 * Takes a Jimple container and creates a proxy for it so resouces can be accessed and
 * registered like if they were its properties.
 *
 * @example
 *
 *   const container = proxyContainer(new Jimple());
 *   container.service = () => new MyService();
 *   container.service.doSomething();
 *
 * @param {Jimple} container  The Jimpex container the proxy will be created for.
 * @returns {Jimple} The proxied version of the container.
 */
const proxyContainer = (container) => {
  const keys = getKeys(container);
  const fns = keys
    .filter((key) => typeof container[key] === 'function')
    .reduce(
      (acc, key) => ({
        ...acc,
        [key]: container[key].bind(container),
      }),
      {},
    );

  let proxy;
  /**
   * Registers a resource provider on the container.
   * This version exists so the providers will receive the proxied version.
   *
   * @param {Provider} rProvider  The provider that will register one of more resources on
   *                              the container.
   * @ignore
   */
  const registerWithProxy = (rProvider) => {
    rProvider.register(proxy);
  };

  proxy = new Proxy(container, {
    /**
     * This is the trap called when a property of the proxied object is being accessed. In
     * this case, the trap will check if it's one of the bunded functions, the register
     * function, one of the real properties, or one of the resources.
     *
     * @param {Jimple}          target  The target object.
     * @param {string | symbol} key     The name of the requested property.
     * @returns {*}
     * @ignore
     */
    get: (target, key) => {
      let result;
      if (key === 'proxy') {
        // Add the proxy flag to indicate that properties can be accesed as properties.
        result = true;
      } else if (key === 'register') {
        // If it's the `register` function, set to return the one that uses the proxy...
        result = registerWithProxy;
      } else if (fns[key]) {
        // If it's one of the bounded functions...
        result = fns[key];
      } else if (keys.includes(key)) {
        // If it's one of thebase properties...
        result = container[key];
      } else if (key.startsWith('$')) {
        /**
         * It it starts with `$`, it can be an actual resource, or a 'try-get': try to access a
         * resource, and if it's not registered, return `null`.
         */
        if (container.has(key)) {
          result = container.get(key);
        } else {
          const useKey = key.substr(1);
          result = container.has(useKey) ? container.get(useKey) : null;
        }
      } else {
        // Finally, assume it's a resource.
        result = container.get(key);
      }

      return result;
    },
    /**
     * This is the trap called when the value of a property of the proxied object is being
     * set. In this case, the trap will check that the name is not one of the base keys of
     * the class, to avoid functionality errors, and then call the container `set` method.
     *
     * @param {Jimple}          target  The target object.
     * @param {string | symbol} key     The name of the property.
     * @param {*}               value   The new value of the property.
     * @throws {Error} If `key` is the name of one of the base properties of the class.
     * @ignore
     */
    set: (target, key, value) => {
      if (keys.includes(key)) {
        throw new Error(`The key '${key}' is reserved and cannot be used`);
      }

      container.set(key, value);
    },
    /**
     * This is the trap called when the properties' keys of the proxied object need to be
     * listed.
     * In this case, the trap will list the base properties, plus the resources' keys.
     *
     * @returns {string[]}
     * @ignore
     */
    ownKeys: () => [...keys, ...container.keys()],
    /**
     * This is the trap called when there's a check to see if the proxied object has a
     * specific property (`prop in obj`). In this case, the trap will first check in the
     * container and if it's not present, it will use the container `has` method to check
     * the resources.
     *
     * @param {Jimple}          target  The target object.
     * @param {string | symbol} key     The name of the property.
     * @returns {boolean}
     * @ignore
     */
    has: (target, key) => key in container || container.has(key),
    /**
     * This is the trap called when the description of one of the properties of the
     * proxied object is rquested. In this case, the trap will not only describe the base
     * properties, but also the registered resources.
     *
     * @param {Jimple}          target  The target object.
     * @param {string | symbol} key     The name of the property.
     * @returns {?PropertyDescriptor} It will only return the description if the container
     *                                `has`
     *                                the property.
     * @ignore
     */
    getOwnPropertyDescriptor: (target, key) => {
      let result;
      if (keys.includes(key) || container.has(key)) {
        const isPrivate = keys.includes(key);
        result = {
          configurable: true,
          enumerable: !isPrivate,
          value: isPrivate ? target[key] : target.get(key),
          writable: !isPrivate,
        };
      }

      return result;
    },
  });

  return proxy;
};

module.exports.resource = resource;
module.exports.resourceCreator = resourceCreator;
module.exports.resourcesCollection = resourcesCollection;
module.exports.provider = provider;
module.exports.providerCreator = providerCreator;
module.exports.providers = providers;
module.exports.proxyContainer = proxyContainer;
