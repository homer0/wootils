/* eslint-disable no-process-env */

jest.unmock('/node/environmentUtils.js');
jest.mock('jimple', () => ({ provider: jest.fn(() => 'provider') }));

require('jasmine-expect');
const {
  EnvironmentUtils,
  environmentUtils,
} = require('/node/environmentUtils');
const { provider } = require('jimple');

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
    expect(envUtils.production).toBeTrue();
    expect(envUtils.development).toBeFalse();
  });

  it('should fallback to `development` if NODE_ENV is not production', () => {
    // Given
    delete process.env.NODE_ENV;
    // When
    const envUtils = new EnvironmentUtils();
    // Then
    expect(envUtils.env).toBe('development');
    expect(envUtils.production).toBeFalse();
    expect(envUtils.development).toBeTrue();
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

  it('should fallback to an empty string if a required variable doesn\'t exist', () => {
    // Given
    let result = 'unknown';
    // When
    const envUtils = new EnvironmentUtils();
    result = envUtils.get('Charito');
    // Then
    expect(result).toBeEmptyString();
  });

  it('should have a Jimple provider to register the service', () => {
    // Given
    const container = {
      set: jest.fn(),
    };
    // When
    provider.mock.calls[0][0](container);
    // Then
    expect(environmentUtils).toBe('provider');
    expect(provider).toHaveBeenCalledTimes(1);
    expect(container.set).toHaveBeenCalledTimes(1);
    expect(container.set.mock.calls[0][0]).toBe('environmentUtils');
    expect(container.set.mock.calls[0][1]).toBeFunction();
    expect(container.set.mock.calls[0][1]()).toBeInstanceOf(EnvironmentUtils);
  });
});
