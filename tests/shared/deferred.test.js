jest.unmock('../../shared/deferred');
const deferred = require('../../shared/deferred');

describe('Deferred', () => {
  it('should be able to resolve a deferred promise', async () => {
    // Given
    const value = 'hello!';
    const delay = 1;
    const defer = deferred();
    let result = null;
    // When
    setTimeout(() => defer.resolve(value), delay);
    result = await defer.promise;
    // Then
    expect(result).toBe(value);
  });

  it('should be able to reject a deferred promise', async () => {
    // Given
    const value = new Error('Something went terribly wrong');
    const delay = 1;
    const defer = deferred();
    expect.assertions(2);
    // When
    setTimeout(() => defer.reject(value), delay);
    return defer.promise.catch((error) => {
      // Then
      expect(error).toBeInstanceOf(Error);
      expect(error).toEqual(value);
    });
  });
});
