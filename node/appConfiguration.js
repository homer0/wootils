const path = require('path');
const extend = require('extend');
const { provider } = require('jimple');

const defaultConfigurationName = 'default';

class AppConfiguration {
  constructor(
    environmentUtils,
    rootRequire,
    appName = 'app',
    defaultConfiguration = {},
    options = {}
  ) {
    this.environmentUtils = environmentUtils;
    this.rootRequire = rootRequire;
    this.options = extend(true, {
      environmentVariable: 'APP_CONFIG',
      path: `./config/${appName}`,
      filenameFormat: `${appName}.[name].config.js`,
    }, options);

    this.configurations = {
      [defaultConfigurationName]: defaultConfiguration,
    };

    this.activeConfiguration = defaultConfigurationName;
    this.allowConfigurationSwitch = !!this.get('allowConfigurationSwitch');
  }

  load(name, settings, switchTo = true) {
    const extendsFrom = settings.extends || defaultConfigurationName;
    const baseConfiguration = this.getConfig(extendsFrom);
    if (baseConfiguration) {
      this._addConfiguration(
        name,
        extend(true, {}, baseConfiguration, settings),
        true,
        switchTo
      );
    } else {
      throw new Error(`The base configuration for ${name} doesn't exist: ${extendsFrom}`);
    }

    return this.getConfig(name);
  }

  loadFromFile(name, switchTo = true, checkSwitchFlag = true) {
    const filename = this.options.filenameFormat.replace(/\[name\]/g, name);
    const filepath = path.join(this.options.path, filename);

    let settings = {};
    try {
      settings = this.rootRequire(filepath);
    } catch (error) {
      throw new Error(`The configuration file couldn't be loaded: ${filepath}`);
    }

    const extendsFrom = settings.extends || defaultConfigurationName;
    const baseConfiguration = this.getConfig(extendsFrom) || this.loadFromFile(extendsFrom, false);
    this._addConfiguration(
      name,
      extend(true, {}, baseConfiguration, settings),
      checkSwitchFlag,
      switchTo
    );

    return this.getConfig(name);
  }

  loadFromEnvironment() {
    const name = this.environmentUtils.get(this.options.environmentVariable);
    let result = {};
    if (name) {
      result = this.loadFromFile(name);
    }

    return result;
  }

  getConfig(name = '') {
    return this.configurations[(name || this.activeConfiguration)];
  }

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

  canSwitch() {
    return this.allowConfigurationSwitch;
  }

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
