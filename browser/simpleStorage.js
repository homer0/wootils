const extend = require('extend');

/**
 * @typedef {Object} SimpleStorageStorageLogger
 * @property {?Function} warn    Prints out a warning message. Either this or `warning` MUST be
 *                               present.
 * @property {?Function} warning Prints out a warning message. Either this or `warn` MUST be
 *                               present.
 */

/**
 * @typedef {Object} SimpleStorageStorageOptions
 * @property {string} [name='simpleStorage']                      A reference name for the storage.
 * @property {string} [key='simpleStorage']                       The key the class will use to
 *                                                                store the data on the storage.
 * @property {Array}  [typePriority=['local', 'session', 'temp']] The priority list of types of
 *                                                                storage the service will try to
 *                                                                use when initialized.
 */

/**
 * @typedef {Object} SimpleStorageEntriesOptions
 * @property {boolean} [enabled=false]                Whether or not to use the entries
 *                                                    functionality. Enabling it means that all
 *                                                    the _"xxxEntry"_ methods will be available
 *                                                    and that, when deleted or resetted, the
 *                                                    storage will become an empty object.
 * @property {Number}  [expiration=3600]              The amount of seconds relative to the
 *                                                    current time that needs to pass in order to
 *                                                    consider an entry expired.
 * @property {Boolean} [deleteExpired=true]           Whether or not to delete expired entries
 *                                                    (both when loading the storage and when
 *                                                    trying to access the entries).
 * @property {Boolean} [saveWhenDeletingExpired=true] Whether or not to sync the storage after
 *                                                    deleting an expired entry.
 */

/**
 * @typedef {Object} SimpleStorageOptions
 * @property {Boolean}                     [initialize=true] Whether or not to initialize the
 *                                                           service right from the constructor.
 *                                                           It means that it will validate the
 *                                                           storage, check for existing data and
 *                                                           sync it on the class. This can be
 *                                                           disabled in case you need to do
 *                                                           something between the constructor and
 *                                                           the initialization.
 * @property {Window}                      [window]          The `window`/`global` object the class
 *                                                           will use in order to access
 *                                                           `localStorage` and `sessionStorage`.
 * @property {?SimpleStorageStorageLogger} [logger]          A custom logger to print out the
 *                                                           warnings when the class needs to do a
 *                                                           fallback to a different storage type.
 * @property {SimpleStorageStorageOptions} [storage]         These are all the options related to
 *                                                           the storage itself: The type, the
 *                                                           name and the key.
 * @property {SimpleStorageEntriesOptions} [entries]         These are the options for customizing
 *                                                           the way the service works with entries.
 *                                                           By default, the class saves any kind
 *                                                           of object on the storage, but by
 *                                                           using entries you can access them by
 *                                                           name and even define expiration time
 *                                                           so they'll be removed after a while.
 * @property {Object}                      [tempStorage={}]  The `tempStorage` is the storage the
 *                                                           class uses when none of the others
 *                                                           are available. Is just a simple
 *                                                           object, so when the class gets
 *                                                           destroyed (browser refreshes the
 *                                                           page), the data goes away.
 */

/**
 * @typedef {Function} SimpleStorageStorageAvailableMethod
 * @param {string} [fallbackFrom] If the storage is being used as a fallback from another one that
 *                                is not available, this parameter will have its name.
 * @return {boolean} Whether or not the storage is available.
 */

/**
 * @typedef {Function} SimpleStorageStorageGetMethod
 * @param {string} key The key used by the class to save data on the storage.
 * @return {Object} The contents from the storage.
 */

/**
 * @typedef {Function} SimpleStorageStorageSetMethod
 * @param {string} key The key used by the class to save data on the storage.
 * @param {Object} value The data to save on the storage.
 */

/**
 * @typedef {Function} SimpleStorageStorageDeleteMethod
 * @param {string} key The key used by the class to save data on the storage.
 */

