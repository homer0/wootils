jest.unmock('../../node/rootRequire');
jest.unmock('../../shared/deepAssign');
jest.unmock('../../shared/jimpleFns');

const path = require('path');
const {
  rootRequire,
  rootRequireProvider,
} = require('../../node/rootRequire');

describe('rootRequire', () => {
  it('should give you the contents of the package.json', () => {
    // Given
    const cwd = process.cwd();
    const pathUtils = {
      join: jest.fn((...rest) => path.join(cwd, ...rest)),
    };
    const filepath = path.join('node', 'providers');
    let sut = null;
    // When
    sut = rootRequire(pathUtils)(filepath);
    // Then
    // eslint-disable-next-line global-require,import/no-dynamic-require
    expect(sut).toEqual(require(path.join('..', '..', filepath)));
    expect(pathUtils.join).toHaveBeenCalledTimes(1);
    expect(pathUtils.join).toHaveBeenCalledWith(filepath);
  });

  it('should include a provider for the DIC', () => {
    // Given
    const cwd = process.cwd();
    const pathUtils = {
      join: jest.fn((...rest) => path.join(cwd, ...rest)),
    };
    const filepath = path.join('node', 'providers');
    const container = {
      set: jest.fn(),
      get: jest.fn(() => pathUtils),
    };
    let sut = null;
    let serviceName = null;
    let serviceFn = null;
    let result = null;
    // When
    rootRequireProvider.register(container);
    [[serviceName, serviceFn]] = container.set.mock.calls;
    sut = serviceFn();
    result = sut(filepath);
    // Then
    expect(container.set).toHaveBeenCalledTimes(1);
    expect(serviceName).toBe('rootRequire');
    // eslint-disable-next-line global-require,import/no-dynamic-require
    expect(result).toEqual(require(path.join('..', '..', filepath)));
    expect(container.get).toHaveBeenCalledTimes(1);
    expect(container.get).toHaveBeenCalledWith('pathUtils');
    expect(pathUtils.join).toHaveBeenCalledTimes(1);
    expect(pathUtils.join).toHaveBeenCalledWith(filepath);
  });

  it('should allow custom options on its service provider', () => {
    // Given
    const cwd = process.cwd();
    const pathUtils = {
      join: jest.fn((...rest) => path.join(cwd, ...rest)),
    };
    const filepath = path.join('node', 'providers');
    const options = {
      serviceName: 'myRootRequire!',
      services: {
        pathUtils,
      },
    };
    const container = {
      set: jest.fn(),
      get: jest.fn(),
    };
    let sut = null;
    let serviceName = null;
    let serviceFn = null;
    let result = null;
    // When
    rootRequireProvider(options).register(container);
    [[serviceName, serviceFn]] = container.set.mock.calls;
    sut = serviceFn();
    result = sut(filepath);
    // Then
    expect(serviceName).toBe(options.serviceName);
    // eslint-disable-next-line global-require,import/no-dynamic-require
    expect(result).toEqual(require(path.join('..', '..', filepath)));
    expect(container.get).toHaveBeenCalledTimes(0);
    expect(pathUtils.join).toHaveBeenCalledTimes(1);
  });
});
