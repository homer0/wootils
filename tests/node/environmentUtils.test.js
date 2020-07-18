/* eslint-disable no-process-env */
jest.unmock('../../node/environmentUtils.js');
jest.unmock('../../shared/jimpleFns.js');

const {
  EnvironmentUtils,
  environmentUtils,
} = require('../../node/environmentUtils');

const originalEnv = process.env;

describe('EnvironmentUtils', () => {
  afterEach(() => {
    process.env = originalEnv;
  });

  it('should load the NODE_ENV value and set the production flag correctly', () => {
    // Given
    const env = 'production';
    process.env.NODE_ENV = env;
    // When
    const envUtils = new EnvironmentUtils();
    // Then
    expect(envUtils.env).toBe(env);
    expect(envUtils.production).toBe(true);
    expect(envUtils.development).toBe(false);
  });

  it('should fallback to `development` if NODE_ENV is not production', () => {
    // Given
    delete process.env.NODE_ENV;
    // When
    const envUtils = new EnvironmentUtils();
    // Then
    expect(envUtils.env).toBe('development');
    expect(envUtils.production).toBe(false);
    expect(envUtils.development).toBe(true);
  });

  it('should allow you to access environment variables', () => {
    // Given
    const varName = 'Bruce';
    const varValue = 'Wayne';
    process.env[varName] = varValue;
    let result = '';
    // When
    const envUtils = new EnvironmentUtils();
    result = envUtils.get(varName);
    // Then
    expect(result).toBe(varValue);
  });

  it('should fallback to an empty string if a specified variable doesn\'t exist', () => {
    // Given
    let result = 'unknown';
    // When
    const envUtils = new EnvironmentUtils();
    result = envUtils.get('Charito');
    // Then
    expect(result).toBe('');
  });

  it('should throw an error if a required variable doesn\'t exist', () => {
    // Given/When/Then
    const envUtils = new EnvironmentUtils();
    expect(() => envUtils.get('Charito', '', true))
    .toThrow(/The following environment variable is missing/i);
  });

  it('should set the value for an environment variable', () => {
    // Given
    const varName = 'BATMAN_IDENTITY';
    const varValue = 'Bruce Wayne';
    let result = null;
    let saved = null;
    // When
    delete process.env[varName];
    const envUtils = new EnvironmentUtils();
    result = envUtils.set(varName, varValue);
    saved = envUtils.get(varName);
    // Then
    expect(result).toBe(true);
    expect(saved).toBe(varValue);
  });

  it('shouldn\'t overwrite an existing environment variable', () => {
    // Given
    const varName = 'ROBIN_IDENTITY';
    const varOriginalValue = 'Tim Drake';
    const varValue = 'Damian Wayne';
    let result = null;
    let saved = null;
    // When
    process.env[varName] = varOriginalValue;
    const envUtils = new EnvironmentUtils();
    result = envUtils.set(varName, varValue);
    saved = envUtils.get(varName);
    // Then
    expect(result).toBe(false);
    expect(saved).toBe(varOriginalValue);
  });

  it('should overwrite an existing environment variable', () => {
    // Given
    const varName = 'ROBIN_IDENTITY';
    const varOriginalValue = 'Tim Drake';
    const varValue = 'Damian Wayne';
    let result = null;
    let saved = null;
    // When
    process.env[varName] = varOriginalValue;
    const envUtils = new EnvironmentUtils();
    result = envUtils.set(varName, varValue, true);
    saved = envUtils.get(varName);
    // Then
    expect(result).toBe(true);
    expect(saved).toBe(varValue);
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
    environmentUtils.register(container);
    [[serviceName, serviceFn]] = container.set.mock.calls;
    sut = serviceFn();
    // Then
    expect(serviceName).toBe('environmentUtils');
    expect(sut).toBeInstanceOf(EnvironmentUtils);
  });

  it('should allow custom options on its service provider', () => {
    // Given
    const container = {
      set: jest.fn(),
    };
    const options = {
      serviceName: 'myEnv',
    };
    let sut = null;
    let serviceName = null;
    let serviceFn = null;
    // When
    environmentUtils(options).register(container);
    [[serviceName, serviceFn]] = container.set.mock.calls;
    sut = serviceFn();
    // Then
    expect(serviceName).toBe(options.serviceName);
    expect(sut).toBeInstanceOf(EnvironmentUtils);
  });
});