/**
 * @typedef {Object} SimpleStorageStorage
 * @property {string} name The name of the storage.
 * @property {SimpleStorageStorageAvailableMethod} available The method to check if the storage can
 *                                                           be used or not.
 * @property {SimpleStorageStorageGetMethod}       get       The method used to read from the
 *                                                           storage.
 * @property {SimpleStorageStorageSetMethod}       set       The method used to write on the
 *                                                           storage.
 * @property {SimpleStorageStorageDeleteMethod}    delete    The method used to delete data from
 *                                                           the storage.
 */

/**
 * @typedef {Object} SimpleStorageEntry
 * @property {number} time  The timestamp of when the entry was first created.
 * @property {Object} value The actual data for the entry.
 */

/**
 * An abstract class allows you to build services that relay on browser storage (session/local)
 * and simplifies the way you work it
 * You can specify the storage type you want to use, the format in which you want to handle the
 * data and even expiration time for it.
 * @abstract
 */
class SimpleStorage {
  /**
   * Class constructor.
   * @param {SimpleStorageOptions} [options={}] The options to customize the class.
   * @throws {Error} If instantiated without extending it.
   * @abstract
   */
  constructor(options = {}) {
    // Validate that it's being extended.
    if (new.target === SimpleStorage) {
      throw new TypeError(
        'SimpleStorage is an abstract class, it can\'t be instantiated directly'
      );
    }
    /**
     * These are the options/settings the class uses in order to work the with the storage and
     * the data.
     * @type {SimpleStorageOptions}
     * @access protected
     */
    this._options = this._mergeOptions({
      window,
      initialize: true,
      storage: {
        name: 'simpleStorage',
        key: 'simpleStorage',
        typePriority: [
          'local',
          'session',
          'temp',
        ],
      },
      entries: {
        enabled: false,
        expiration: 3600,
        deleteExpired: true,
        saveWhenDeletingExpired: true,
      },
      logger: null,
      tempStorage: {},
    }, options);
    /**
     * A dictionary with the storage types the class supports.
     * @type {Object}
     * @property {SimpleStorageStorage} local   The methods to work with `localStorage`.
     * @property {SimpleStorageStorage} session The methods to work with `sessionStorage`.
     * @property {SimpleStorageStorage} temp    The methods to work with the _"temp storage"_.
     * @access protected
     */
    this._storageTypes = {
      local: {
        name: 'localStorage',
        isAvailable: this._isLocalStorageAvailable.bind(this),
        get: this._getFromLocalStorage.bind(this),
        set: this._setOnLocalStorage.bind(this),
        delete: this._deleteFromLocalStorage.bind(this),
      },
      session: {
        name: 'sessionStorage',
        isAvailable: this._isSessionStorageAvailable.bind(this),
        get: this._getFromSessionStorage.bind(this),
        set: this._setOnSessionStorage.bind(this),
        delete: this._deleteFromSessionStorage.bind(this),
      },
      temp: {
        name: 'tempStorage',
        isAvailable: this._isTempStorageAvailable.bind(this),
        get: this._getFromTempStorage.bind(this),
        set: this._setOnTempStorage.bind(this),
        delete: this._deleteFromTempStorage.bind(this),
      },
    };
    /**
     * Once the class is initialized, this property will hold a reference to the
     * {@link SimpleStorageStorage} being used.
     * @type {?SimpleStorageStorage}
     * @access protected
     */
    this._storage = null;
    /**
     * This is the object/dictionary the class will use to sync the content of the storage. That
     * way you won't need to write/read/parse from the storage every time you need to do something.
     * @type {Object}
     * @access protected
     */
    this._data = {};
    // Initialize the class if necessary.
    if (this._options.initialize) {
      this._initialize();
    }
  }
  /**
   * This method _"initializes" the class by validating custom options, loading the reference for
   * the required storage and synchronizing the data with the storage.
   * @access protected
   */
  _initialize() {
    this._validateOptions();
    this._storage = this._initializeStorage();
    this._data = this._initializeStorageData();
  }
  /**
   * This method is called when the storage is deleted or resetted and if entries are disabled.
   * It can be used to define the initial value of the data the class saves on the storage.
   * @return {Object}
   * @access protected
   */
  _getInitialData() {
    return {};
  }
  /**
   * Access the data the class saves on the storage.
   * @return {Object}
   * @access protected
   */
  _getData() {
    return this._data;
  }
  /**
   * Overwrites the data reference the class has and, if `save` is used, it also saves it into
   * the storage.
   * @param {Object|Promise}  data        The new data, or a {@link Promise} that resolves into the
   *                                      new data.
   * @param {boolean}         [save=true] Whether or not the class should save the data into the
   *                                      storage.
   * @return {Object\Promise} If `data` is an {@link Object}, it will return the same object; but
   *                          if `data` is a {@link Promise}, it will return the _"promise chain"_.
   * @access protected
   */
  _setData(data, save = true) {
    return this._isPromise(data) ?
      data.then((realData) => this._setResolvedData(realData, save)) :
      this._setResolvedData(data, save);
  }
  /**
   * This is the real method behind `_setData`. It overwrites the data reference the class
   * has and, if `save` is used, it also saves it into the storage.
   * The reason that there are two methods for this is, is because `_setData` can receive a
   * {@link Promise}, and in that case, this method gets called after it gets resolved.
   * @param {Object}  data The new data.
   * @param {boolean} save Whether or not the class should save the data into the storage.
   * @return {Object} The same data that was saved.
   * @access protected
   */
  _setResolvedData(data, save) {
    this._data = this._copy(data);
    if (save) {
      this._save();
    }

    return data;
  }
  /**
   * Resets the data on the class; If entries are enabled, the data will become an empty
   * {@link Object}; otherwise, it will call {@link this#_getInitialData}.
   * @param {boolean} [save=true] Whether or not the class should save the data into the storage.
   * @access protected
   */
  _resetData(save = true) {
    const data = this._options.entries.enabled ? {} : this._getInitialData();
    return this._setData(data, save);
  }
  /**
   * Gets an entry from the storage dictionary.
   * @param  {string} key The entry key.
   * @return {SimpleStorageEntry} Whatever is on the storage.
   * @throws {Error} If entries are not enabled.
   * @access protected
   */
  _getEntry(key) {
    const { entries } = this._options;
    // Validate if the feature is enabled and fail with an error if it isn't.
    if (!entries.enabled) {
      throw new Error('Entries are not enabled for this storage');
    }
    // Get the entry from the data reference.
    let entry = this._data[key];
    // If an entry was found and the setting to delete entries when expired is enabled...
    if (entry && entries.deleteExpired) {
      // ...validate if the entry is expired.
      ({ entry } = this._deleteExpiredEntries({ entry }, entries.expiration));
      // ... and if the entry is expired, delete it.
      if (!entry) {
        this._deleteEntry(key, entries.saveWhenDeletingExpired);
      }
    }
    // Return either the entry it found or `null`.
    return entry || null;
  }
  /**
   * Gets the value of an entry.
   * @param {string} key The entry key.
   * @return {?Object}
   * @access protected
   */
  _getEntryValue(key) {
    const entry = this.getEntry(key);
    return entry ? entry.value : entry;
  }
  /**
   * Adds a new entry to the class data, and if `save` is used, saves it into the storage.
   * @param {string}         key         The entry key.
   * @param {Object|Promise} value       The entry value, or a {@link Promise} that resolves into
   *                                     the value.
   * @param {boolean}        [save=true] Whether or not the class should save the data into the
   *                                     storage.
   * @return {Object\Promise} If `value` is an {@link Object}, it will return the same object; but
   *                          if `value` is a {@link Promise}, it will return the
   *                          _"promise chain"_.
   * @access protected
   */
  _addEntry(key, value, save = true) {
    return this._isPromise(value) ?
      value.then((realValue) => this._addResolvedEntry(key, realValue, save)) :
      this._addResolvedEntry(key, value, save);
  }
  /**
   * This is the real method behind `_addEntry`. It Adds a new entry to the class data and, if
   * `save` is used, it also saves it into the storage.
   * The reason that there are two methods for this is, is because `_addEntry` can receive a
   * {@link Promise}, and in that case, this method gets called after it gets resolved.
   * @param {string}  key   The entry key.
   * @param {Object}  value The entry value.
   * @param {boolean} save  Whether or not the class should save the data into the storage.
   * @return {Object} The same data that was saved.
   * @access protected
   */
  _addResolvedEntry(key, value, save) {
    this._data[key] = {
      time: this._now(),
      value: this._copy(value),
    };

    if (save) {
      this._save();
    }

    return value;
  }
  /**
   * Deletes an entry from the class data, and if `save` is used, the changes will be saved on
   * the storage.
   * @param {string}  key         The entry key.
   * @param {boolean} [save=true] Whether or not the class should save the data into the storage
   *                              after deleting the entry.
   * @return {boolean} Whether or not the entry was deleted.
   * @access protected
   */
  _deleteEntry(key, save = true) {
    const exists = this._hasEntry(key);
    if (exists) {
      delete this._data[key];
      if (save) {
        this._save();
      }
    }

    return exists;
  }
  /**
   * Checks whether an entry exists or not.
   * @param {string} key The entry key.
   * @return {boolean}
   * @access protected
   */
  _hasEntry(key) {
    return !!this._data[key];
  }
  /**
   * Deletes the class data from the storage.
   * @param {boolean} [reset=true] Whether or not to reset the data to the initial data
   *                               (`_getInitialData`), if entries area disabled, or to an empty
   *                               object, if they are enabled.
   * @access protected
   */
  _delete(reset = true) {
    delete this._storage.delete(this._options.storage.key);
    if (reset) {
      this.setData(this._getInitialData(), false);
    } else {
      this.setData({}, false);
    }
  }
  /**
   * Saves the data from the class into the storage.
   * @access protected
   */
  _save() {
    this._storage.set(this._options.storage.key, this._data);
  }
  /**
   * Merges the class default options with the custom ones that can be sent to the constructor.
   * The reason there's a method for this is because some of the options can be functions, and
   * deep merges with functions can go wrong (and are expensive), so this methods takes out the
   * functions first, does the merge and then adds them again.
   * Similar to what it does for fuctions, it also takes out arrays: Merging arrays not always work
   * as expected if the base array has some values already. Instead of the base values being
   * overwritten, they are replaced with the amount of values specified on the _"overwrite array"_.
   * Is easy to understand the reason, but nonetheless, it makes it confussing for an option to
   * behave like that.
   * @param {SimpleStorageOptions} defaults The class default options.
   * @param {SimpleStorageOptions} custom   The custom options sent to the constructor.
   * @return {SimpleStorageOptions}
   * @access protected
   */
  _mergeOptions(defaults, custom) {
    const newDefaults = Object.assign({}, defaults);
    const newCustom = Object.assign({}, custom);
    const fnOptions = {};
    ['window', 'logger', 'tempStorage'].forEach((fnOptionName) => {
      fnOptions[fnOptionName] = newCustom[fnOptionName] || newDefaults[fnOptionName];
      delete newDefaults[fnOptionName];
      delete newCustom[fnOptionName];
    });
    let newStorageTypePriority;
    if (newCustom.storage && newCustom.storage.typePriority) {
      newStorageTypePriority = newCustom.storage.typePriority;
    }

    const newOptions = extend(
      true,
      newDefaults,
      newCustom
    );

    Object.keys(fnOptions).forEach((fnOptionName) => {
      newOptions[fnOptionName] = fnOptions[fnOptionName];
    });

    if (newStorageTypePriority) {
      newOptions.storage.typePriority = newStorageTypePriority;
    }

    return newOptions;
  }
  /**
   * Validates the class options before loading the storage and the data.
   * @throws {Error} If either `storage.name` or `storage.key` are missing from the options.
   * @throws {Error} If the options have a custom logger but it doesn't have `warn` nor `warning`
   *                 methods.
   * @access protected
   */
  _validateOptions() {
    const { storage, logger } = this._options;

    const missing = ['name', 'key'].find((key) => typeof storage[key] !== 'string');
    if (missing) {
      throw new Error(`Missing required configuration setting: ${missing}`);
    }

    if (logger && (
      typeof logger.warn !== 'function' &&
      typeof logger.warning !== 'function'
    )) {
      throw new Error('The logger must implement a `warn` or `warning` method');
    }
  }
  /**
   * This method checks the list of priorities from the `storage.typePriority` option and tries
   * to find the first available storage.
   * @return {SimpleStorageStorage}
   * @throws {Error} If none of the storage options are available.
   * @access protected
   */
  _initializeStorage() {
    let previousType;
    const found = this._options.storage.typePriority
    .filter((storageType) => !!this._storageTypes[storageType])
    .find((storageType) => {
      const storage = this._storageTypes[storageType];
      const fallbackFrom = previousType ? storage.name : '';
      previousType = storage;
      return storage.isAvailable(fallbackFrom);
    });

    if (!found) {
      throw new Error('None of the specified storage types are available');
    }

    return this._storageTypes[found];
  }
  /**
   * Initializes the data on the class and if needed, on the storage. It first tries to load
   * existing data from the storage, if there's nothing, it just sets an initial stage; but if
   * there was something on the storage, and entries are enabled, it will try (if also enabled)
   * to delete expired entries.
   * @return {Object}
   * @access protected
   */
  _initializeStorageData() {
    const { storage, entries } = this._options;
    let data = this._storage.get(storage.key) || null;
    if (data && entries.enabled && entries.deleteExpired) {
      data = this._deleteExpiredEntries(data, entries.expiration);
    } else if (!data) {
      data = entries.enabled ? {} : this._getInitialData();
      this._storage.set(storage.key, data);
    }

    return data;
  }
  /**
   * Filters out a dictionary of entries by checking if they expired or not.
   * @param {Object}  entries    A dictionary of key-value, where the value is a
   *                             {@link SimpleStorageEntry}.
   * @param  {number} expiration The amount of seconds that need to have passed in order to
   *                             consider an entry expired.
   * @return {Object} A new dictionary without the expired entries.
   * @access protected
   */
  _deleteExpiredEntries(entries, expiration) {
    const result = {};
    const now = this._now();
    Object.keys(entries).forEach((key) => {
      const entry = entries[key];
      if ((now - entry.time) < expiration) {
        result[key] = entry;
      }
    });

    return result;
  }
  /**
   * Prints out a warning message. The method will first check if there's a custom logger (from
   * the class options), otherwise, it will fallback to the `console` on the `window` option.
   * @param {string} message The message to print out.
   * @access protected
   */
  _warn(message) {
    const { logger } = this._options;
    if (logger) {
      if (logger.warning) {
        logger.warning(message);
      } else {
        logger.warn(message);
      }
    } else {
      // eslint-disable-next-line no-console
      this._options.window.console.warn(message);
    }
  }
  /**
   * Makes a deep copy of an object.
   * @param {Object} obj The object to copy.
   * @return {Object}
   * @access protected
   */
  _copy(obj) {
    return extend(true, {}, obj);
  }
  /**
   * Helper method to get the current timestamp in seconds.
   * @return {number}
   * @access protected
   */
  _now() {
    return Math.floor(Date.now() / 1000);
  }
  /**
   * Checkes whether an object is a Promise or not.
   * @param {Object} obj The object to test.
   * @return {boolean}
   * @access protected
   */
  _isPromise(obj) {
    return (
      typeof obj === 'object' &&
      typeof obj.then === 'function' &&
      typeof obj.catch === 'function'
    );
  }
  /**
   * Prints out a message saying that the class is doing a fallback from a storage to another
   * one.
   * @param {string} from The name of the storage that's not available.
   * @param {string} to   The name of the storage that will be used instead.
   * @access protected
   */
  _warnStorageFallback(from, to) {
    this._warn(`${from} is not available; switching to ${to}`);
  }
  /**
   * Checks whether `localStorage` is available or not.
   * @param {string} [fallbackFrom] In case it's being used as a fallback, this will be the name
   *                                of the storage that wasn't available.
   * @return {boolean}
   * @access protected
   */
  _isLocalStorageAvailable(fallbackFrom) {
    if (fallbackFrom) {
      this._warnStorageFallback(fallbackFrom, 'localStorage');
    }

    return !!this._options.window.localStorage;
  }
  /**
   * Gets an object from `localStorage`.
   * @param {string} key The key used to save the object.
   * @return {Object}
   * @access protected
   */
  _getFromLocalStorage(key) {
    const value = this._options.window.localStorage[key];
    return value ? JSON.parse(value) : null;
  }
  /**
   * Sets an object into the `localStorage`.
   * @param {string} key   The object key.
   * @param {Object} value The object to save.
   * @access protected
   */
  _setOnLocalStorage(key, value) {
    this._options.window.localStorage[key] = JSON.stringify(value);
  }
  /**
   * Deletes an object from the `localStorage`.
   * @param {string} key The object key.
   * @access protected
   */
  _deleteFromLocalStorage(key) {
    delete this._options.window.localStorage[key];
  }
  /**
   * Checks whether `sessionStorage` is available or not.
   * @param {string} [fallbackFrom] In case it's being used as a fallback, this will be the name
   *                                of the storage that wasn't available.
   * @return {boolean}
   * @access protected
   */
  _isSessionStorageAvailable(fallbackFrom) {
    if (fallbackFrom) {
      this._warnStorageFallback(fallbackFrom, 'sessionStorage');
    }

    return !!this._options.window.sessionStorage;
  }
  /**
   * Gets an object from `sessionStorage`.
   * @param {string} key The key used to save the object.
   * @return {Object}
   * @access protected
   */
  _getFromSessionStorage(key) {
    const value = this._options.window.sessionStorage[key];
    return value ? JSON.parse(value) : null;
  }
  /**
   * Sets an object into the `sessionStorage`.
   * @param {string} key   The object key.
   * @param {Object} value The object to save.
   * @access protected
   */
  _setOnSessionStorage(key, value) {
    this._options.window.sessionStorage[key] = JSON.stringify(value);
  }
  /**
   * Deletes an object from the `sessionStorage`.
   * @param {string} key The object key.
   * @access protected
   */
  _deleteFromSessionStorage(key) {
    delete this._options.window.sessionStorage[key];
  }
  /**
   * This method is just here to comply with the {@link SimpleStorageStorage} _"interface"_ as
   * the temp storage is always available.
   * @param {string} [fallbackFrom] In case it's being used as a fallback, this will be the name
   *                                of the storage that wasn't available.
   * @return {boolean}
   * @access protected
   */
  _isTempStorageAvailable(fallbackFrom) {
    if (fallbackFrom) {
      this._warnStorageFallback(fallbackFrom, 'tempStorage');
    }

    return true;
  }
  /**
   * Gets an object from the _"temp storage"_.
   * @param {string} key The key used to save the object.
   * @return {Object}
   * @access protected
   */
  _getFromTempStorage(key) {
    return this._options.tempStorage[key];
  }
  /**
   * Sets an object into the _"temp storage"_.
   * @param {string} key   The object key.
   * @param {Object} value The object to save.
   * @access protected
   */
  _setOnTempStorage(key, value) {
    this._options.tempStorage[key] = value;
  }
  /**
   * Deletes an object from the _"temp storage"_.
   * @param {string} key The object key.
   * @access protected
   */
  _deleteFromTempStorage(key) {
    delete this._options.tempStorage[key];
  }
}

module.exports = SimpleStorage;
