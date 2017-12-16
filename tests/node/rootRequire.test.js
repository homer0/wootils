jest.unmock('/node/rootRequire');
jest.mock('jimple', () => ({ provider: jest.fn(() => 'provider') }));

const path = require('path');
require('jasmine-expect');

const {
  rootRequire,
  rootRequireProvider,
} = require('/node/rootRequire');
const { provider } = require('jimple');

describe('rootRequire', () => {
  const pathUtils = {
    join: (...rest) => path.join(process.cwd(), ...rest),
  };

  it('should give you the contents of the package.json', () => {
    // Given
    let sut = null;
    // When
    sut = rootRequire(pathUtils)('node/providers');
    // Then
    // eslint-disable-next-line global-require,import/no-dynamic-require
    expect(sut).toEqual(require('/node/providers'));
  });

  it('should have a Jimple provider to register the service', () => {
    // Given
    const container = {
      set: jest.fn(),
      get: jest.fn(() => pathUtils),
    };
    let sut = null;
    let result = null;
    // When
    provider.mock.calls[0][0](container);
    // Then
    expect(rootRequireProvider).toBe('provider');
    expect(provider).toHaveBeenCalledTimes(1);
    expect(container.set).toHaveBeenCalledTimes(1);
    expect(container.set.mock.calls[0][0]).toBe('rootRequire');
    expect(container.set.mock.calls[0][1]).toBeFunction();
    sut = container.set.mock.calls[0][1]();
    expect(sut).toBeFunction();
    result = sut('node/providers');
    // eslint-disable-next-line global-require,import/no-dynamic-require
    expect(result).toEqual(require('/node/providers'));
    expect(container.get).toHaveBeenCalledTimes(1);
  });
});
