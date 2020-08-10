const colors = require('colors/safe');
const { providerCreator } = require('../shared/jimpleFns');
const { deepAssign } = require('../shared/deepAssign');
/**
 * @module node/logger
 */

/**
 * @typedef {import('../shared/jimpleFns').ProviderCreator<O>} ProviderCreator
 * @template O
 */

/**
 * @typedef {Object} PackageInfo
 * @property {string} [nameForCLI] A specific name to use on the logger; it overwrites `name`.
 * @property {string} name         The package name.
 */

/**
 * @typedef {Object} AppLoggerServiceMap
 * @property {string|PackageInfo} [packageInfo]
 * The name of the service that containers the information of the `package.json`. `packageInfo` by
 * default.
 * @parent module:node/logger
 */

/**
 * @typedef {Object} AppLoggerProviderOptions
 * @property {string} serviceName
 * The name that will be used to register an instance of {@link Logger} with the package name as
 * prefix. Its default value is `appLogger`.
 * @property {AppLoggerServiceMap} services
 * A dictionary with the services that need to be injected.
 * @property {boolean} [showTime]
 * Whether or not to show the time on each message.
 * @parent module:node/logger
 */

/**
 * @typedef {Object} LoggerProviderOptions
 * @property {string} serviceName
 * The name that will be used to register an instance of {@link Logger}. Its default value is
 * `logger`.
 * @property {string} [messagesPrefix]
 * A prefix to include in front of all the messages.
 * @property {boolean} [showTime]
 * Whether or not to show the time on each message.
 * @parent module:node/logger
 */

/**
 * This can be either a message to log, or an array where the first item is the message and the
 * second one is the color it should be used to log it.
 *
 * @example
 * logger.log('hello world');
 * // It will log 'hello world' with the default color.
 * logger.log(['hello world', 'red'])
 * // It will log 'hello world' in red.
 *
 * @typedef {string|string[]} LoggerLine
 * @parent module:node/logger
 */

/**
 * @typedef {string|LoggerLine[]} LoggerMessage
 * @parent module:node/logger
 */

/**
 * A utility service to log messages on the console.
 *
 * @parent module:node/logger
 * @tutorial logger
 */
