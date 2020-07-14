jest.unmock('../../browser/simpleStorage');

const SimpleStorage = require('../../browser/simpleStorage');

const originalDate = global.Date;

describe('SimpleStorage', () => {
  /**
   * Generates a proxied version of {@link SimpleStorage} for testing purposes.
   *
   * @param {SimpleStorageOptions} options             The options for {@link SimpleStorage}.
   * @param {?Object}              [initialData=null]  The data for when the storage gets
   *                                                   initialized.
   * @returns {Proxy<SimpleStorage>}
   */
  const getSutProxy = (options, initialData = null) => {
    /**
     * A subclass to avoid the abstract error.
     */
    class Sut extends SimpleStorage {}
    const sut = new Sut(options);
    return new Proxy(sut, {
      get(target, name) {
        let result;
        if (name === '_getInitialData' && initialData !== null) {
          /**
           * A fake {@link SimpleStorage#_getInitialData} that would return our object.
           *
           * @returns {Object}
           */
          result = () => initialData;
        } else if (target[name]) {
          result = target[name];
        } else {
          const protectedName = `_${name}`;
          if (target[protectedName]) {
            result = target[protectedName];
          } else {
            throw new Error(`${name} is undefined`);
          }
        }

        return result;
      },
    });
  };
  /**
   * Generates an object with the same signature as LocalStorage and SessionStorage that the
   * test cases can use.
   *
   * @param {Object} initialData  The data "currently" on the storage.
   * @returns {Object}
   */
  const getStorageProxy = (initialData = {}) => {
    const data = { ...initialData };
    return new Proxy({}, {
      mocks: {
        get: jest.fn((name) => data[name]),
        set: jest.fn((name, value) => {
          data[name] = value;
        }),
        delete: jest.fn((name) => {
          delete data[name];
        }),
      },
      get(target, name) {
        return target[name] || this[name] || this.mocks.get(name);
      },
      set(target, name, value) {
        this.mocks.set(name, value);
        return true;
      },
      deleteProperty(target, name) {
        this.mocks.delete(name);
        return true;
      },
    });
  };

  afterEach(() => {
    global.Date = originalDate;
  });

  it('should throw an error if used without subclassing it', () => {
    // Given/When/Then
    expect(() => new SimpleStorage()).toThrow(/SimpleStorage is an abstract class/i);
  });

  it('should be able to be instantiated when subclassed', () => {
    // Given
    let sut = null;
    // When
    sut = getSutProxy({ initialize: false });
    // Then
    expect(sut).toBeInstanceOf(SimpleStorage);
  });

  it('should be able to merge custom options', () => {
    // Given
    const customOptions = {
      window: 'myWindow',
      logger: null,
      initialize: false,
      storage: {
        name: 'mySimpleStorage',
        key: 'mySimpleStorage',
        typePriority: [
          'temp',
          'local',
          'session',
        ],
      },
      entries: {
        enabled: true,
        expiration: 2509,
        deleteExpired: false,
        saveWhenDeletingExpired: false,
      },
      tempStorage: { name: 'myDictionary' },
    };
    let sut = null;
    let result = null;
    // When
    sut = getSutProxy(customOptions);
    result = sut.options;
    // Then
    expect(result).toEqual(customOptions);
  });

  it('should throw an error when storage.name is not preset on the options', () => {
    // Given
    const customOptions = {
      storage: {
        name: null,
      },
    };
    // When/Then
    expect(() => getSutProxy(customOptions))
    .toThrow(/Missing required configuration setting: name/i);
  });

  it('should throw an error when storage.key is not preset on the options', () => {
    // Given
    const customOptions = {
      storage: {
        key: null,
      },
    };
    // When/Then
    expect(() => getSutProxy(customOptions))
    .toThrow(/Missing required configuration setting: key/i);
  });

  it('should throw an error if the logger doesn\'t have a warn or warning method', () => {
    // Given
    const customOptions = {
      logger: {},
    };
    // When/Then
    expect(() => getSutProxy(customOptions))
    .toThrow(/The logger must implement a `warn` or `warning` method/i);
  });

  it('should throw an error if no storage is available', () => {
    // Given
    const customOptions = {
      window: {},
      storage: {
        typePriority: [
          'unknown',
        ],
      },
    };
    // When/Then
    expect(() => getSutProxy(customOptions))
    .toThrow(/None of the specified storage types are available/i);
  });

  describe('localStorage / Basic storage functionality', () => {
    it('should initialize the storage with empty data', () => {
      // Given
      const storageKey = 'myStorage';
      const mStorage = getStorageProxy();
      const mWindow = {
        localStorage: mStorage,
      };
      const options = {
        window: mWindow,
        storage: {
          key: storageKey,
        },
      };
      let sut = null;
      let result = null;
      // When
      sut = getSutProxy(options);
      result = sut.getData();
      // Then
      expect(result).toEqual({});
      expect(mStorage.mocks.get).toHaveBeenCalledTimes(1);
      expect(mStorage.mocks.get).toHaveBeenCalledWith(options.storage.key);
      expect(mStorage.mocks.set).toHaveBeenCalledTimes(1);
      expect(mStorage.mocks.set).toHaveBeenCalledWith(storageKey, '{}');
    });

    it('should initialize the storage and restore saved data', () => {
      // Given
      const storageKey = 'myStorage';
      const savedData = {
        name: 'Charito',
      };
      const mStorage = getStorageProxy({
        [storageKey]: JSON.stringify(savedData),
      });
      const mWindow = {
        localStorage: mStorage,
      };
      const options = {
        window: mWindow,
        storage: {
          key: storageKey,
        },
      };
      let sut = null;
      let result = null;
      // When
      sut = getSutProxy(options);
      result = sut.getData();
      // Then
      expect(result).toEqual(savedData);
      expect(mStorage.mocks.get).toHaveBeenCalledTimes(1);
      expect(mStorage.mocks.get).toHaveBeenCalledWith(options.storage.key);
      expect(mStorage.mocks.set).toHaveBeenCalledTimes(0);
    });

    it('should overwrite the data on the service and save it', () => {
      // Given
      const storageKey = 'myStorage';
      const mStorage = getStorageProxy();
      const mWindow = {
        localStorage: mStorage,
      };
      const options = {
        window: mWindow,
        storage: {
          key: storageKey,
        },
      };
      const newData = {
        name: 'Charito',
        age: 3,
      };
      let sut = null;
      let result = null;
      // When
      sut = getSutProxy(options);
      sut.setData(newData);
      result = sut.getData();
      // Then
      expect(result).toEqual(newData);
      expect(mStorage.mocks.get).toHaveBeenCalledTimes(1);
      expect(mStorage.mocks.get).toHaveBeenCalledWith(options.storage.key);
      expect(mStorage.mocks.set).toHaveBeenCalledTimes(2);
      expect(mStorage.mocks.set).toHaveBeenCalledWith(storageKey, '{}');
      expect(mStorage.mocks.set).toHaveBeenCalledWith(storageKey, JSON.stringify(newData));
    });

    it('should overwrite the data on the service but not save it', () => {
      // Given
      const storageKey = 'myStorage';
      const mStorage = getStorageProxy();
      const mWindow = {
        localStorage: mStorage,
      };
      const options = {
        window: mWindow,
        storage: {
          key: storageKey,
        },
      };
      const newData = {
        name: 'Charito',
        age: 3,
      };
      let sut = null;
      let result = null;
      // When
      sut = getSutProxy(options);
      sut.setData(newData, false);
      result = sut.getData();
      // Then
      expect(result).toEqual(newData);
      expect(mStorage.mocks.get).toHaveBeenCalledTimes(1);
      expect(mStorage.mocks.get).toHaveBeenCalledWith(options.storage.key);
      expect(mStorage.mocks.set).toHaveBeenCalledTimes(1);
      expect(mStorage.mocks.set).toHaveBeenCalledWith(storageKey, '{}');
    });

    it('should overwrite the data from a promise on the service and save it', () => {
      // Given
      const storageKey = 'myStorage';
      const mStorage = getStorageProxy();
      const mWindow = {
        localStorage: mStorage,
      };
      const options = {
        window: mWindow,
        storage: {
          key: storageKey,
        },
      };
      const newData = {
        name: 'Charito',
        age: 3,
      };
      const dataPromise = Promise.resolve(newData);
      let sut = null;
      let result = null;
      // When
      sut = getSutProxy(options);
      return sut.setData(dataPromise)
      .then(() => {
        result = sut.getData();
        // Then
        expect(result).toEqual(newData);
        expect(mStorage.mocks.get).toHaveBeenCalledTimes(1);
        expect(mStorage.mocks.get).toHaveBeenCalledWith(options.storage.key);
        expect(mStorage.mocks.set).toHaveBeenCalledTimes(2);
        expect(mStorage.mocks.set).toHaveBeenCalledWith(storageKey, '{}');
        expect(mStorage.mocks.set).toHaveBeenCalledWith(storageKey, JSON.stringify(newData));
      })
      .catch((error) => {
        throw error;
      });
    });

    it('should initialize as a fallback for another storage', () => {
      // Given
      const storageKey = 'myStorage';
      const mStorage = getStorageProxy();
      const mConsole = {
        warn: jest.fn(),
      };
      const mWindow = {
        localStorage: mStorage,
        console: mConsole,
      };
      const options = {
        window: mWindow,
        storage: {
          key: storageKey,
          typePriority: [
            'session',
            'local',
            'temp',
          ],
        },
      };
      let sut = null;
      let result = null;
      // When
      sut = getSutProxy(options);
      result = sut.getData();
      // Then
      expect(result).toEqual({});
      expect(mConsole.warn).toHaveBeenCalledTimes(1);
      expect(mConsole.warn).toHaveBeenCalledWith(expect.any(String));
      expect(mConsole.warn.mock.calls[0][0]).toMatch(/is not available; switching to/i);
    });

    it('should delete the data from the storage', () => {
      // Given
      const storageKey = 'myStorage';
      const savedData = {
        name: 'Charito',
      };
      const mStorage = getStorageProxy({
        [storageKey]: JSON.stringify(savedData),
      });
      const mWindow = {
        localStorage: mStorage,
      };
      const options = {
        window: mWindow,
        storage: {
          key: storageKey,
        },
      };
      let sut = null;
      let result = null;
      // When
      sut = getSutProxy(options);
      sut.delete();
      result = sut.getData();
      // Then
      expect(result).toEqual({});
      expect(mStorage.mocks.get).toHaveBeenCalledTimes(1);
      expect(mStorage.mocks.get).toHaveBeenCalledWith(options.storage.key);
      expect(mStorage.mocks.delete).toHaveBeenCalledTimes(1);
      expect(mStorage.mocks.delete).toHaveBeenCalledWith(options.storage.key);
      expect(mStorage.mocks.set).toHaveBeenCalledTimes(0);
    });

    it('should delete the data from the storage but not reset it to the initial state', () => {
      // Given
      const storageKey = 'myStorage';
      const savedData = {
        name: 'Charito',
      };
      const mStorage = getStorageProxy({
        [storageKey]: JSON.stringify(savedData),
      });
      const mWindow = {
        localStorage: mStorage,
      };
      const options = {
        window: mWindow,
        storage: {
          key: storageKey,
        },
      };
      const initialData = {
        name: 'Rosario',
      };
      let sut = null;
      let resultBeforeReset = null;
      let resultWithReset = null;
      let resultWithoutReset = null;
      // When
      sut = getSutProxy(options, initialData);
      resultBeforeReset = sut.getData();
      sut.delete();
      resultWithReset = sut.getData();
      sut.delete(false);
      resultWithoutReset = sut.getData();
      // Then
      expect(resultBeforeReset).toEqual(savedData);
      expect(resultWithReset).toEqual(initialData);
      expect(resultWithoutReset).toEqual({});
      expect(mStorage.mocks.get).toHaveBeenCalledTimes(1);
      expect(mStorage.mocks.get).toHaveBeenCalledWith(options.storage.key);
      expect(mStorage.mocks.delete).toHaveBeenCalledTimes(2);
      expect(mStorage.mocks.delete).toHaveBeenCalledWith(options.storage.key);
      expect(mStorage.mocks.set).toHaveBeenCalledTimes(0);
    });

    it('should reset the data and save it', () => {
      // Given
      const storageKey = 'myStorage';
      const savedData = {
        name: 'Charito',
      };
      const mStorage = getStorageProxy({
        [storageKey]: JSON.stringify(savedData),
      });
      const mWindow = {
        localStorage: mStorage,
      };
      const options = {
        window: mWindow,
        storage: {
          key: storageKey,
        },
      };
      const initialData = {
        name: 'Rosario',
      };
      let sut = null;
      let resultBeforeReset = null;
      let resultAfterReset = null;
      // When
      sut = getSutProxy(options, initialData);
      resultBeforeReset = sut.getData();
      sut.resetData();
      resultAfterReset = sut.getData();
      // Then
      expect(resultBeforeReset).toEqual(savedData);
      expect(resultAfterReset).toEqual(initialData);
      expect(mStorage.mocks.get).toHaveBeenCalledTimes(1);
      expect(mStorage.mocks.get).toHaveBeenCalledWith(options.storage.key);
      expect(mStorage.mocks.set).toHaveBeenCalledTimes(1);
      expect(mStorage.mocks.set).toHaveBeenCalledWith(
        options.storage.key,
        JSON.stringify(initialData),
      );
    });

    it('should reset the entries and save it', () => {
      // Given
      const storageKey = 'myStorage';
      const savedData = {
        people: {
          time: 0,
          value: [{ name: 'Charito' }],
        },
      };
      const mStorage = getStorageProxy({
        [storageKey]: JSON.stringify(savedData),
      });
      const mWindow = {
        localStorage: mStorage,
      };
      const options = {
        window: mWindow,
        storage: {
          key: storageKey,
        },
        entries: {
          enabled: true,
          deleteExpired: false,
        },
      };
      let sut = null;
      let resultBeforeReset = null;
      let resultAfterReset = null;
      // When
      sut = getSutProxy(options);
      resultBeforeReset = sut.getData();
      sut.resetData();
      resultAfterReset = sut.getData();
      // Then
      expect(resultBeforeReset).toEqual(savedData);
      expect(resultAfterReset).toEqual({});
      expect(mStorage.mocks.get).toHaveBeenCalledTimes(1);
      expect(mStorage.mocks.get).toHaveBeenCalledWith(options.storage.key);
      expect(mStorage.mocks.set).toHaveBeenCalledTimes(1);
      expect(mStorage.mocks.set).toHaveBeenCalledWith(options.storage.key, '{}');
    });

    it('should throw an error when trying to access an entry and `entries` is disabled', () => {
      // Given
      const storageKey = 'myStorage';
      const mStorage = getStorageProxy({
        [storageKey]: '{}',
      });
      const mWindow = {
        localStorage: mStorage,
      };
      const options = {
        window: mWindow,
        storage: {
          key: storageKey,
        },
        entries: {
          enabled: false,
        },
      };
      // When/Then
      expect(() => getSutProxy(options).getEntry('someKey'))
      .toThrow(/Entries are not enabled for this storage/i);
    });

    it('should return a saved entry', () => {
      // Given
      const storageKey = 'myStorage';
      const entryKey = 'user';
      const entryValue = {
        name: 'Rosario',
      };
      const entry = {
        time: Math.floor(Date.now() / 1000),
        value: entryValue,
      };
      const savedData = {
        [entryKey]: entry,
      };
      const mStorage = getStorageProxy({
        [storageKey]: JSON.stringify(savedData),
      });
      const mWindow = {
        localStorage: mStorage,
      };
      const options = {
        window: mWindow,
        storage: {
          key: storageKey,
        },
        entries: {
          enabled: true,
        },
      };
      let sut = null;
      let result = null;
      let resultValue = null;
      // When
      sut = getSutProxy(options);
      result = sut.getEntry(entryKey);
      resultValue = sut.getEntryValue(entryKey);
      // Then
      expect(result).toEqual(entry);
      expect(resultValue).toEqual(entryValue);
      expect(mStorage.mocks.get).toHaveBeenCalledTimes(1);
      expect(mStorage.mocks.get).toHaveBeenCalledWith(options.storage.key);
      expect(mStorage.mocks.set).toHaveBeenCalledTimes(0);
    });

    it('should expire a saved entry', () => {
      // Given
      const currentTime = Date.now();
      const expiration = 3600;
      const future = currentTime + ((expiration * 1000) * 2);
      const now = jest.fn();
      now.mockImplementationOnce(() => currentTime);
      now.mockImplementationOnce(() => currentTime);
      now.mockImplementationOnce(() => future);
      global.Date = { now };
      const storageKey = 'myStorage';
      const entryKey = 'user';
      const entryValue = {
        name: 'Rosario',
      };
      const entry = {
        time: Math.floor(currentTime / 1000),
        value: entryValue,
      };
      const savedData = {
        [entryKey]: entry,
      };
      const mStorage = getStorageProxy({
        [storageKey]: JSON.stringify(savedData),
      });
      const mWindow = {
        localStorage: mStorage,
      };
      const options = {
        window: mWindow,
        storage: {
          key: storageKey,
        },
        entries: {
          enabled: true,
          expiration,
        },
      };
      let sut = null;
      let result = null;
      let resultAfterExpiration = null;
      // When
      sut = getSutProxy(options);
      result = sut.getEntry(entryKey);
      resultAfterExpiration = sut.getEntry(entryKey);
      // Then
      expect(result).toEqual(entry);
      expect(resultAfterExpiration).toBeNull();
      expect(mStorage.mocks.get).toHaveBeenCalledTimes(1);
      expect(mStorage.mocks.get).toHaveBeenCalledWith(options.storage.key);
      expect(mStorage.mocks.set).toHaveBeenCalledTimes(1);
      expect(mStorage.mocks.set).toHaveBeenCalledWith(options.storage.key, '{}');
    });

    it('should delete expired entries when they are loaded', () => {
      // Given
      const storageKey = 'myStorage';
      const entryKey = 'user';
      const entry = {
        time: 0,
        value: {
          name: 'Rosario',
        },
      };
      const savedData = {
        [entryKey]: entry,
      };
      const mStorage = getStorageProxy({
        [storageKey]: JSON.stringify(savedData),
      });
      const mWindow = {
        localStorage: mStorage,
      };
      const options = {
        window: mWindow,
        storage: {
          key: storageKey,
        },
        entries: {
          enabled: true,
        },
      };
      let sut = null;
      let result = null;
      // When
      sut = getSutProxy(options);
      result = sut.getEntry(entryKey);
      // Then
      expect(result).toBeNull();
      expect(mStorage.mocks.get).toHaveBeenCalledTimes(1);
      expect(mStorage.mocks.get).toHaveBeenCalledWith(options.storage.key);
      expect(mStorage.mocks.set).toHaveBeenCalledTimes(0);
    });

    it('should initialize the storage as an empty object for entries', () => {
      // Given
      const storageKey = 'myStorage';
      const mStorage = getStorageProxy();
      const mWindow = {
        localStorage: mStorage,
      };
      const options = {
        window: mWindow,
        storage: {
          key: storageKey,
        },
        entries: {
          enabled: true,
        },
      };
      let sut = null;
      let result = null;
      let resultEntry = null;
      let resultEntryValue = null;
      // When
      sut = getSutProxy(options);
      result = sut.getData();
      resultEntry = sut.getEntry('unknownEntry');
      resultEntryValue = sut.getEntryValue('unknownEntry');
      // Then
      expect(result).toEqual({});
      expect(resultEntry).toBeNull();
      expect(resultEntryValue).toBeNull();
      expect(mStorage.mocks.get).toHaveBeenCalledTimes(1);
      expect(mStorage.mocks.get).toHaveBeenCalledWith(options.storage.key);
      expect(mStorage.mocks.set).toHaveBeenCalledTimes(1);
      expect(mStorage.mocks.set).toHaveBeenCalledWith(options.storage.key, '{}');
    });

    it('should add and save a new entry', () => {
      // Given
      const currentTime = 0;
      global.Date = {
        now: jest.fn(() => currentTime),
      };
      const storageKey = 'myStorage';
      const entryKey = 'user';
      const entryValue = {
        name: 'Rosario',
      };
      const mStorage = getStorageProxy();
      const mWindow = {
        localStorage: mStorage,
      };
      const options = {
        window: mWindow,
        storage: {
          key: storageKey,
        },
        entries: {
          enabled: true,
          deleteExpired: false,
        },
      };
      let sut = null;
      let resultBeforeAdding = null;
      let resultFromAdding = null;
      let resultAfterAdding = null;
      // When
      sut = getSutProxy(options);
      resultBeforeAdding = sut.getEntryValue(entryKey);
      resultFromAdding = sut.addEntry(entryKey, entryValue);
      resultAfterAdding = sut.getEntryValue(entryKey);
      // Then
      expect(resultBeforeAdding).toBeNull();
      expect(resultFromAdding).toEqual(entryValue);
      expect(resultAfterAdding).toEqual(entryValue);
      expect(mStorage.mocks.get).toHaveBeenCalledTimes(1);
      expect(mStorage.mocks.get).toHaveBeenCalledWith(options.storage.key);
      expect(mStorage.mocks.set).toHaveBeenCalledTimes(2);
      expect(mStorage.mocks.set).toHaveBeenCalledWith(options.storage.key, '{}');
      expect(mStorage.mocks.set).toHaveBeenCalledWith(
        options.storage.key,
        JSON.stringify({
          [entryKey]: {
            time: currentTime,
            value: entryValue,
          },
        }),
      );
    });

    it('should add and save a new array entry', () => {
      // Given
      const currentTime = 0;
      global.Date = {
        now: jest.fn(() => currentTime),
      };
      const storageKey = 'myStorage';
      const entryKey = 'user';
      const entryValue = ['Rosario', 'Charo', 'Charito'];
      const mStorage = getStorageProxy();
      const mWindow = {
        localStorage: mStorage,
      };
      const options = {
        window: mWindow,
        storage: {
          key: storageKey,
        },
        entries: {
          enabled: true,
          deleteExpired: false,
        },
      };
      let sut = null;
      let resultBeforeAdding = null;
      let resultFromAdding = null;
      let resultAfterAdding = null;
      // When
      sut = getSutProxy(options);
      resultBeforeAdding = sut.getEntryValue(entryKey);
      resultFromAdding = sut.addEntry(entryKey, entryValue);
      resultAfterAdding = sut.getEntryValue(entryKey);
      // Then
      expect(resultBeforeAdding).toBeNull();
      expect(resultFromAdding).toEqual(entryValue);
      expect(resultAfterAdding).toEqual(entryValue);
      expect(mStorage.mocks.get).toHaveBeenCalledTimes(1);
      expect(mStorage.mocks.get).toHaveBeenCalledWith(options.storage.key);
      expect(mStorage.mocks.set).toHaveBeenCalledTimes(2);
      expect(mStorage.mocks.set).toHaveBeenCalledWith(options.storage.key, '{}');
      expect(mStorage.mocks.set).toHaveBeenCalledWith(
        options.storage.key,
        JSON.stringify({
          [entryKey]: {
            time: currentTime,
            value: entryValue,
          },
        }),
      );
    });

    it('should add a new entry but not save it', () => {
      // Given
      const currentTime = 0;
      global.Date = {
        now: jest.fn(() => currentTime),
      };
      const storageKey = 'myStorage';
      const entryKey = 'user';
      const entryValue = {
        name: 'Rosario',
      };
      const mStorage = getStorageProxy();
      const mWindow = {
        localStorage: mStorage,
      };
      const options = {
        window: mWindow,
        storage: {
          key: storageKey,
        },
        entries: {
          enabled: true,
          deleteExpired: false,
        },
      };
      let sut = null;
      let resultBeforeAdding = null;
      let resultFromAdding = null;
      let resultAfterAdding = null;
      // When
      sut = getSutProxy(options);
      resultBeforeAdding = sut.getEntryValue(entryKey);
      resultFromAdding = sut.addEntry(entryKey, entryValue, false);
      resultAfterAdding = sut.getEntryValue(entryKey);
      // Then
      expect(resultBeforeAdding).toBeNull();
      expect(resultFromAdding).toEqual(entryValue);
      expect(resultAfterAdding).toEqual(entryValue);
      expect(mStorage.mocks.get).toHaveBeenCalledTimes(1);
      expect(mStorage.mocks.get).toHaveBeenCalledWith(options.storage.key);
      expect(mStorage.mocks.set).toHaveBeenCalledTimes(1);
      expect(mStorage.mocks.set).toHaveBeenCalledWith(options.storage.key, '{}');
    });

    it('should add and save a new entry from a promise', () => {
      // Given
      const currentTime = 0;
      global.Date = {
        now: jest.fn(() => currentTime),
      };
      const storageKey = 'myStorage';
      const entryKey = 'user';
      const entryValue = {
        name: 'Rosario',
      };
      const entryPromise = Promise.resolve(entryValue);
      const mStorage = getStorageProxy();
      const mWindow = {
        localStorage: mStorage,
      };
      const options = {
        window: mWindow,
        storage: {
          key: storageKey,
        },
        entries: {
          enabled: true,
          deleteExpired: false,
        },
      };
      let sut = null;
      let resultBeforeAdding = null;
      let resultAfterAdding = null;
      // When
      sut = getSutProxy(options);
      resultBeforeAdding = sut.getEntryValue(entryKey);
      return sut.addEntry(entryKey, entryPromise)
      .then((resultFromAdding) => {
        resultAfterAdding = sut.getEntryValue(entryKey);
        // Then
        expect(resultBeforeAdding).toBeNull();
        expect(resultFromAdding).toEqual(entryValue);
        expect(resultAfterAdding).toEqual(entryValue);
        expect(mStorage.mocks.get).toHaveBeenCalledTimes(1);
        expect(mStorage.mocks.get).toHaveBeenCalledWith(options.storage.key);
        expect(mStorage.mocks.set).toHaveBeenCalledTimes(2);
        expect(mStorage.mocks.set).toHaveBeenCalledWith(options.storage.key, '{}');
        expect(mStorage.mocks.set).toHaveBeenCalledWith(
          options.storage.key,
          JSON.stringify({
            [entryKey]: {
              time: currentTime,
              value: entryValue,
            },
          }),
        );
      })
      .catch((error) => {
        throw error;
      });
    });

    it('should delete an entry and save the storage', () => {
      // Given
      const currentTime = 0;
      global.Date = {
        now: jest.fn(() => currentTime),
      };
      const storageKey = 'myStorage';
      const entryKey = 'user';
      const entryValue = {
        name: 'Rosario',
      };
      const mStorage = getStorageProxy();
      const mWindow = {
        localStorage: mStorage,
      };
      const options = {
        window: mWindow,
        storage: {
          key: storageKey,
        },
        entries: {
          enabled: true,
          deleteExpired: false,
        },
      };
      let sut = null;
      let resultBeforeDeleting = null;
      let resultFromDeleting = null;
      let resultAfterDeleting = null;
      // When
      sut = getSutProxy(options);
      sut.addEntry(entryKey, entryValue);
      resultBeforeDeleting = sut.getEntryValue(entryKey);
      resultFromDeleting = sut.deleteEntry(entryKey);
      resultAfterDeleting = sut.getEntryValue(entryKey);
      // Then
      expect(resultBeforeDeleting).toEqual(entryValue);
      expect(resultFromDeleting).toBe(true);
      expect(resultAfterDeleting).toBeNull();
      expect(mStorage.mocks.get).toHaveBeenCalledTimes(1);
      expect(mStorage.mocks.get).toHaveBeenCalledWith(options.storage.key);
      expect(mStorage.mocks.set).toHaveBeenCalledTimes(3);
      expect(mStorage.mocks.set).toHaveBeenCalledWith(options.storage.key, '{}');
      expect(mStorage.mocks.set).toHaveBeenCalledWith(
        options.storage.key,
        JSON.stringify({
          [entryKey]: {
            time: currentTime,
            value: entryValue,
          },
        }),
      );
      expect(mStorage.mocks.set).toHaveBeenCalledWith(options.storage.key, '{}');
    });

    it('should delete an entry but not save it on the storage', () => {
      // Given
      const currentTime = 0;
      global.Date = {
        now: jest.fn(() => currentTime),
      };
      const storageKey = 'myStorage';
      const entryKey = 'user';
      const entryValue = {
        name: 'Rosario',
      };
      const mStorage = getStorageProxy();
      const mWindow = {
        localStorage: mStorage,
      };
      const options = {
        window: mWindow,
        storage: {
          key: storageKey,
        },
        entries: {
          enabled: true,
          deleteExpired: false,
        },
      };
      let sut = null;
      let resultBeforeDeleting = null;
      let resultFromDeleting = null;
      let resultAfterDeleting = null;
      // When
      sut = getSutProxy(options);
      sut.addEntry(entryKey, entryValue);
      resultBeforeDeleting = sut.getEntryValue(entryKey);
      resultFromDeleting = sut.deleteEntry(entryKey, false);
      resultAfterDeleting = sut.getEntryValue(entryKey);
      // Then
      expect(resultBeforeDeleting).toEqual(entryValue);
      expect(resultFromDeleting).toBe(true);
      expect(resultAfterDeleting).toBeNull();
      expect(mStorage.mocks.get).toHaveBeenCalledTimes(1);
      expect(mStorage.mocks.get).toHaveBeenCalledWith(options.storage.key);
      expect(mStorage.mocks.set).toHaveBeenCalledTimes(2);
      expect(mStorage.mocks.set).toHaveBeenCalledWith(options.storage.key, '{}');
      expect(mStorage.mocks.set).toHaveBeenCalledWith(
        options.storage.key,
        JSON.stringify({
          [entryKey]: {
            time: currentTime,
            value: entryValue,
          },
        }),
      );
    });

    it('should fail to delete an entry', () => {
      // Given
      const storageKey = 'myStorage';
      const mStorage = getStorageProxy();
      const mWindow = {
        localStorage: mStorage,
      };
      const options = {
        window: mWindow,
        storage: {
          key: storageKey,
        },
        entries: {
          enabled: true,
        },
      };
      let sut = null;
      let result = null;
      // When
      sut = getSutProxy(options);
      result = sut.deleteEntry('randomKey');
      // Then
      expect(result).toBe(false);
    });
  });

  describe('sessionStorage', () => {
    it('should initialize the storage with empty data', () => {
      // Given
      const storageKey = 'myStorage';
      const mStorage = getStorageProxy();
      const mWindow = {
        sessionStorage: mStorage,
      };
      const options = {
        window: mWindow,
        storage: {
          key: storageKey,
          typePriority: [
            'session',
            'local',
            'temp',
          ],
        },
      };
      let sut = null;
      let result = null;
      // When
      sut = getSutProxy(options);
      result = sut.getData();
      // Then
      expect(result).toEqual({});
      expect(mStorage.mocks.get).toHaveBeenCalledTimes(1);
      expect(mStorage.mocks.get).toHaveBeenCalledWith(options.storage.key);
      expect(mStorage.mocks.set).toHaveBeenCalledTimes(1);
      expect(mStorage.mocks.set).toHaveBeenCalledWith(storageKey, '{}');
    });

    it('should initialize the storage and restore saved data', () => {
      // Given
      const storageKey = 'myStorage';
      const savedData = {
        name: 'Charito',
      };
      const mStorage = getStorageProxy({
        [storageKey]: JSON.stringify(savedData),
      });
      const mWindow = {
        sessionStorage: mStorage,
      };
      const options = {
        window: mWindow,
        storage: {
          key: storageKey,
          typePriority: [
            'session',
            'local',
            'temp',
          ],
        },
      };
      let sut = null;
      let result = null;
      // When
      sut = getSutProxy(options);
      result = sut.getData();
      // Then
      expect(result).toEqual(savedData);
      expect(mStorage.mocks.get).toHaveBeenCalledTimes(1);
      expect(mStorage.mocks.get).toHaveBeenCalledWith(options.storage.key);
      expect(mStorage.mocks.set).toHaveBeenCalledTimes(0);
    });

    it('should initialize as a fallback for another storage', () => {
      // Given
      const storageKey = 'myStorage';
      const mStorage = getStorageProxy();
      const logger = {
        warn: jest.fn(),
      };
      const mWindow = {
        sessionStorage: mStorage,
      };
      const options = {
        logger,
        window: mWindow,
        storage: {
          key: storageKey,
          typePriority: [
            'local',
            'session',
            'temp',
          ],
        },
      };
      let sut = null;
      let result = null;
      // When
      sut = getSutProxy(options);
      result = sut.getData();
      // Then
      expect(result).toEqual({});
      expect(logger.warn).toHaveBeenCalledTimes(1);
      expect(logger.warn).toHaveBeenCalledWith(expect.any(String));
      expect(logger.warn.mock.calls[0][0]).toMatch(/is not available; switching to/i);
    });

    it('should delete the data from the storage', () => {
      // Given
      const storageKey = 'myStorage';
      const savedData = {
        name: 'Charito',
      };
      const mStorage = getStorageProxy({
        [storageKey]: JSON.stringify(savedData),
      });
      const mWindow = {
        sessionStorage: mStorage,
      };
      const options = {
        window: mWindow,
        storage: {
          key: storageKey,
          typePriority: [
            'session',
            'local',
            'temp',
          ],
        },
      };
      let sut = null;
      let result = null;
      // When
      sut = getSutProxy(options);
      sut.delete();
      result = sut.getData();
      // Then
      expect(result).toEqual({});
      expect(mStorage.mocks.get).toHaveBeenCalledTimes(1);
      expect(mStorage.mocks.get).toHaveBeenCalledWith(options.storage.key);
      expect(mStorage.mocks.delete).toHaveBeenCalledTimes(1);
      expect(mStorage.mocks.delete).toHaveBeenCalledWith(options.storage.key);
      expect(mStorage.mocks.set).toHaveBeenCalledTimes(0);
    });
  });

  describe('tempStorage', () => {
    it('should initialize the storage with empty data', () => {
      // Given
      const storageKey = 'myStorage';
      const mStorage = getStorageProxy();
      const options = {
        window: {},
        storage: {
          key: storageKey,
          typePriority: [
            'temp',
            'local',
            'session',
          ],
        },
        tempStorage: mStorage,
      };
      let sut = null;
      let result = null;
      // When
      sut = getSutProxy(options);
      result = sut.getData();
      // Then
      expect(result).toEqual({});
      expect(mStorage.mocks.get).toHaveBeenCalledTimes(1);
      expect(mStorage.mocks.get).toHaveBeenCalledWith(options.storage.key);
      expect(mStorage.mocks.set).toHaveBeenCalledTimes(1);
      expect(mStorage.mocks.set).toHaveBeenCalledWith(storageKey, {});
    });

    it('should initialize the storage and restore saved data', () => {
      // Given
      const storageKey = 'myStorage';
      const savedData = {
        name: 'Charito',
      };
      const mStorage = getStorageProxy({
        [storageKey]: savedData,
      });
      const options = {
        window: {},
        storage: {
          key: storageKey,
          typePriority: [
            'temp',
            'local',
            'session',
          ],
        },
        tempStorage: mStorage,
      };
      let sut = null;
      let result = null;
      // When
      sut = getSutProxy(options);
      result = sut.getData();
      // Then
      expect(result).toEqual(savedData);
      expect(mStorage.mocks.get).toHaveBeenCalledTimes(1);
      expect(mStorage.mocks.get).toHaveBeenCalledWith(options.storage.key);
      expect(mStorage.mocks.set).toHaveBeenCalledTimes(0);
    });

    it('should initialize as a fallback for another storage', () => {
      // Given
      const storageKey = 'myStorage';
      const mStorage = getStorageProxy();
      const logger = {
        warning: jest.fn(),
      };
      const options = {
        logger,
        window: {},
        storage: {
          key: storageKey,
          typePriority: [
            'local',
            'temp',
            'session',
          ],
        },
        tempStorage: mStorage,
      };
      let sut = null;
      let result = null;
      // When
      sut = getSutProxy(options);
      result = sut.getData();
      // Then
      expect(result).toEqual({});
      expect(logger.warning).toHaveBeenCalledTimes(1);
      expect(logger.warning).toHaveBeenCalledWith(expect.any(String));
      expect(logger.warning.mock.calls[0][0]).toMatch(/is not available; switching to/i);
    });

    it('should delete the data from the storage', () => {
      // Given
      const storageKey = 'myStorage';
      const savedData = {
        name: 'Charito',
      };
      const mStorage = getStorageProxy({
        [storageKey]: savedData,
      });
      const options = {
        window: {},
        storage: {
          key: storageKey,
          typePriority: [
            'temp',
            'local',
            'session',
          ],
        },
        tempStorage: mStorage,
      };
      let sut = null;
      let result = null;
      // When
      sut = getSutProxy(options);
      sut.delete();
      result = sut.getData();
      // Then
      expect(result).toEqual({});
      expect(mStorage.mocks.get).toHaveBeenCalledTimes(1);
      expect(mStorage.mocks.get).toHaveBeenCalledWith(options.storage.key);
      expect(mStorage.mocks.delete).toHaveBeenCalledTimes(1);
      expect(mStorage.mocks.delete).toHaveBeenCalledWith(options.storage.key);
      expect(mStorage.mocks.set).toHaveBeenCalledTimes(0);
    });
  });
});
