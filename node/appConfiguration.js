const path = require('path');
const ObjectUtils = require('../shared/objectUtils');
const { deepAssign } = require('../shared/deepAssign');
const { providerCreator } = require('../shared/jimpleFns');
/**
 * @module node/appConfiguration
 */

/**
 * @typedef {import('./environmentUtils').EnvironmentUtils} EnvironmentUtils
 * @typedef {import('./rootRequire').RootRequireFn} RootRequireFn
 */

/**
 * @typedef {import('../shared/jimpleFns').ProviderCreator<O>} ProviderCreator
 * @template O
 */

/**
 * @typedef {Object} AppConfigurationOptions
 * @property {string} [defaultConfigurationName='default']
 * The name of the default configuration.
 * @property {string} [environmentVariable='APP_CONFIG']
 * The name of the variable it will read in order to determine which configuration to
 * load.
 * @property {string} [path='./config/[app-name]']
 * The path to the configurations directory, relative to the project root path.
 * @property {string} [filenameFormat='[app-name].[name].config.js']
 * The name format of the configuration files. You need to use the `[name]`
 * placeholder so the service can replace it with the name of the configuration.
 * @parent module:node/appConfiguration
 */

/**
 * @typedef {Object} AppConfigurationServiceMap
 * @property {string | EnvironmentUtils} [environmentUtils]
 * The name of the service for {@link EnvironmentUtils} or an instance of it.
 * `environmentUtils` by default.
 * @property {string | RootRequireFn} [rootRequire]
 * The name of the service for {@link RootRequireFn} or an instance of it. `rootRequire`
 * by default.
 * @parent module:node/appConfiguration
 */

/**
 * @typedef {Object} AppConfigurationProviderOptions
 * @property {string} serviceName
 * The name that will be used to register an instance of {@link AppConfiguration}. Its
 * default value is `appConfiguration`.
 * @property {string} appName
 * The name of the application.
 * @property {Object} defaultConfiguration
 * The service default configuration.
 * @property {Partial<AppConfigurationOptions>} options
 * Overwrites for the service customization options.
 * @property {AppConfigurationServiceMap} services
 * A dictionary with the services that need to be injected on the class.
 * @parent module:node/appConfiguration
 */

/**
 * This is a service to manage applications configurations. It takes care of loading,
 * activating,
 * switching and merging configuration files.
 *
 * @parent module:node/appConfiguration
 * @tutorial appConfiguration
 */
