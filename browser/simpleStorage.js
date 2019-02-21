const extend = require('extend');

class SimpleStorage {
  constructor(options = {}) {
    if (new.target === SimpleStorage) {
      throw new TypeError(
        'SimpleStorage is an abstract class, it can\'t be instantiated directly'
      );
    }

    this._options = this._mergeOptions({
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
      tempStorage: {},
    }, options);

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

    this._storage = {};
    this._data = {};

    if (this._options.initialize) {
      this._initialize();
    }
  }

  _initialize() {
    this._validateOptions();
    this._storage = this._initializeStorage();
    this._data = this._initializeStorageData();
  }

  _getInitialData() {
    return {};
  }

  _getData() {
    return this._data;
  }

  _setData(data, save = true) {
    return this._isPromise(data) ?
      data.then((realData) => this._setResolvedData(realData, save)) :
      this._setResolvedData(data, save);
  }

  _setResolvedData(data, save) {
    this._data = this._copy(data);
    if (save) {
      this._save();
    }

    return data;
  }

  _resetData(save = true) {
    const data = this._options.entries.enabled ? {} : this._getInitialData();
    return this._setData(data, save);
  }

  _getEntry(key) {
    const { entries } = this._options;
    if (!entries.enabled) {
      throw new Error('Entries are not enabled for this storage');
    }

    let entry = this._data[key];
    if (entry && entries.deleteExpired) {
      ({ entry } = this._deleteExpiredEntries({ entry }, entries.expiration));
      if (!entry) {
        this._deleteEntry(key, entries.saveWhenDeletingExpired);
      }
    }

    return entry || null;
  }

  _getEntryValue(key) {
    const entry = this.getEntry(key);
    return entry ? entry.value : entry;
  }

  _addEntry(key, value, save = true) {
    return this._isPromise(value) ?
      value.then((realValue) => this._addResolvedEntry(key, realValue, save)) :
      this._addResolvedEntry(key, value, save);
  }

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

  _hasEntry(key) {
    return !!this._data[key];
  }

  _delete(reset = true) {
    delete this._storage.delete(this._options.storage.key);
    if (reset) {
      this.setData(this._getInitialData(), false);
    } else {
      this.setData({}, false);
    }
  }

  _save() {
    this._storage.set(this._options.storage.key, this._data);
  }

  _mergeOptions(defaults, custom) {
    const newCustom = Object.assign({}, custom);
    const newWindow = custom.window || window;
    const newLogger = custom.logger || null;
    const newTempStorage = custom.tempStorage || {};
    delete newCustom.window;
    delete newCustom.logger;
    delete newCustom.tempStorage;
    const newOptions = extend(
      true,
      defaults,
      newCustom
    );
    newOptions.window = newWindow;
    newOptions.logger = newLogger;
    newOptions.tempStorage = newTempStorage;
    return newOptions;
  }

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

  _copy(obj) {
    return extend(true, {}, obj);
  }

  _now() {
    return Math.floor(Date.now() / 1000);
  }

  _isPromise(obj) {
    return (
      typeof obj === 'object' &&
      typeof obj.then === 'function' &&
      typeof obj.catch === 'function'
    );
  }

  _warnStorageFallback(from, to) {
    return this._warn(`${from} is not available; switching to ${to}`);
  }

  _isLocalStorageAvailable(fallbackFrom) {
    if (fallbackFrom) {
      this._warnStorageFallback(fallbackFrom, 'localStorage');
    }

    return !!this._options.window.localStorage;
  }

  _getFromLocalStorage(key) {
    const value = this._options.window.localStorage[key];
    return value ? JSON.parse(value) : null;
  }

  _setOnLocalStorage(key, value) {
    this._options.window.localStorage[key] = JSON.stringify(value);
  }

  _deleteFromLocalStorage(key) {
    delete this._options.window.localStorage[key];
  }

  _isSessionStorageAvailable(fallbackFrom) {
    if (fallbackFrom) {
      this._warnStorageFallback(fallbackFrom, 'sessionStorage');
    }

    return !!this._options.window.sessionStorage;
  }

  _getFromSessionStorage(key) {
    const value = this._options.window.sessionStorage[key];
    return value ? JSON.parse(value) : null;
  }

  _setOnSessionStorage(key, value) {
    this._options.window.sessionStorage[key] = JSON.stringify(value);
  }

  _deleteFromSessionStorage(key) {
    delete this._options.window.sessionStorage[key];
  }

  _isTempStorageAvailable(fallbackFrom) {
    if (fallbackFrom) {
      this._warnStorageFallback(fallbackFrom, 'tempStorage');
    }

    return true;
  }

  _getFromTempStorage(key) {
    return this._options.tempStorage[key];
  }

  _setOnTempStorage(key, value) {
    this._options.tempStorage[key] = value;
  }

  _deleteFromTempStorage(key) {
    delete this._options.tempStorage[key];
  }
}

module.exports = SimpleStorage;
