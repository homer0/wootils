jest.unmock('/shared/objectUtils');
jest.unmock('/node/appConfiguration');
jest.mock('jimple', () => ({ provider: jest.fn(() => 'provider') }));

require('jasmine-expect');
const path = require('path');
const {
  AppConfiguration,
  appConfiguration,
} = require('/node/appConfiguration');
const { provider } = require('jimple');

describe('AppConfiguration', () => {
  /**
   * Generates a dictinoary of all the expected properties of a {@link AppConfiguartion} class
   * when the defaults are not customized.
   *
   * @returns {Object}
   */
  const getExpectedDefaults = () => ({
    options: {
      defaultConfigurationName: 'default',
      environmentVariable: 'APP_CONFIG',
      path: './config/app',
      filenameFormat: 'app.[name].config.js',
    },
    configurations: {
      default: {},
    },
    activeConfiguration: 'default',
    allowConfigurationSwitch: false,
  });
  /**
   * Generates the information of the default configuration file based on the value of the
   * `name` option that will be sent to {@link AppConfiguration}.
   *
   * @param {string} name  The name of the configuration.
   * @returns {Object}
   */
  const getDefaultFileInfo = (name) => ({
    path: path.join('config', 'app', `app.${name}.config.js`),
    name: `app.${name}.config.js`,
  });

  it('should be instantiated with the default options', () => {
    // Given
    const environmentUtils = 'environmentUtils';
    const rootRequire = 'rootRequire';
    let sut = null;
    const expectedDefaults = getExpectedDefaults();
    // When
    sut = new AppConfiguration(environmentUtils, rootRequire);
    // Then
    expect(sut).toBeInstanceOf(AppConfiguration);
    expect(sut.environmentUtils).toBe(environmentUtils);
    expect(sut.rootRequire).toBe(rootRequire);
    expect(sut.options).toEqual(expectedDefaults.options);
    expect(sut.configurations).toEqual(expectedDefaults.configurations);
    expect(sut.activeConfiguration).toBe(expectedDefaults.activeConfiguration);
    expect(sut.allowConfigurationSwitch).toBe(expectedDefaults.allowConfigurationSwitch);
  });

  it('should load a new configuration', () => {
    // Given
    const environmentUtils = 'environmentUtils';
    const rootRequire = 'rootRequire';
    const newConfigName = 'charitoConfig';
    const newConfigSettings = {
      name: 'charito',
      allowConfigurationSwitch: true,
    };
    let sut = null;
    let result = null;
    // When
    sut = new AppConfiguration(environmentUtils, rootRequire);
    result = sut.load(newConfigName, newConfigSettings);
    // Then
    expect(result).toEqual(newConfigSettings);
    expect(sut.configurations[newConfigName]).toEqual(newConfigSettings);
    expect(sut.activeConfiguration).toBe(newConfigName);
    expect(sut.allowConfigurationSwitch).toBeTrue();
  });

  it('should load a new configuration without switch to it', () => {
    // Given
    const environmentUtils = 'environmentUtils';
    const rootRequire = 'rootRequire';
    const newConfigName = 'charitoConfig';
    const newConfigSettings = {
      name: 'charito',
      allowConfigurationSwitch: true,
    };
    let sut = null;
    let result = null;
    const expectedDefaults = getExpectedDefaults();
    // When
    sut = new AppConfiguration(environmentUtils, rootRequire);
    result = sut.load(newConfigName, newConfigSettings, false);
    // Then
    expect(result).toEqual(newConfigSettings);
    expect(sut.configurations[newConfigName]).toEqual(newConfigSettings);
    expect(sut.activeConfiguration).toBe(expectedDefaults.activeConfiguration);
  });

  it('should load a new configuration that extends an existing one', () => {
    // Given
    const environmentUtils = 'environmentUtils';
    const rootRequire = 'rootRequire';
    const newConfigOneName = 'charitoConfig';
    const newConfigOneSettings = {
      name: 'charito',
      allowConfigurationSwitch: true,
    };
    const newConfigTwoName = 'rosarioConfig';
    const newConfigTwoSettings = {
      extends: newConfigOneName,
      birthday: '25-09',
      allowConfigurationSwitch: false,
    };
    let sut = null;
    let result = null;
    const expectedConfig = {
      ...newConfigOneSettings,
      ...newConfigTwoSettings,
    };
    delete expectedConfig.extends;
    // When
    sut = new AppConfiguration(environmentUtils, rootRequire);
    sut.load(newConfigOneName, newConfigOneSettings);
    result = sut.load(newConfigTwoName, newConfigTwoSettings);
    // Then
    expect(result).toEqual(expectedConfig);
    expect(sut.configurations[newConfigOneName]).toEqual(newConfigOneSettings);
    expect(sut.configurations[newConfigTwoName]).toEqual(expectedConfig);
    expect(sut.activeConfiguration).toBe(newConfigTwoName);
    expect(sut.allowConfigurationSwitch).toBeFalse();
  });

  it('should throw an error when trying to extend an unknown configuration', () => {
    // Given
    const environmentUtils = 'environmentUtils';
    const rootRequire = 'rootRequire';
    const newConfigName = 'charitoConfig';
    const newConfigSettings = {
      extends: 'random',
      name: 'charito',
      allowConfigurationSwitch: true,
    };
    let sut = null;
    // When
    sut = new AppConfiguration(environmentUtils, rootRequire);
    // Then
    expect(() => sut.load(newConfigName, newConfigSettings))
    .toThrow(/The base configuration for \w+ doesn't exist/i);
  });

  it('should load a new configuration from a file', () => {
    // Given
    const environmentUtils = 'environmentUtils';
    const newConfigName = 'charitoConfig';
    const newConfigSettings = {
      name: 'charito',
      allowConfigurationSwitch: true,
    };
    const rootRequire = jest.fn(() => newConfigSettings);
    let sut = null;
    let result = null;
    const expectedFileInfo = getDefaultFileInfo(newConfigName);
    // When
    sut = new AppConfiguration(environmentUtils, rootRequire);
    result = sut.loadFromFile(newConfigName);
    // Then
    expect(result).toEqual(newConfigSettings);
    expect(sut.configurations[newConfigName]).toEqual(newConfigSettings);
    expect(sut.activeConfiguration).toBe(newConfigName);
    expect(sut.allowConfigurationSwitch).toBeTrue();
    expect(rootRequire).toHaveBeenCalledTimes(1);
    expect(rootRequire).toHaveBeenCalledWith(expectedFileInfo.path);
  });

  it('should load a new configuration from a file without switch to it', () => {
    // Given
    const environmentUtils = 'environmentUtils';
    const newConfigName = 'charitoConfig';
    const newConfigSettings = {
      name: 'charito',
      allowConfigurationSwitch: true,
    };
    const rootRequire = jest.fn(() => newConfigSettings);
    let sut = null;
    let result = null;
    const expectedFileInfo = getDefaultFileInfo(newConfigName);
    const expectedDefaults = getExpectedDefaults();
    // When
    sut = new AppConfiguration(environmentUtils, rootRequire);
    result = sut.loadFromFile(newConfigName, false);
    // Then
    expect(result).toEqual(newConfigSettings);
    expect(sut.configurations[newConfigName]).toEqual(newConfigSettings);
    expect(sut.activeConfiguration).toBe(expectedDefaults.activeConfiguration);
    expect(rootRequire).toHaveBeenCalledTimes(1);
    expect(rootRequire).toHaveBeenCalledWith(expectedFileInfo.path);
  });

  it('should load a new configuration from a file that extends another file', () => {
    // Given
    const environmentUtils = 'environmentUtils';
    const newConfigOneName = 'charitoConfig';
    const newConfigOneSettings = {
      name: 'charito',
      allowConfigurationSwitch: true,
    };
    const newConfigTwoName = 'rosarioConfig';
    const newConfigTwoSettings = {
      extends: newConfigOneName,
      birthday: '25-09',
      allowConfigurationSwitch: false,
    };
    const rootRequire = jest.fn();
    rootRequire.mockImplementationOnce(() => newConfigTwoSettings);
    rootRequire.mockImplementationOnce(() => newConfigOneSettings);
    let sut = null;
    let result = null;
    const expectedConfig = {
      ...newConfigOneSettings,
      ...newConfigTwoSettings,
    };
    delete expectedConfig.extends;
    const expectedFileInfoOne = getDefaultFileInfo(newConfigOneName);
    const expectedFileInfoTwo = getDefaultFileInfo(newConfigTwoName);
    // When
    sut = new AppConfiguration(environmentUtils, rootRequire);
    result = sut.loadFromFile(newConfigTwoName);
    // Then
    expect(result).toEqual(expectedConfig);
    expect(sut.configurations[newConfigOneName]).toEqual(newConfigOneSettings);
    expect(sut.configurations[newConfigTwoName]).toEqual(expectedConfig);
    expect(sut.activeConfiguration).toBe(newConfigTwoName);
    expect(sut.allowConfigurationSwitch).toBeFalse();
    expect(rootRequire).toHaveBeenCalledTimes([
      newConfigOneName,
      newConfigTwoName,
    ].length);
    expect(rootRequire).toHaveBeenCalledWith(expectedFileInfoTwo.path);
    expect(rootRequire).toHaveBeenCalledWith(expectedFileInfoOne.path);
  });

  it('should throw an error when unable a `require` from a configuration file fails', () => {
    // Given
    const environmentUtils = 'environmentUtils';
    const error = new Error('Unknown error');
    const rootRequire = jest.fn(() => {
      throw error;
    });
    const newConfigName = 'charitoConfig';
    let sut = null;
    const expectedFileInfo = getDefaultFileInfo(newConfigName);
    // When
    sut = new AppConfiguration(environmentUtils, rootRequire);
    // Then
    expect(() => sut.loadFromFile(newConfigName))
    .toThrow(/The configuration file couldn't be loaded/i);
    expect(rootRequire).toHaveBeenCalledTimes(1);
    expect(rootRequire).toHaveBeenCalledWith(expectedFileInfo.path);
  });

  it('should load a new configuration from a file based on the name on the env var', () => {
    // Given
    const newConfigName = 'charitoConfig';
    const environmentUtils = {
      get: jest.fn(() => newConfigName),
    };
    const newConfigSettings = {
      name: 'charito',
      allowConfigurationSwitch: true,
    };
    const rootRequire = jest.fn(() => newConfigSettings);
    let sut = null;
    let result = null;
    const expectedFileInfo = getDefaultFileInfo(newConfigName);
    // When
    sut = new AppConfiguration(environmentUtils, rootRequire);
    result = sut.loadFromEnvironment();
    // Then
    expect(result).toEqual(newConfigSettings);
    expect(sut.configurations[newConfigName]).toEqual(newConfigSettings);
    expect(sut.activeConfiguration).toBe(newConfigName);
    expect(sut.allowConfigurationSwitch).toBeTrue();
    expect(rootRequire).toHaveBeenCalledTimes(1);
    expect(rootRequire).toHaveBeenCalledWith(expectedFileInfo.path);
  });

  it('shouldn\'t do anything if the env var is empty when checking for a configuration', () => {
    // Given
    const newConfigName = 'charitoConfig';
    const environmentUtils = {
      get: jest.fn(),
    };
    const rootRequire = 'rootRequire';
    let sut = null;
    let result = null;
    const expectedDefaults = getExpectedDefaults();
    // When
    sut = new AppConfiguration(environmentUtils, rootRequire);
    result = sut.loadFromEnvironment();
    // Then
    expect(result).toEqual({});
    expect(sut.configurations[newConfigName]).toBeUndefined();
    expect(sut.activeConfiguration).toBe(expectedDefaults.activeConfiguration);
  });

  it('should return an entire configuration by its name', () => {
    // Given
    const environmentUtils = 'environmentUtils';
    const rootRequire = 'rootRequire';
    const newConfigName = 'charitoConfig';
    const newConfigSettings = {
      name: 'charito',
      allowConfigurationSwitch: true,
    };
    let sut = null;
    let result = null;
    // When
    sut = new AppConfiguration(environmentUtils, rootRequire);
    sut.load(newConfigName, newConfigSettings);
    result = sut.getConfig(newConfigName);
    // Then
    expect(result).toEqual(newConfigSettings);
  });

  it('should return the active configuration if no name is specified on `getConfig`', () => {
    // Given
    const environmentUtils = 'environmentUtils';
    const rootRequire = 'rootRequire';
    const newConfigName = 'charitoConfig';
    const newConfigSettings = {
      name: 'charito',
    };
    let sut = null;
    let result = null;
    // When
    sut = new AppConfiguration(environmentUtils, rootRequire);
    sut.load(newConfigName, newConfigSettings, false);
    result = sut.getConfig();
    // Then
    expect(result).toEqual({});
  });

  it('should merge an entire configuration by its name', () => {
    // Given
    const environmentUtils = 'environmentUtils';
    const rootRequire = 'rootRequire';
    const newConfigName = 'charitoConfig';
    const newConfigSettings = {
      name: 'charito',
      allowConfigurationSwitch: true,
    };
    const updatedSettings = {
      allowConfigurationSwitch: false,
      extra: 'value',
    };
    let sut = null;
    let result = null;
    // When
    sut = new AppConfiguration(environmentUtils, rootRequire);
    sut.load(newConfigName, newConfigSettings);
    result = sut.setConfig(updatedSettings, newConfigName);
    // Then
    expect(result).toEqual({ ...newConfigSettings, ...updatedSettings });
  });

  it('should overwrite an entire configuration by its name', () => {
    // Given
    const environmentUtils = 'environmentUtils';
    const rootRequire = 'rootRequire';
    const newConfigName = 'charitoConfig';
    const newConfigSettings = {
      name: 'charito',
      allowConfigurationSwitch: true,
    };
    const updatedSettings = {
      allowConfigurationSwitch: false,
      extra: 'value',
    };
    let sut = null;
    let result = null;
    // When
    sut = new AppConfiguration(environmentUtils, rootRequire);
    sut.load(newConfigName, newConfigSettings);
    result = sut.setConfig(updatedSettings, newConfigName, false);
    // Then
    expect(result).toEqual(updatedSettings);
  });

  it('should return a setting of the active configuration by its name', () => {
    // Given
    const environmentUtils = 'environmentUtils';
    const rootRequire = 'rootRequire';
    const newSettingName = 'version';
    const newSettingValue = 2509;
    const newConfigName = 'charitoConfig';
    const newConfigSettings = {
      name: 'charito',
      [newSettingName]: newSettingValue,
    };
    let sut = null;
    let result = null;
    // When
    sut = new AppConfiguration(environmentUtils, rootRequire);
    sut.load(newConfigName, newConfigSettings);
    result = sut.get(newSettingName);
    // Then
    expect(result).toEqual(newSettingValue);
  });

  it('should return a setting of the active configuration by its path', () => {
    // Given
    const environmentUtils = 'environmentUtils';
    const rootRequire = 'rootRequire';
    const newSettingName = 'version';
    const newSubSettingName = 'type';
    const newSubSettingValue = 'alpha';
    const newConfigName = 'charitoConfig';
    const newConfigSettings = {
      name: 'charito',
      [newSettingName]: {
        [newSubSettingName]: newSubSettingValue,
      },
    };
    let sut = null;
    let result = null;
    // When
    sut = new AppConfiguration(environmentUtils, rootRequire);
    sut.load(newConfigName, newConfigSettings);
    result = sut.get(`${newSettingName}.${newSubSettingName}`);
    // Then
    expect(result).toEqual(newSubSettingValue);
  });

  it('should return the active configuration name when trying to get the `name` setting', () => {
    // Given
    const environmentUtils = 'environmentUtils';
    const rootRequire = 'rootRequire';
    const newConfigName = 'charitoConfig';
    const newConfigSettings = {
      name: 'charito',
    };
    let sut = null;
    let result = null;
    // When
    sut = new AppConfiguration(environmentUtils, rootRequire);
    sut.load(newConfigName, newConfigSettings);
    result = sut.get('name');
    // Then
    expect(result).toEqual(newConfigName);
  });

  it('should return a list of settings from the active configuration by their name', () => {
    // Given
    const environmentUtils = 'environmentUtils';
    const rootRequire = 'rootRequire';
    const newSettingOneName = 'version';
    const newSettingOneValue = 2509;
    const newSettingTwoName = 'date';
    const newSettingTwoValue = '25-09-2015';
    const newConfigName = 'charitoConfig';
    const newConfigSettings = {
      name: 'charito',
      [newSettingOneName]: newSettingOneValue,
      [newSettingTwoName]: newSettingTwoValue,
    };
    let sut = null;
    let result = null;
    const expectedSettings = {
      [newSettingOneName]: newSettingOneValue,
      [newSettingTwoName]: newSettingTwoValue,
    };
    // When
    sut = new AppConfiguration(environmentUtils, rootRequire);
    sut.load(newConfigName, newConfigSettings);
    result = sut.get([newSettingOneName, newSettingTwoName]);
    // Then
    expect(result).toEqual(expectedSettings);
  });

  it('should return the settings from the active configuration by their path', () => {
    // Given
    const environmentUtils = 'environmentUtils';
    const rootRequire = 'rootRequire';
    const newSettingOneName = 'version';
    const newSubSettingOneName = 'type';
    const newSubSettingOneValue = 'alpha';
    const newSettingTwoName = 'date';
    const newSubSettingTwoName = 'date';
    const newSubSettingTwoValue = '25';
    const newConfigName = 'charitoConfig';
    const newConfigSettings = {
      name: 'charito',
      [newSettingOneName]: {
        [newSubSettingOneName]: newSubSettingOneValue,
      },
      [newSettingTwoName]: {
        [newSubSettingTwoName]: newSubSettingTwoValue,
      },
    };
    const pathOne = `${newSettingOneName}.${newSubSettingOneName}`;
    const pathTwo = `${newSettingTwoName}.${newSubSettingTwoName}`;
    let sut = null;
    let result = null;
    // When
    sut = new AppConfiguration(environmentUtils, rootRequire);
    sut.load(newConfigName, newConfigSettings);
    result = sut.get([pathOne, pathTwo]);
    // Then
    expect(result).toEqual({
      [pathOne]: newSubSettingOneValue,
      [pathTwo]: newSubSettingTwoValue,
    });
  });

  it('should return a list of settings from the active configuration by their path', () => {
    // Given
    const environmentUtils = 'environmentUtils';
    const rootRequire = 'rootRequire';
    const newSettingOneName = 'version';
    const newSubSettingOneName = 'type';
    const newSubSettingOneValue = 'alpha';
    const newSettingTwoName = 'date';
    const newSubSettingTwoName = 'date';
    const newSubSettingTwoValue = '25';
    const newConfigName = 'charitoConfig';
    const newConfigSettings = {
      name: 'charito',
      [newSettingOneName]: {
        [newSubSettingOneName]: newSubSettingOneValue,
      },
      [newSettingTwoName]: {
        [newSubSettingTwoName]: newSubSettingTwoValue,
      },
    };
    const pathOne = `${newSettingOneName}.${newSubSettingOneName}`;
    const pathTwo = `${newSettingTwoName}.${newSubSettingTwoName}`;
    let sut = null;
    let result = null;
    // When
    sut = new AppConfiguration(environmentUtils, rootRequire);
    sut.load(newConfigName, newConfigSettings);
    result = sut.get([pathOne, pathTwo], true);
    // Then
    expect(result).toEqual([
      newSubSettingOneValue,
      newSubSettingTwoValue,
    ]);
  });

  it('should set the value of a setting from the active configuration', () => {
    // Given
    const environmentUtils = 'environmentUtils';
    const rootRequire = 'rootRequire';
    const newSettingName = 'version';
    const newSettingValue = 2509;
    const newSettingModifiedValue = '25-09-2015';
    const newConfigName = 'charitoConfig';
    const newConfigSettings = {
      name: 'charito',
      [newSettingName]: newSettingValue,
    };
    let sut = null;
    let resultAfterLoad = null;
    let resultAfterSet = null;
    // When
    sut = new AppConfiguration(environmentUtils, rootRequire);
    sut.load(newConfigName, newConfigSettings);
    resultAfterLoad = sut.get(newSettingName);
    sut.set(newSettingName, newSettingModifiedValue);
    resultAfterSet = sut.get(newSettingName);
    // Then
    expect(resultAfterLoad).toEqual(newSettingValue);
    expect(resultAfterSet).toEqual(newSettingModifiedValue);
  });

  it('should set the value of multiple settings from the active configuration', () => {
    // Given
    const environmentUtils = 'environmentUtils';
    const rootRequire = 'rootRequire';
    const newSettingOneName = 'version';
    const newSettingOneValue = 2509;
    const newSettingOneModifiedValue = '25-09-2015';
    const newSettingTwoName = 'engine';
    const newSettingTwoValue = 'webpack';
    const newSettingTwoModifiedValue = 'rollup';
    const newConfigName = 'charitoConfig';
    const newConfigSettings = {
      name: 'charito',
      [newSettingOneName]: newSettingOneValue,
      [newSettingTwoName]: newSettingTwoValue,
    };
    let sut = null;
    let resultAfterLoad = null;
    let resultAfterSet = null;
    const expectedSettingsAfterLoad = {
      [newSettingOneName]: newSettingOneValue,
      [newSettingTwoName]: newSettingTwoValue,
    };
    const expectedSettingsAfterSet = {
      [newSettingOneName]: newSettingOneModifiedValue,
      [newSettingTwoName]: newSettingTwoModifiedValue,
    };
    // When
    sut = new AppConfiguration(environmentUtils, rootRequire);
    sut.load(newConfigName, newConfigSettings);
    resultAfterLoad = sut.get([newSettingOneName, newSettingTwoName]);
    sut.set({
      [newSettingOneName]: newSettingOneModifiedValue,
      [newSettingTwoName]: newSettingTwoModifiedValue,
    });
    resultAfterSet = sut.get([newSettingOneName, newSettingTwoName]);
    // Then
    expect(resultAfterLoad).toEqual(expectedSettingsAfterLoad);
    expect(resultAfterSet).toEqual(expectedSettingsAfterSet);
  });

  it('should extend the value of a setting from the active configuration', () => {
    // Given
    const environmentUtils = 'environmentUtils';
    const rootRequire = 'rootRequire';
    const newSettingName = 'file';
    const newSettingValue = {
      type: 'photo',
      path: './file.png',
    };
    const newSettingExtendedValue = {
      mime: 'image/png',
    };
    const newConfigName = 'charitoConfig';
    const newConfigSettings = {
      name: 'charito',
      [newSettingName]: newSettingValue,
    };
    let sut = null;
    let resultAfterLoad = null;
    let resultAfterSet = null;
    const expectedSettingsAfterSet = { ...newSettingValue, ...newSettingExtendedValue };
    // When
    sut = new AppConfiguration(environmentUtils, rootRequire);
    sut.load(newConfigName, newConfigSettings);
    resultAfterLoad = sut.get(newSettingName);
    sut.set(newSettingName, newSettingExtendedValue);
    resultAfterSet = sut.get(newSettingName);
    // Then
    expect(resultAfterLoad).toEqual(newSettingValue);
    expect(resultAfterSet).toEqual(expectedSettingsAfterSet);
  });

  it('should throw an error when trying to change a setting without sending a value', () => {
    // Given
    const environmentUtils = 'environmentUtils';
    const rootRequire = 'rootRequire';
    const newSettingName = 'version';
    const newSettingValue = 2509;
    const newConfigName = 'charitoConfig';
    const newConfigSettings = {
      name: 'charito',
      [newSettingName]: newSettingValue,
    };
    let sut = null;
    // When
    sut = new AppConfiguration(environmentUtils, rootRequire);
    sut.load(newConfigName, newConfigSettings);
    // Then
    expect(() => sut.set(newSettingName)).toThrow(/You need to send a value/i);
  });

  it('should throw an error when trying to switch configurations without the flag enabled', () => {
    // Given
    const environmentUtils = 'environmentUtils';
    const rootRequire = 'rootRequire';
    const newConfigName = 'charitoConfig';
    const newConfigSettings = {
      name: 'charito',
    };
    let sut = null;
    // When
    sut = new AppConfiguration(environmentUtils, rootRequire);
    sut.load(newConfigName, newConfigSettings, false);
    // Then
    expect(() => sut.switch(newConfigName)).toThrow(/You can't switch the configuration/i);
  });

  it('should load a configuration from a file when trying to switch to it', () => {
    // Given
    const environmentUtils = 'environmentUtils';
    const newConfigOneName = 'charitoConfig';
    const newConfigOneSettings = {
      name: 'charito',
      allowConfigurationSwitch: true,
    };
    const newConfigTwoName = 'rosarioConfig';
    const newConfigTwoSettings = {
      name: 'Rosario',
      allowConfigurationSwitch: false,
    };
    const rootRequire = jest.fn(() => newConfigTwoSettings);
    let sut = null;
    let resultAfterLoad = null;
    let resultAfterSwitch = null;
    let canSwitchAfterLoad = null;
    let canSwitchAfterSwitch = null;
    // When
    sut = new AppConfiguration(environmentUtils, rootRequire);
    sut.load(newConfigOneName, newConfigOneSettings);
    resultAfterLoad = sut.getConfig();
    canSwitchAfterLoad = sut.canSwitch();
    sut.switch(newConfigTwoName);
    resultAfterSwitch = sut.getConfig();
    canSwitchAfterSwitch = sut.canSwitch();
    // Then
    expect(resultAfterLoad).toEqual(newConfigOneSettings);
    expect(canSwitchAfterLoad).toBeTrue();
    expect(resultAfterSwitch).toEqual(newConfigTwoSettings);
    expect(canSwitchAfterSwitch).toBeTrue();
  });

  it('should include a provider for the DIC', () => {
    // Given
    const container = {
      set: jest.fn(),
      get: jest.fn((service) => service),
    };
    let sut = null;
    let registerResult = null;
    let serviceProvider = null;
    let serviceName = null;
    let serviceFn = null;
    const expectedDefaults = getExpectedDefaults();
    // When
    registerResult = appConfiguration();
    [[serviceProvider]] = provider.mock.calls;
    serviceProvider(container);
    [[serviceName, serviceFn]] = container.set.mock.calls;
    sut = serviceFn();
    // Then
    expect(registerResult).toBe('provider');
    expect(serviceName).toBe('appConfiguration');
    expect(serviceFn).toBeFunction();
    expect(sut).toBeInstanceOf(AppConfiguration);
    expect(sut.environmentUtils).toBe('environmentUtils');
    expect(sut.rootRequire).toBe('rootRequire');
    expect(sut.options).toEqual(expectedDefaults.options);
    expect(sut.configurations).toEqual(expectedDefaults.configurations);
    expect(sut.activeConfiguration).toBe(expectedDefaults.activeConfiguration);
    expect(sut.allowConfigurationSwitch).toBe(expectedDefaults.allowConfigurationSwitch);
  });
});
