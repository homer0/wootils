jest.unmock('../../node/rootRequire');
jest.mock('jimple', () => ({ provider: jest.fn(() => 'provider') }));

const path = require('path');

const { provider } = require('jimple');
const {
  rootRequire,
  rootRequireProvider,
} = require('../../node/rootRequire');

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
    expect(sut).toEqual(require('../../node/providers'));
  });

  it('should have a Jimple provider to register the service', () => {
    // Given
    const container = {
      set: jest.fn(),
      get: jest.fn(() => pathUtils),
    };
    let sut = null;
    let serviceProvider = null;
    let serviceName = null;
    let serviceFn = null;
    let result = null;
    // When
    [[serviceProvider]] = provider.mock.calls;
    serviceProvider(container);
    [[serviceName, serviceFn]] = container.set.mock.calls;
    sut = serviceFn();
    result = sut('node/providers');
    // Then
    expect(rootRequireProvider).toBe('provider');
    expect(provider).toHaveBeenCalledTimes(1);
    expect(container.set).toHaveBeenCalledTimes(1);
    expect(serviceName).toBe('rootRequire');
    // eslint-disable-next-line global-require,import/no-dynamic-require
    expect(result).toEqual(require('../../node/providers'));
    expect(container.get).toHaveBeenCalledTimes(1);
    expect(container.get).toHaveBeenCalledWith('pathUtils');
  });
});
