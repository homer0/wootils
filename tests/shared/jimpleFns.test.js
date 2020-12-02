jest.unmock('../../shared/jimpleFns');
const Jimple = require('jimple');
const {
  resource,
  resourceCreator,
  resourcesCollection,
  provider,
  providerCreator,
  providers,
  proxyContainer,
} = require('../../shared/jimpleFns');

describe('JimpleFns', () => {
  describe('resource', () => {
    it('should create an resource', () => {
      // Given
      const name = 'provider';
      const key = 'register';
      const fn = jest.fn();
      const arg = 'hello world';
      let result = null;
      // When
      result = resource(name, key, fn);
      result[key](arg);
      // Then
      expect(result).toEqual({
        [name]: true,
        [key]: fn,
      });
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('resourceCreator', () => {
    it('should create a resource creator', () => {
      // Given
      const name = 'providerCreator';
      const key = 'register';
      const finalResource = 'Batman';
      const creatorFn = jest.fn(() => finalResource);
      let sut = null;
      // When
      sut = resourceCreator(name, key, creatorFn);
      // Then
      expect(sut[name]).toBe(true);
      expect(sut[key]).toBe(finalResource);
      expect(creatorFn).toHaveBeenCalledTimes(1);
    });

    it('should only create the non-configured resource once', () => {
      // Given
      const name = 'providerCreator';
      const key = 'register';
      const finalResource = 'Batman';
      const creatorFn = jest.fn(() => finalResource);
      let sut = null;
      // When
      sut = resourceCreator(name, key, creatorFn);
      // Then
      expect(sut[name]).toBe(true);
      expect(sut[key]).toBe(finalResource);
      expect(sut[key]).toBe(finalResource);
      expect(sut.invalid).toBe(undefined);
      expect(creatorFn).toHaveBeenCalledTimes(1);
    });

    it('should allow to configure the resource', () => {
      // Given
      const name = 'providerCreator';
      const key = 'register';
      const finalResource = 'Batman';
      const creatorFn = jest.fn(() => finalResource);
      const arg = 'hello world';
      let sut = null;
      let configured = null;
      // When
      sut = resourceCreator(name, key, creatorFn);
      configured = sut(arg);
      // Then
      expect(configured).toStrictEqual({
        [name]: true,
        [key]: finalResource,
      });
      expect(creatorFn).toHaveBeenCalledTimes(1);
      expect(creatorFn).toHaveBeenCalledWith(arg);
    });
  });

  describe('resourcesCollection', () => {
    it('should throw an error if an item uses the name of the resource as key', () => {
      // Given
      const name = 'providers';
      const key = 'register';
      // When/Then
      expect(() => resourcesCollection(name, key)({ [key]: 'something' })).toThrow(
        /No item on the collection can have the keys `\w+` nor `\w+`$/,
      );
    });

    it("should throw an error if an item doesn't have a `key` function", () => {
      // Given
      const name = 'providers';
      const key = 'register';
      // When/Then
      expect(() => resourcesCollection(name, key)({ something: {} })).toThrow(
        /The item `\w+` is invalid: it doesn't have a `\w+` function/,
      );
    });

    it('should create a collection', () => {
      // Given
      const name = 'providers';
      const key = 'register';
      const itemOne = {
        [key]: jest.fn(),
        name: 'one',
      };
      const itemTwo = {
        [key]: jest.fn(),
        name: 'two',
      };
      const items = { itemOne, itemTwo };
      const arg = 'hello world';
      let sut = null;
      // When
      sut = resourcesCollection(name, key)(items);
      sut[key](arg);
      // Then
      expect(sut[name]).toBe(true);
      expect(sut.itemOne).toBe(itemOne);
      expect(sut.itemTwo).toBe(itemTwo);
      expect(itemOne[key]).toHaveBeenCalledTimes(1);
      expect(itemOne[key]).toHaveBeenCalledWith(arg);
      expect(itemTwo[key]).toHaveBeenCalledTimes(1);
      expect(itemTwo[key]).toHaveBeenCalledWith(arg);
    });

    it('should create a collection with a custom function', () => {
      // Given
      const name = 'providers';
      const key = 'register';
      const itemOne = {
        [key]: jest.fn(),
        name: 'one',
      };
      const itemTwo = {
        [key]: jest.fn(),
        name: 'two',
      };
      const items = { itemOne, itemTwo };
      const arg = 'hello world';
      const extraArg = 'from the mock!';
      const fn = jest.fn((fnItems, ...args) => {
        Object.values(fnItems).forEach((fnItem) => {
          fnItem[key](extraArg, ...args);
        });
      });
      let sut = null;
      // When
      sut = resourcesCollection(name, key, fn)(items);
      sut[key](arg);
      // Then
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith(items, arg);
      expect(itemOne[key]).toHaveBeenCalledTimes(1);
      expect(itemOne[key]).toHaveBeenCalledWith(extraArg, arg);
      expect(itemTwo[key]).toHaveBeenCalledTimes(1);
      expect(itemTwo[key]).toHaveBeenCalledWith(extraArg, arg);
    });
  });

  describe('provider', () => {
    it('should create a Jimple provider', () => {
      // Given
      const registerFn = 'Batman';
      let sut = null;
      // When
      sut = provider(registerFn);
      // Then
      expect(sut).toStrictEqual({
        provider: true,
        register: registerFn,
      });
    });
  });

  describe('providerCreator', () => {
    it('should create a provider creator for Jimple', () => {
      // Given
      const finalResource = 'Batman';
      const registerFn = jest.fn(() => finalResource);
      const creatorFn = jest.fn(() => registerFn);
      let sut = null;
      let result = null;
      // When
      sut = providerCreator(creatorFn);
      result = sut.register();
      // Then
      expect(result).toBe(finalResource);
      expect(creatorFn).toHaveBeenCalledTimes(1);
    });

    it('should create a configurable provider creator for Jimple', () => {
      // Given
      const finalResource = 'Batman';
      const registerFn = jest.fn(() => finalResource);
      const creatorFn = jest.fn(() => registerFn);
      const arg = 'hello world';
      let sut = null;
      let result = null;
      // When
      sut = providerCreator(creatorFn);
      result = sut(arg).register();
      // Then
      expect(result).toBe(finalResource);
      expect(creatorFn).toHaveBeenCalledTimes(1);
      expect(creatorFn).toHaveBeenCalledWith(arg);
    });
  });

  describe('providers', () => {
    it('should create a collection of providers', () => {
      // Given
      const itemOneRegister = jest.fn();
      const itemOne = provider(itemOneRegister);
      const itemTwoRegister = jest.fn();
      const itemTwoCreator = jest.fn(() => itemTwoRegister);
      const itemTwo = providerCreator(itemTwoCreator);
      const items = { itemOne, itemTwo };
      const arg = 'hello world';
      let sut = null;
      // When
      sut = providers(items);
      sut.register(arg);
      // Then
      expect(sut.itemOne).toBe(itemOne);
      expect(sut.itemTwo).toBe(itemTwo);
      expect(itemOne.register).toHaveBeenCalledTimes(1);
      expect(itemOne.register).toHaveBeenCalledWith(arg);
      expect(itemTwoCreator).toHaveBeenCalledTimes(1);
      expect(itemTwo.register).toHaveBeenCalledTimes(1);
      expect(itemTwo.register).toHaveBeenCalledWith(arg);
    });
  });

  describe('proxyContainer', () => {
    it('should create a proxy of a container', () => {
      // Given
      const original = new Jimple();
      let sut = null;
      // When
      sut = proxyContainer(original);
      // Then
      expect(sut).toBeInstanceOf(Jimple);
      expect(sut.proxy).toBe(true);
    });

    it('should return the container items as properties', () => {
      // Given
      const original = new Jimple();
      const itemKey = 'name';
      const itemValue = 'Rosario';
      let sut = null;
      let result = null;
      let resultAsProperty = null;
      // When
      original.set(itemKey, itemValue);
      sut = proxyContainer(original);
      result = sut.get(itemKey);
      resultAsProperty = sut[itemKey];
      // Then
      expect(result).toBe(itemValue);
      expect(resultAsProperty).toBe(itemValue);
    });

    it("shouldn't overwrite access to the private properties", () => {
      // Given
      const original = new Jimple();
      let sut = null;
      let result = null;
      // When
      sut = proxyContainer(original);
      // eslint-disable-next-line no-underscore-dangle
      result = sut._items;
      // Then
      expect(result).toEqual({});
    });

    it('should support using the $ prefix for a try-get access', () => {
      /**
       * A try-get is something implemented on Jimpex: container.try('...') will validate if the
       * resource exist and then return it, but if it doesn't exist, it will return `null`.
       */
      // Given
      const original = new Jimple();
      const itemKey = 'name';
      const itemValue = 'Rosario';
      let sut = null;
      let resultOfExistingResource = null;
      let resultOfInvalidResource = null;
      // When
      original.set(itemKey, itemValue);
      sut = proxyContainer(original);
      resultOfExistingResource = sut[`$${itemKey}`];
      resultOfInvalidResource = sut.$someInvalidKey;
      // Then
      expect(resultOfExistingResource).toBe(itemValue);
      expect(resultOfInvalidResource).toBe(null);
    });

    it('should support keys with the $ prefix, even if they invalidate the try-get', () => {
      /**
       * A try-get is something implemented on Jimpex: container.try('...') will validate if the
       * resource exist and then return it, but if it doesn't exist, it will return `null`.
       */
      // Given
      const original = new Jimple();
      const itemKey = '$name';
      const itemValue = 'Rosario';
      let sut = null;
      let result = null;
      let resultWithPrefix = null;
      // When
      original.set(itemKey, itemValue);
      sut = proxyContainer(original);
      result = sut[`${itemKey}`];
      resultWithPrefix = sut[`$${itemKey}`];
      // Then
      expect(result).toBe(itemValue);
      expect(resultWithPrefix).toBe(itemValue);
    });

    it('should have a custom register method that sends the proxy', () => {
      // Given
      const original = new Jimple();
      const itemKey = 'firstDaughter';
      const itemValue = 'Rosario';
      const registerFn = jest.fn((c) => {
        // eslint-disable-next-line no-param-reassign
        c[itemKey] = itemValue;
      });
      const itemProvider = provider(registerFn);
      let sut = null;
      let result = null;
      // When
      sut = proxyContainer(original);
      sut.register(itemProvider);
      result = sut.get(itemKey);
      // Then
      expect(result).toBe(itemValue);
      expect(registerFn).toHaveBeenCalledTimes(1);
    });

    it('should support registering a resource as a property', () => {
      // Given
      const original = new Jimple();
      const itemOneKey = 'firstDaughter';
      const itemOneValue = 'Rosario';
      const itemTwoKey = 'secondDaughter';
      const itemTwoValue = 'Pilar';
      let sut = null;
      let result = null;
      let resultAsProperty = null;
      // When
      sut = proxyContainer(original);
      sut.set(itemOneKey, itemOneValue);
      sut[itemTwoKey] = itemTwoValue;
      result = sut.get(itemTwoKey);
      resultAsProperty = sut[itemOneKey];
      // Then
      expect(result).toBe(itemTwoValue);
      expect(resultAsProperty).toBe(itemOneValue);
    });

    it('should throw an error when trying to register a class method as a resource', () => {
      // Given
      const original = new Jimple();
      let sut = null;
      // When/Then
      sut = proxyContainer(original);
      expect(() => {
        sut.get = 'something';
      }).toThrow(/The key 'get' is reserved and cannot be used/);
    });

    it("should return the resources' keys when called with Object.keys", () => {
      // Given
      const original = new Jimple();
      const itemOneKey = 'firstDaughter';
      const itemOneValue = 'Rosario';
      const itemTwoKey = 'secondDaughter';
      const itemTwoValue = 'Pilar';
      let sut = null;
      let result = null;
      // When
      sut = proxyContainer(original);
      sut[itemOneKey] = itemOneValue;
      sut[itemTwoKey] = itemTwoValue;
      result = Object.keys(sut).sort();
      // Then
      expect(result).toEqual([itemOneKey, itemTwoKey].sort());
    });

    it('should recognize the resources as its own keys', () => {
      // Given
      const original = new Jimple();
      const itemOneKey = 'firstDaughter';
      const itemOneValue = 'Rosario';
      const itemTwoKey = 'secondDaughter';
      const itemTwoValue = 'Pilar';
      let sut = null;
      let resultForKeyOne = false;
      let resultForKeyTwo = false;
      let resultForInvalidKey = null;
      // When
      sut = proxyContainer(original);
      sut[itemOneKey] = itemOneValue;
      sut[itemTwoKey] = itemTwoValue;
      resultForKeyOne = itemOneKey in sut;
      resultForKeyTwo = itemTwoKey in sut;
      resultForInvalidKey = Object.getOwnPropertyDescriptor(sut, 'invalid');
      // Then
      expect(resultForKeyOne).toBe(true);
      expect(resultForKeyTwo).toBe(true);
      expect(resultForInvalidKey).toBeUndefined();
    });
  });
});
