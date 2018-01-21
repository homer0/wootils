const path = require('path');
const extend = require('extend');
const { provider } = require('jimple');
/**
 * This is a service to manage applications configurations. It takes care of loading, activing,
 * switching and merging configuration files.
 * These are the supported options you can send on the `options` parameter:
 * - `defaultConfigurationName`: The name of the default configuration. The default value is
 * `default`.
 * - `environmentVariable`: The name of the variable it will read in order to determine which
 * configuration to load. The default value is `APP_CONFIG`.
 * - `path`: The path to the configurations directory. The default value is `./config/[app-name]`.
 * - `filenameFormat`:  The name format of the configuration files. The default value is
 * `[app-name].[name].config.js`. You need to use the `[name]` placeholder so the service can
 * replace it with the name of the configuration.
 */
class AppConfiguration {
  /**
   * Class constructor.
   * @param {EnvironmentUtils} environmentUtils          Required to read the environment variables
   *                                                     and determine which configuration to use.
   * @param {Function}         rootRequire               Necessary to be able to require the
   *                                                     configuration files with paths relative
   *                                                     to the app root directory.
   * @param {String}           [appName='app']           The name of the app using this service.
   *                                                     It's also used as part of the name of the
   *                                                     configuration files.
   * @param {Object}           [defaultConfiguration={}] The default configuration the others
   *                                                     will extend.
   * @param {Object}           [options={}]              Options to customize the service
   */
  constructor(
    environmentUtils,
    rootRequire,
    appName = 'app',
    defaultConfiguration = {},
    options = {}
  ) {
    /**
     * A local reference for the `environmentUtils` service.
     * @type {EnvironmentUtils}
     */
    this.environmentUtils = environmentUtils;
    /**
     * The function that allows the service to `require` a configuration file with a path relative
     * to the app root directory.
     * @type {Function}
     */
    this.rootRequire = rootRequire;
    /**
     * The service customizable options.
     * @type {Object}
     * @property {String} defaultConfigurationName The name of the default configuration.
     * @property {String} environmentVariable      The name of the variable it will read in order
     *                                             to determine which configuration to load.
     * @property {String} path                     The path to the configurations directory.
     * @property {String} filenameFormat           The name format of the configuration files.
     */
    this.options = extend(true, {
      defaultConfigurationName: 'default',
      environmentVariable: 'APP_CONFIG',
      path: `./config/${appName}`,
      filenameFormat: `${appName}.[name].config.js`,
    }, options);
    /**
     * A dictionary with all the loaded configurations. It uses the names of the configurations
     * as keys.
     * @type {Object}
     */
    this.configurations = {
      [this.options.defaultConfigurationName]: defaultConfiguration,
    };
    /**
     * The name of the active configuration.
     * @type {String}
     */
    this.activeConfiguration = this.options.defaultConfigurationName;
    /**
     * Whether or not the configuration can be switched.
     * @type {Boolean}
     */
    this.allowConfigurationSwitch = !!this.get('allowConfigurationSwitch');
  }
  /**
   * Load a new configuration.
   * @param {String}  name            The configuration name.
   * @param {Object}  settings        The configuration settings.
   * @param {Boolean} [switchTo=true] If the service should switch to the new configuration after
   *                                  adding it.
   * @return {Object} The settings of the new configuration.
   * @throws {Error} If the configuration tries to extend a configuration that doesn't exist.
   */
  load(name, settings, switchTo = true) {
    // Get the name of the configuration it will extend.
    const extendsFrom = settings.extends || this.options.defaultConfigurationName;
    // Get the settings of the configuration to extend.
    const baseConfiguration = this.getConfig(extendsFrom);
    // If the base configuration exists...
    if (baseConfiguration) {
      // ...add the new configuration with the merged settings.
      this._addConfiguration(
        name,
        extend(true, {}, baseConfiguration, settings),
        true,
        switchTo
      );
    } else {
      // ...otherwise, fail with an error.
      throw new Error(`The base configuration for ${name} doesn't exist: ${extendsFrom}`);
    }
    // Return the loaded configuration.
    return this.getConfig(name);
  }
  /**
   * Load a configuration from a file.
   * @param {String}  name                   The name of the configuration.
   * @param {Boolean} [switchTo=true]        If the service should switch to the new configuration
   *                                         after adding it.
   * @param {Boolean} [checkSwitchFlag=true] If `true`, the service will update the value of
   *                                         `allowConfigurationSwitch` based on the loaded
   *                                         configuration setting.
   * @return {Object} The settings of the loaded configuration.
   * @throws {Error} If the configuration file can't be loaded.
   */
  loadFromFile(name, switchTo = true, checkSwitchFlag = true) {
    // Format the name of the configuration file.
    const filename = this.options.filenameFormat.replace(/\[name\]/g, name);
    // Build the path to the configuration file.
    const filepath = path.join(this.options.path, filename);

    let settings = {};
    // Try to require it.
    try {
      settings = this.rootRequire(filepath);
    } catch (error) {
      throw new Error(`The configuration file couldn't be loaded: ${filepath}`);
    }

    // Get the name of the configuration it will extend.
    const extendsFrom = settings.extends || this.options.defaultConfigurationName;
    // Get the base configuration from either the service or by loading it.
    const baseConfiguration = this.getConfig(extendsFrom) || this.loadFromFile(extendsFrom, false);
    // Add the new configuration with the merged settings.
    this._addConfiguration(
      name,
      extend(true, {}, baseConfiguration, settings),
      checkSwitchFlag,
      switchTo
    );
    // Return the loaded configuration.
    return this.getConfig(name);
  }
  /**
   * Check if there's a configuration name on the environment variable and if there is, try to load
   * the configuration file for it.
   * @return {Object} The loaded configuration or an empty object if the variable was empty.
   */
  loadFromEnvironment() {
    const name = this.environmentUtils.get(this.options.environmentVariable);
    let result = {};
    if (name) {
      result = this.loadFromFile(name);
    }

    return result;
  }
  /**
   * Get a configuration settings. If no name is specified, it will return the settings of the
   * default configuration.
   * @param {String} [name=''] The name of the configuration.
   * @return {Object}
   */
  getConfig(name = '') {
    return this.configurations[(name || this.activeConfiguration)];
  }
  /**
   * Get a setting or settings from the active configuration.
   * @example
   * // To get a single setting
   * const value = appConfiguration.get('some-setting');
   * // To get multiple values
   * const {settingOne, settingTwo} = appConfiguration.get(['settingOne', 'settingTwo']);
   * @param {String|Array} setting The name of a setting or a list of them.
   * @return {*}
   */
  get(setting) {
    let result;
    if (Array.isArray(setting)) {
      result = {};
      setting.forEach((name) => {
        result[name] = this.get(name);
      });
    } else if (setting === 'name') {
      result = this.activeConfiguration;
    } else {
      result = this.getConfig()[setting];
    }

    return result;
  }
  /**
   * Set the value of a setting or settings from the active configuration.
   * If both the current and the new value of a setting are objects, then instead of overwriting
   * it, the method will merge them.
   * @example
   * // To set a single setting value
   * appConfiguration.set('some-setting', 'some-setting-value');
   * // To set the value of multiple settings
   * appConfiguration.set({
   *   settingOne: 'valueOne',
   *   settingTwo: 'valueTwo',
   * })
   * @param {String|Object} setting The name of the setting to update or a dictionary of settings
   *                                and their values.
   * @param {*}             value   The value of the setting. This is only used when `setting` is
   *                                a string.
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
        newValue = extend(true, {}, currentValue, value);
      }

      this.getConfig()[setting] = newValue;
    } else {
      throw new Error('You need to send a value in order to update a setting');
    }
  }
  /**
   * Check whether the service can switch configurations or not.
   * @return {Boolean}
   */
  canSwitch() {
    return this.allowConfigurationSwitch;
  }
  /**
   * Switch to a different configuration. If the configuration is not registered, it will try to
   * load from a file.
   * @param {String}  name          The new of the configuration to switch to.
   * @param {Boolean} [force=false] A way to force the service to switch even if the
   *                                `allowConfigurationSwitch` property if `false`.
   * @return {Object} The new active configuration.
   * @throws {Error} If `force` is `false` and the `allowConfigurationSwitch` property is `false`.
   */
  switch(name, force = false) {
    if (!this.canSwitch() && !force) {
      throw new Error(`You can't switch the configuration to '${name}', the feature is disabled`);
    } else if (!this.configurations[name]) {
      this.loadFromFile(name, true, false);
    } else {
      this.activeConfiguration = name;
    }

    return this.getConfig();
  }
  /**
   * Add a new configuration to the service.
   * @param {String}  name            The name of the new configuration.
   * @param {Object}  settings        The configuration settings.
   * @param {Boolean} checkSwitchFlag Whether or not the `allowConfigurationSwitch` should be
   *                                  updated with the value of this new configuration setting.
   * @param {Boolean} switchTo        Whether or not to switch it to the active configuration
   *                                  after adding it.
   * @ignore
   * @access protected
   */
  _addConfiguration(name, settings, checkSwitchFlag, switchTo) {
    const newSettings = extend(true, {}, settings);
    delete newSettings.extends;

    if (checkSwitchFlag && typeof newSettings.allowConfigurationSwitch === 'boolean') {
      this.allowConfigurationSwitch = newSettings.allowConfigurationSwitch;
    }

    this.configurations[name] = newSettings;
    if (switchTo) {
      this.switch(name, true);
    }
  }
}
/**
 * Generates a `Provider` with an already defined name, default configuration and options.
 * @example
 * // Generate the provider
 * const provider = appConfiguration('my-app', {
 *   birthday: '25-09-2015',
 * });
 * // Register it on the container
 * container.register(provider);
 * // Getting access to the service instance
 * const appConfiguration = container.get('appConfiguration');
 * @param {String} appName              The name of the app.
 * @param {Object} defaultConfiguration The service default configuration.
 * @param {Object} options              Options to customize the service.
 * @return {Provider}
 */
const appConfiguration = (
  appName,
  defaultConfiguration,
  options
) => provider((app) => {
  app.set('appConfiguration', () => new AppConfiguration(
    app.get('environmentUtils'),
    app.get('rootRequire'),
    appName,
    defaultConfiguration,
    options
  ));
});

module.exports = {
  AppConfiguration,
  appConfiguration,
};
