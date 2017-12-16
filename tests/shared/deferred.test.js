jest.unmock('/shared/deferred');

require('jasmine-expect');
const deferred = require('/shared/deferred');

describe('Deferred', () => {
  it('should be able to resolve a deferred promise', () => {
    // Given
    const value = 'hello!';
    const delay = 1;
    const defer = deferred();
    // When
    setTimeout(() => defer.resolve(value), delay);
    // Then
    return defer.promise
    .then((resolved) => {
      expect(resolved).toBe(value);
    })
    .catch((error) => {
      throw error;
    });
  });

  it('should be able to reject a deferred promise', () => {
    // Given
    const value = new Error('Something went terribly wrong');
    const delay = 1;
    const defer = deferred();
    // When
    setTimeout(() => defer.reject(value), delay);
    // Then
    return defer.promise
    .then(() => {
      throw new Error('This test should resolve on the catch');
    })
    .catch((error) => {
      expect(error).toBeInstanceOf(Error);
      expect(error).toEqual(value);
    });
  });
});
