jest.mock('fs-extra');
jest.unmock('../../node/packageInfo');
jest.unmock('../../shared/deepAssign');
jest.unmock('../../shared/jimpleFns');

const fs = require('fs-extra');
const {
  packageInfo,
  packageInfoProvider,
} = require('../../node/packageInfo');

describe('packageInfo', () => {
  it('should give you the contents of the package.json', () => {
    // Given
    const pathUtils = {
      join: jest.fn((rest) => rest),
    };
    let sut = null;
    const mockedPackage = {
      name: 'batman',
      dependencies: {
        angular: '0.1',
      },
    };

    fs.readJsonSync.mockReturnValueOnce(mockedPackage);
    // When
    sut = packageInfo(pathUtils);
    // Then
    expect(sut).toEqual(mockedPackage);
    expect(fs.readJsonSync).toHaveBeenCalledTimes(1);
    expect(fs.readJsonSync).toHaveBeenCalledWith('package.json');
  });

  it('should include a provider for the DIC', () => {
    // Given
    const pathUtils = {
      join: jest.fn((rest) => rest),
    };
    const mockedPackage = {
      name: 'batman',
      dependencies: {
        angular: '0.1',
      },
    };
    const container = {
      set: jest.fn(),
      get: jest.fn(() => pathUtils),
    };
    let sut = null;
    let serviceName = null;
    let serviceFn = null;
    fs.readJsonSync.mockReturnValueOnce(mockedPackage);
    // When
    packageInfoProvider.register(container);
    [[serviceName, serviceFn]] = container.set.mock.calls;
    sut = serviceFn();
    // Then
    expect(serviceName).toBe('packageInfo');
    expect(sut).toEqual(mockedPackage);
    expect(container.get).toHaveBeenCalledTimes(1);
    expect(container.get).toHaveBeenCalledWith('pathUtils');
  });

  it('should allow custom options on its service provider', () => {
    // Given
    const pathUtils = {
      join: jest.fn((rest) => rest),
    };
    const mockedPackage = {
      name: 'batman',
      dependencies: {
        angular: '0.1',
      },
    };
    const options = {
      serviceName: 'MyPackageInfo!',
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
    fs.readJsonSync.mockReturnValueOnce(mockedPackage);
    // When
    packageInfoProvider(options).register(container);
    [[serviceName, serviceFn]] = container.set.mock.calls;
    sut = serviceFn();
    // Then
    expect(serviceName).toBe(options.serviceName);
    expect(sut).toEqual(mockedPackage);
    expect(container.get).toHaveBeenCalledTimes(0);
    expect(pathUtils.join).toHaveBeenCalledTimes(1);
  });
});
