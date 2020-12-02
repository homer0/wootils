jest.unmock('../../node/pathUtils');
jest.unmock('../../shared/jimpleFns');

const path = require('path');
const { PathUtils, pathUtils } = require('../../node/pathUtils');

const originalProcesssCwd = process.cwd;

describe('PathUtils', () => {
  beforeEach(() => {
    process.cwd = originalProcesssCwd;
  });

  it('should be instantiated with the current directory (cwd) as home/base', () => {
    // Given
    const home = '/some-folder/';
    process.cwd = jest.fn(() => home);
    let sut = null;
    // When
    sut = new PathUtils();
    // Then
    expect(sut.path).toBe(home);
    expect(process.cwd).toHaveBeenCalledTimes(1);
  });

  it('should have getters for the app and home locations', () => {
    // Given
    const home = `${path.sep}some-folder${path.sep}`;
    process.cwd = jest.fn(() => home);
    let sut = null;
    let homePath = null;
    let appPath = null;
    const expectedAppPath = path.join(home, __dirname);
    // When
    sut = new PathUtils();
    homePath = sut.home;
    appPath = sut.app;
    // Then
    expect(homePath).toBe(home);
    expect(appPath).toBe(`${expectedAppPath}${path.sep}`);
  });

  it('should be able to be instantiated with a custom home/base ', () => {
    // Given
    const customHome = '/custom-folder/';
    const home = '/some-folder/';
    process.cwd = jest.fn(() => home);
    let sut = null;
    // When
    sut = new PathUtils(customHome);
    // Then
    expect(sut.path).toBe(home);
    expect(sut.home).toBe(path.join(home, customHome));
    expect(process.cwd).toHaveBeenCalledTimes(1);
  });

  it('should be able to join multiple paths using the home as origin', () => {
    // Given
    const home = '/some-folder/';
    const testPathOne = '/sub-dir-one/';
    const testPathTwo = '/sub-file.js';
    process.cwd = jest.fn(() => home);
    let sut = null;
    let result = null;
    // When
    sut = new PathUtils();
    result = sut.join(testPathOne, testPathTwo);
    // Then
    expect(result).toBe(path.join(home, testPathOne, testPathTwo));
  });

  it('should be able to add a custom location', () => {
    // Given
    const home = '/some-folder/';
    const locationName = 'customLocation';
    const locationPath = '/custom-location/';
    process.cwd = jest.fn(() => home);
    let sut = null;
    let result = null;
    // When
    sut = new PathUtils();
    sut.addLocation(locationName, locationPath);
    result = sut.getLocation(locationName);
    // Then
    expect(result).toBe(path.join(home, locationPath));
  });

  it("should throw an error if a requested location doesn't exist", () => {
    // Given
    let sut = null;
    // When
    sut = new PathUtils();
    // When-Then
    expect(() => sut.getLocation('custom')).toThrow(/there's no location/i);
  });

  it('should include a provider for the DIC', () => {
    // Given
    const container = {
      set: jest.fn(),
    };
    let sut = null;
    let serviceName = null;
    let serviceFn = null;
    // When
    pathUtils.register(container);
    [[serviceName, serviceFn]] = container.set.mock.calls;
    sut = serviceFn();
    // Then
    expect(serviceName).toBe('pathUtils');
    expect(sut).toBeInstanceOf(PathUtils);
  });

  it('should allow custom options on its service provider', () => {
    // Given
    const container = {
      set: jest.fn(),
    };
    const customHome = '/custom-folder/';
    const home = '/some-folder/';
    process.cwd = jest.fn(() => home);
    const options = {
      serviceName: 'myPaths',
      home: customHome,
    };
    let sut = null;
    let serviceName = null;
    let serviceFn = null;
    // When
    pathUtils(options).register(container);
    [[serviceName, serviceFn]] = container.set.mock.calls;
    sut = serviceFn();
    // Then
    expect(serviceName).toBe(options.serviceName);
    expect(sut).toBeInstanceOf(PathUtils);
    expect(sut.path).toBe(home);
    expect(sut.home).toBe(path.join(home, customHome));
  });
});
