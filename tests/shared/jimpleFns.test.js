jest.unmock('../../shared/jimpleFns');

const {
  resource,
  resourceCreator,
  resourcesCollection,
  provider,
  providerCreator,
  providers,
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
      expect(() => resourcesCollection(name, key)({ [key]: 'something' }))
      .toThrow(/No item on the collection can have the keys `\w+` nor `\w+`$/);
    });

    it('should throw an error if an item doesn\'t have a `key` function', () => {
      // Given
      const name = 'providers';
      const key = 'register';
      // When/Then
      expect(() => resourcesCollection(name, key)({ something: {} }))
      .toThrow(/The item `\w+` is invalid: it doesn't have a `\w+` function/);
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
});
