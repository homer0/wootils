jest.mock('fs-extra');
jest.mock('jimple', () => ({ provider: jest.fn(() => 'provider') }));
jest.unmock('../../node/packageInfo');

const fs = require('fs-extra');
const { provider } = require('jimple');
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

  it('should have a Jimple provider to register the service', () => {
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
    let serviceProvider = null;
    let serviceName = null;
    let serviceFn = null;
    fs.readJsonSync.mockReturnValueOnce(mockedPackage);
    // When
    [[serviceProvider]] = provider.mock.calls;
    serviceProvider(container);
    [[serviceName, serviceFn]] = container.set.mock.calls;
    sut = serviceFn();
    // Then
    expect(packageInfoProvider).toBe('provider');
    expect(provider).toHaveBeenCalledTimes(1);
    expect(serviceName).toBe('packageInfo');
    expect(sut).toEqual(mockedPackage);
    expect(container.get).toHaveBeenCalledTimes(1);
    expect(container.get).toHaveBeenCalledWith('pathUtils');
  });
});
