jest.unmock('/node/pathUtils');
jest.mock('jimple', () => ({ provider: jest.fn(() => 'provider') }));

require('jasmine-expect');
const path = require('path');
const {
  PathUtils,
  pathUtils,
  pathUtilsWithHome,
} = require('/node/pathUtils');
const { provider } = require('jimple');

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

  it('should be able to be instantiated with a custom home/base ', () => {
    // Given
    const customHome = '/custom-folder/';
    const home = '/some-folder/';
    process.cwd = jest.fn(() => home);
    let sut = null;
    // When
    sut = new PathUtils(customHome);
    // Then
    expect(sut.path).toBe(path.join(home, customHome));
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

  it('should have a Jimple provider to register the service', () => {
    // Given
    const container = {
      set: jest.fn(),
    };
    // When
    provider.mock.calls[0][0](container);
    // Then
    expect(pathUtils).toBe('provider');
    expect(provider).toHaveBeenCalledTimes(1);
    expect(container.set).toHaveBeenCalledTimes(1);
    expect(container.set.mock.calls[0][0]).toBe('pathUtils');
    expect(container.set.mock.calls[0][1]).toBeFunction();
    expect(container.set.mock.calls[0][1]()).toBeInstanceOf(PathUtils);
  });

  it('should have a customizable Jimple provider to set an specific home/base', () => {
    // Given
    const customHome = '/custom-folder/';
    const home = '/some-folder/';
    process.cwd = jest.fn(() => home);
    const container = {
      set: jest.fn(),
    };
    let sut = null;
    // When
    pathUtilsWithHome(customHome);
    provider.mock.calls[1][0](container);
    // Then
    expect(pathUtils).toBe('provider');
    // - One is the default provider and twice the one generated now
    expect(container.set).toHaveBeenCalledTimes(1);
    expect(container.set.mock.calls[0][0]).toBe('pathUtils');
    expect(container.set.mock.calls[0][1]).toBeFunction();
    sut = container.set.mock.calls[0][1]();
    expect(sut).toBeInstanceOf(PathUtils);
    expect(sut.path).toBe(path.join(home, customHome));
  });
});