class AppConfiguration {
  /**
   * @param {EnvironmentUtils} environmentUtils
   * Required to read the environment variables and determine which configuration to use.
   * @param {RootRequireFn} rootRequire
   * Necessary to be able to require the configuration files with paths relative to the
   * app root directory.
   * @param {string} [appName='app']
   * The name of the app using this service. It's also used as part of the name of the
   * configuration files.
   * @param {Object} [defaultConfiguration={}]
   * The default configuration the others will extend.
   * @param {Partial<AppConfigurationOptions>} [options={}]
   * Options to customize the service.
   */
  constructor(
    environmentUtils,
    rootRequire,
    appName = 'app',
    defaultConfiguration = {},
    options = {},
  ) {
    /**
     * A local reference for the `environmentUtils` service.
     *
     * @type {EnvironmentUtils}
     * @access protected
     * @ignore
     */
    this._environmentUtils = environmentUtils;
    /**
     * The function that allows the service to `require` a configuration file with a path
     * relative to the app root directory.
     *
     * @type {RootRequireFn}
     * @access protected
     * @ignore
     */
    this._rootRequire = rootRequire;
    /**
     * The service customizable options.
     *
     * @type {AppConfigurationOptions}
     * @access protected
     * @ignore
     */
    this._options = ObjectUtils.merge(
      {
        defaultConfigurationName: 'default',
        environmentVariable: 'APP_CONFIG',
        path: `./config/${appName}`,
        filenameFormat: `${appName}.[name].config.js`,
      },
      options,
    );
    /**
     * A dictionary with all the loaded configurations. It uses the names of the
     * configurations as keys.
     *
     * @type {Object.<string, Object>}
     * @access protected
     * @ignore
     */
    this._configurations = {
      [this._options.defaultConfigurationName]: defaultConfiguration,
    };
    /**
     * The name of the active configuration.
     *
     * @type {string}
     * @access protected
     * @ignore
     */
    this._activeConfiguration = this._options.defaultConfigurationName;
    /**
     * Whether or not the configuration can be switched.
     *
     * @type {boolean}
     * @access protected
     * @ignore
     */
    this._allowConfigurationSwitch = !!this.get('allowConfigurationSwitch');
  }
  /**
   * Gets a setting or settings from the active configuration.
   *
   * @param {string | string[]} setting          A setting path or a list of them.
   * @param {boolean}           [asArray=false]  When `setting` is an Array, if this is
   *                                             `true`,
   *                                             instead of returning an object, it will
   *                                             return an array of settings.
   * @returns {*}
   * @example
   *
   *   // To get a single setting
   *   const value = appConfiguration.get('some-setting');
   *
   *   // To get multiple values
   *   const { settingOne, settingTwo } = appConfiguration.get([
   *     'settingOne',
   *     'settingTwo',
   *   ]);
   *
   *   // Use paths
   *   const subValue = appConfiguration.get('settingOne.subSetting');
   *
   */
  get(setting, asArray = false) {
    let result;
    if (Array.isArray(setting)) {
      result = asArray
        ? setting.map((name) => this.get(name))
        : setting.reduce((current, name) => ({ ...current, [name]: this.get(name) }), {});
    } else if (setting === 'name') {
      result = this._activeConfiguration;
    } else {
      result = ObjectUtils.get(this.getConfig(), setting);
    }

    return result;
  }
  /**
   * Gets a configuration settings. If no name is specified, it will return the settings
   * of the active configuration.
   *
   * @param {string} [name='']  The name of the configuration.
   * @returns {?Object}
   */
  getConfig(name = '') {
    const existing = this._configurations[name || this._activeConfiguration];
    return existing ? ObjectUtils.copy(existing) : null;
  }
  /**
   * Load a new configuration.
   *
   * @param {string}  name             The configuration name.
   * @param {Object}  settings         The configuration settings.
   * @param {boolean} [switchTo=true]  If the service should switch to the new
   *                                   configuration after adding it.
   * @returns {Object} The settings of the new configuration.
   * @throws {Error} If the configuration tries to extend a configuration that doesn't
   *                 exist.
   */
  load(name, settings, switchTo = true) {
    // Get the name of the configuration it will extend.
    const extendsFrom = settings.extends || this._options.defaultConfigurationName;
    // Get the settings of the configuration to extend.
    const baseConfiguration = this.getConfig(extendsFrom);
    // If the base configuration exists...
    if (baseConfiguration) {
      // ...add the new configuration with the merged settings.
      this._addConfiguration(
        name,
        ObjectUtils.merge(baseConfiguration, settings),
        true,
        switchTo,
      );
    } else {
      // ...otherwise, fail with an error.
      throw new Error(`The base configuration for ${name} doesn't exist: ${extendsFrom}`);
    }
    // Return the loaded configuration.
    return this.getConfig(name);
  }
  /**
   * Checks if there's a configuration name on the environment variable and if there is,
   * try to load the configuration file for it.
   *
   * @returns {Object} The loaded configuration or an empty object if the variable was
   *                   empty.
   */
  loadFromEnvironment() {
    const name = this._environmentUtils.get(this._options.environmentVariable);
    let result = {};
    if (name) {
      result = this.loadFromFile(name);
    }

    return result;
  }
  /**
   * Loads a configuration from a file.
   *
   * @param {string}  name                    The name of the configuration.
   * @param {boolean} [switchTo=true]         If the service should switch to the new
   *                                          configuration after adding it.
   * @param {boolean} [checkSwitchFlag=true]  If `true`, the service will update the value
   *                                          of `allowConfigurationSwitch` based on the
   *                                          loaded configuration setting.
   * @returns {Object} The settings of the loaded configuration.
   * @throws {Error} If the configuration file can't be loaded.
   */
  loadFromFile(name, switchTo = true, checkSwitchFlag = true) {
    // Format the name of the configuration file.
    const filename = this._options.filenameFormat.replace(/\[name\]/g, name);
    // Build the path to the configuration file.
    const filepath = path.join(this._options.path, filename);

    let settings = {};
    // Try to require it.
    try {
      settings = this._rootRequire(filepath);
    } catch (error) {
      throw new Error(`The configuration file couldn't be loaded: ${filepath}`);
    }

    // Get the name of the configuration it will extend.
    const extendsFrom = settings.extends || this._options.defaultConfigurationName;
    // Get the base configuration from either the service or by loading it.
    const baseConfiguration =
      this.getConfig(extendsFrom) || this.loadFromFile(extendsFrom, false);
    // Add the new configuration with the merged settings.
    this._addConfiguration(
      name,
      ObjectUtils.merge(baseConfiguration, settings),
      checkSwitchFlag,
      switchTo,
    );
    // Return the loaded configuration.
    return this.getConfig(name);
  }
  /**
   * Sets the value of a setting or settings from the active configuration.
   * If both the current and the new value of a setting are objects, then instead of
   * overwriting it, the method will merge them.
   *
   * @param {string | Object.<string, any>} setting  The name of the setting to update or
   *                                                 a dictionary of settings and their
   *                                                 values.
   * @param {*}                             [value]  The value of the setting. This is
   *                                                 only used when `setting` is a string.
   * @throws {Error} If `setting` is not a dictionary and `value` is undefined.
   * @example
   *
   *   // To set a single setting value
   *   appConfiguration.set('some-setting', 'some-setting-value');
   *   // To set the value of multiple settings
   *   appConfiguration.set({
   *     settingOne: 'valueOne',
   *     settingTwo: 'valueTwo',
   *   });
   *
   */
  set(setting, value) {
    if (typeof setting === 'object') {
      Object.keys(setting).forEach((name) => {
        this.set(name, setting[name]);
      });
    } else if (typeof value !== 'undefined') {
      const currentValue = this.get(setting);
      let newValue = value;
      if (typeof value === 'object' && typeof currentValue !== 'undefined') {
        newValue = ObjectUtils.merge(currentValue, value);
      }

      this.setConfig(ObjectUtils.set({}, setting, newValue));
    } else {
      throw new Error('You need to send a value in order to update a setting');
    }
  }
  /**
   * Overwrites all the settings for a configuration. If the name is not specified, it
   * will overwrite the active configuration.
   *
   * @param {Object}  config        The new configuration settings.
   * @param {string}  [name='']     The name of the configuration.
   * @param {boolean} [merge=true]  Whether or not to merge the new settings with the
   *                                existing ones.
   * @returns {Object} The updated configuration.
   */
  setConfig(config, name = '', merge = true) {
    const key = name || this._activeConfiguration;
    this._configurations[key] = merge
      ? ObjectUtils.merge(this._configurations[key], config)
      : config;
    return this._configurations[key];
  }
  /**
   * Switchs to a different configuration. If the configuration is not registered, it will
   * try to load from a file.
   *
   * @param {string}  name           The new of the configuration to switch to.
   * @param {boolean} [force=false]  A way to force the service to switch even if the
   *                                 `allowConfigurationSwitch` property if `false`.
   * @returns {Object} The new active configuration.
   * @throws {Error} If `force` is `false` and the `allowConfigurationSwitch` property
   *                 is `false`.
   */
  switch(name, force = false) {
    if (!this._allowConfigurationSwitch && !force) {
      throw new Error(
        `You can't switch the configuration to '${name}', the feature is disabled`,
      );
    } else if (!this._configurations[name]) {
      this.loadFromFile(name, true, false);
    } else {
      this._activeConfiguration = name;
    }

    return this.getConfig();
  }
  /**
   * The name of the active configuration.
   *
   * @type {string}
   */
  get activeConfiguration() {
    return this._activeConfiguration;
  }
  /**
   * Whether or not the active configuration can be switched.
   *
   * @type {boolean}
   */
  get canSwitch() {
    return this._allowConfigurationSwitch;
  }
  /**
   * A dictionary with all the loaded configurations. It uses the names of the
   * configurations as keys.
   *
   * @type {Object.<string, Object>}
   */
  get configurations() {
    return ObjectUtils.copy(this._configurations);
  }
  /**
   * The service customizable options.
   *
   * @type {AppConfigurationOptions}
   */
  get options() {
    return { ...this._options };
  }
  /**
   * Add a new configuration to the service.
   *
   * @param {string}  name             The name of the new configuration.
   * @param {Object}  settings         The configuration settings.
   * @param {boolean} checkSwitchFlag  Whether or not the `allowConfigurationSwitch`
   *                                   should be updated with the value of this new
   *                                   configuration setting.
   * @param {boolean} switchTo         Whether or not to switch it to the active
   *                                   configuration after adding it.
   * @access protected
   * @ignore
   */
  _addConfiguration(name, settings, checkSwitchFlag, switchTo) {
    const newSettings = ObjectUtils.copy(settings);
    delete newSettings.extends;

    if (checkSwitchFlag && typeof newSettings.allowConfigurationSwitch === 'boolean') {
      this._allowConfigurationSwitch = newSettings.allowConfigurationSwitch;
    }

    this._configurations[name] = newSettings;
    if (switchTo) {
      this.switch(name, true);
    }
  }
}
/**
 * The service provider to register an instance of {@link AppConfiguration} on the
 * container.
 *
 * @type {ProviderCreator<AppConfigurationProviderOptions>}
 * @tutorial appConfiguration
 */
const appConfiguration = providerCreator((options = {}) => (app) => {
  app.set(options.serviceName || 'appConfiguration', () => {
    /**
     * @type {AppConfigurationProviderOptions}
     * @ignore
     */
    const useOptions = deepAssign(
      {
        services: {
          environmentUtils: 'environmentUtils',
          rootRequire: 'rootRequire',
        },
      },
      options,
    );

    const services = Object.keys(useOptions.services).reduce((acc, key) => {
      const value = useOptions.services[key];
      const service = typeof value === 'string' ? app.get(value) : value;
      return {
        ...acc,
        [key]: service,
      };
    }, {});

    return new AppConfiguration(
      services.environmentUtils,
      services.rootRequire,
      useOptions.appName,
      useOptions.defaultConfiguration,
      useOptions.options,
    );
  });
});

module.exports.AppConfiguration = AppConfiguration;
module.exports.appConfiguration = appConfiguration;
