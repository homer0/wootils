jest.unmock('/node/packageInfo');
jest.mock('fs-extra');
jest.mock('jimple', () => ({ provider: jest.fn(() => 'provider') }));

require('jasmine-expect');
const fs = require('fs-extra');
const {
  packageInfo,
  packageInfoProvider,
} = require('/node/packageInfo');
const { provider } = require('jimple');

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
    fs.readJsonSync.mockReturnValueOnce(mockedPackage);
    // When
    provider.mock.calls[0][0](container);
    // Then
    expect(packageInfoProvider).toBe('provider');
    expect(provider).toHaveBeenCalledTimes(1);
    expect(container.set).toHaveBeenCalledTimes(1);
    expect(container.set.mock.calls[0][0]).toBe('packageInfo');
    expect(container.set.mock.calls[0][1]).toBeFunction();
    sut = container.set.mock.calls[0][1]();
    expect(sut).toEqual(mockedPackage);
    expect(container.get).toHaveBeenCalledTimes(1);
  });
});