class Logger {
  /**
   * @param {string}  [messagesPrefix=''] A prefix to include in front of all the messages.
   * @param {boolean} [showTime=false]    Whether or not to show the time on each message.
   */
  constructor(messagesPrefix = '', showTime = false) {
    /**
     * The prefix to include in front of all the messages.
     *
     * @type {string}
     * @access protected
     * @ignore
     */
    this._messagesPrefix = messagesPrefix;
    /**
     * Whether or not to show the time on each message.
     *
     * @type {boolean}
     * @access protected
     * @ignore
     */
    this._showTime = showTime;
    /**
     * An alias for the {@link Logger#warning} method.
     *
     * @type {Function}
     * @see {@link Logger#warning}
     */
    this.warn = this.warning.bind(this);
  }
  /**
   * Logs an error (red) message or messages on the console.
   *
   * @param {LoggerMessage|Error} message
   * A single message of a list of them. See the `log()` documentation to see all the supported
   * properties for the `message` parameter. Different from the other log methods, you can use an
   * `Error` object and the method will take care of extracting the message and the stack
   * information.
   * @param {Object} [exception=null]
   * If the exception has a `stack` property, the method will log each of the stack calls using
   * `info()`.
   */
  error(message, exception = null) {
    if (message instanceof Error) {
      this.error(message.message, message);
    } else {
      this.log(message, 'red');
      if (exception) {
        if (exception.stack) {
          const stack = exception.stack
          .split('\n')
          .map((line) => line.trim());

          stack.splice(0, 1);
          this.info(stack);
        } else {
          this.log(exception);
        }
      }
    }
  }
  /**
   * Logs an information (gray) message or messages on the console.
   *
   * @param {LoggerMessage} message A single message of a list of them.
   * @see {@link Logger#log}
   */
  info(message) {
    this.log(message, 'grey');
  }
  /**
   * Logs a message with an specific color on the console.
   *
   * @example
   * // Simple
   * CLILogger.log('hello world');
   * // Custom color
   * CLILogger.log('It was the shadow who did it', 'red');
   * // A list of messages all the same color
   * CLILogger.log(['Ph\'nglu', 'mglw\'nafh'], 'grey');
   * // A list of messages with different colors per line
   * CLILogger.log([
   *   'Ph\'nglu',
   *   'mglw\'nafh',
   *   ['Cthulhu', 'green'],
   *   ['R\'lyeh wgah\'nagl fhtagn', 'red']
   * ], 'grey');
   *
   * @param {LoggerMessage} message       A text message to log or a list of them.
   * @param {string}        [color='raw'] Optional. The color of the message (the default is
   *                                      the terminal default). This can be overwritten line by
   *                                      line when the message is an array, take a look at the
   *                                      example.
   */
  log(message, color = 'raw') {
    const lines = [];
    if (Array.isArray(message)) {
      message.forEach((line) => {
        if (Array.isArray(line)) {
          lines.push(this._color(line[1])(this.prefix(line[0])));
        } else {
          lines.push(this._color(color)(this.prefix(line)));
        }
      });
    } else {
      lines.push(this._color(color)(this.prefix(message)));
    }

    // eslint-disable-next-line no-console
    lines.forEach((line) => console.log(line));
  }
  /**
   * Prefixes a message with the text sent to the constructor and, if enabled, the current time.
   *
   * @param {string} text The text that needs the prefix.
   * @returns {string}
   */
  prefix(text) {
    // Define the list of things that will compose the formatted text.
    const parts = [];
    // If a prefix was set on the constructor...
    if (this.messagesPrefix) {
      // ...add it as first element.
      parts.push(`[${this.messagesPrefix}]`);
    }
    // If the `showTime` setting is enabled...
    if (this.showTime) {
      // ...add the current time to the list.
      const time = new Date()
      .toISOString()
      .replace(/T/, ' ')
      .replace(/\..+/, '');

      parts.push(`[${time}]`);
    }
    // Add the original text.
    parts.push(text);
    // Join the list into a single text message.
    return parts.join(' ').trim();
  }
  /**
   * Logs a success (green) message or messages on the console.
   *
   * @param {LoggerMessage} message A single message of a list of them.
   * @see {@link Logger#log}
   */
  success(message) {
    this.log(message, 'green');
  }
  /**
   * Logs a warning (yellow) message or messages on the console.
   *
   * @param {LoggerMessage} message A single message of a list of them.
   * @see {@link Logger#log}
   */
  warning(message) {
    this.log(message, 'yellow');
  }
  /**
   * The prefix to include in front of all the messages.
   *
   * @type {string}
   */
  get messagesPrefix() {
    return this._messagesPrefix;
  }
  /**
   * Whether or not to show the time on each message.
   *
   * @type {boolean}
   */
  get showTime() {
    return this._showTime;
  }
  /**
   * Gets a function to modify the color of a string. The reason for this _"proxy method"_ is that
   * the `colors` module doesn't have a `raw` option and the alternative would've been adding a few
   * `if`s on the `log` method.
   *
   * @param {string} name The name of the color.
   * @returns {Function} A function that receives a string and returns it colored.
   * @access protected
   * @ignore
   */
  _color(name) {
    return name === 'raw' ? ((str) => str) : colors[name];
  }
}
/**
 * The service provider to register an instance of {@link Logger} on the container.
 *
 * @type {ProviderCreator<LoggerProviderOptions>}
 * @tutorial logger
 */
const logger = providerCreator((options = {}) => (app) => {
  app.set(options.serviceName || 'logger', () => new Logger(
    options.messagesPrefix,
    options.showTime,
  ));
});
/**
 * The service provider to register an instance of {@link Logger} with the package name as
 * messages prefix on the container.
 *
 * @type {ProviderCreator<AppLoggerProviderOptions>}
 * @tutorial logger
 */
const appLogger = providerCreator((options = {}) => (app) => {
  app.set(options.serviceName || 'appLogger', () => {
    /**
     * @type {AppLoggerProviderOptions}
     * @ignore
     */
    const useOptions = deepAssign(
      {
        services: {
          packageInfo: 'packageInfo',
        },
      },
      options,
    );

    const { packageInfo } = useOptions.services;
    /**
     * @type {PackageInfo}
     * @ignore
     */
    const usePackageInfo = typeof packageInfo === 'string' ?
      app.get(packageInfo) :
      packageInfo;
    const prefix = usePackageInfo.nameForCLI || usePackageInfo.name;

    return new Logger(
      prefix,
      useOptions.showTime,
    );
  });
});

module.exports.Logger = Logger;
module.exports.logger = logger;
module.exports.appLogger = appLogger;
