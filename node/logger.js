const colors = require('colors/safe');
const { provider } = require('jimple');
/**
 * A utility service to log messages on the console.
 */
class Logger {
  /**
   * Class constructor.
   * @param {string}  [messagesPrefix=''] A prefix to include in front of all the messages.
   * @param {boolean} [showTime=false]    Whether or not to show the time on each message.
   */
  constructor(messagesPrefix = '', showTime = false) {
    /**
     * The prefix to include in front of all the messages.
     * @type {string}
     */
    this.messagesPrefix = messagesPrefix;
    /**
     * Whether or not to show the time on each message.
     * @type {boolean}
     */
    this.showTime = showTime;
  }
  /**
   * Logs a warning (yellow) message or messages on the console.
   * @param {string|Array} message A single message of a list of them. See the `log()` documentation
   *                               to see all the supported properties for the `message` parameter.
   */
  warning(message) {
    this.log(message, 'yellow');
  }
  /**
   * Logs a success (green) message or messages on the console.
   * @param {string|Array} message A single message of a list of them. See the `log()` documentation
   *                               to see all the supported properties for the `message` parameter.
   */
  success(message) {
    this.log(message, 'green');
  }
  /**
   * Logs an error (red) message or messages on the console.
   * @param {string|Array|Error} message          A single message of a list of them. See the
   *                                              `log()` documentation to see all the supported
   *                                              properties for the `message` parameter. Different
   *                                              from the other log methods, you can use an
   *                                              `Error` object and the method will take care of
   *                                              extracting the message and the stack information.
   * @param {Object}             [exception=null] If the exception has a `stack` property, the
   *                                              method will log each of the stack calls using
   *                                              `info()`.
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
   * @param {string|Array} message A single message of a list of them. See the `log()` documentation
   *                               to see all the supported properties for the `message` parameter.
   */
  info(message) {
    this.log(message, 'grey');
  }
  /**
   * Logs a message with an specific color on the console.
   * @example
   * // Simple
   * CLILogger.log('hello world');
   * // Custom color
   * CLILogger.log('It was the shadow who did it', 'red');
   * // A list of messages all the same color
   * CLILogger.log(['Ph\'nglu', 'mglw\'nafh'], 'grey');
   * // A list of messages with different colors per line
   * CLILogger.log([
   *     'Ph\'nglu',
   *     'mglw\'nafh',
   *     ['Cthulhu', 'green'],
   *     ['R\'lyeh wgah\'nagl fhtagn', 'red']
   * ], 'grey');
   *
   * @param {string|Array} message A text message to log or a list of them.
   * @param {string}       color   Optional. The color of the message (the default is 'white').
   *                               This can be overwritten line by line when the message is an
   *                               array, take a look at the example.
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
   * @param {string} text The text that needs the prefix.
   * @return {string}
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
   * Gets a function to modify the color of a string. The reason for this _"proxy method"_ is that
   * the `colors` module doesn't have a `raw` option and the alternative would've been adding a few
   * `if`s on the `log` method.
   * @param {string} name The name of the color.
   * @return {Function} A function that receives a string and returns it colored.
   * @ignore
   * @access protected
   */
  _color(name) {
    return name === 'raw' ? ((str) => str) : colors[name];
  }
}
/**
 * Generates a `Provider` with an already defined message prefix and time setting.
 * @example
 * // Generate the provider
 * const provider = loggerWithOptions('my-prefix', true);
 * // Register it on the container
 * container.register(provider);
 * // Getting access to the service instance
 * const logger = container.get('logger');
 * @param {string}  [messagesPrefix] A prefix to include in front of all the messages.
 * @param {boolean} [showTime]       Whether or not to show the time on each message.
 * @return {Provider}
 */
const loggerWithOptions = (messagesPrefix, showTime) => provider((app) => {
  app.set('logger', () => new Logger(messagesPrefix, showTime));
});
/**
 * The service provider that once registered on the app container will set an instance of
 * `Logger` as the `logger` service.
 * @example
 * // Register it on the container
 * container.register(logger);
 * // Getting access to the service instance
 * const logger = container.get('logger');
 * @type {Provider}
 */
const logger = loggerWithOptions();
/**
 * Generates a `Provider` with an already defined time setting and that uses the `packageInfo`
 * service in order to retrieve the name of the project and use it as messages prefix.
 * @param {boolean} [showTime] Whether or not to show the time on each message.
 * @return {Provider}
 */
const appLoggerWithOptions = (showTime) => provider((app) => {
  app.set('appLogger', () => {
    const packageInfo = app.get('packageInfo');
    const prefix = packageInfo.nameForCLI || packageInfo.name;
    return new Logger(prefix, showTime);
  });
});
/**
 * The service provider that once registered on the app container will set an instance of
 * `Logger` as the `appLogger` service. The difference with the regular `logger` is that this one
 * uses the `packageInfo` service in order to retrieve the name of the project and use it as
 * messages prefix.
 * @example
 * // Register it on the container
 * container.register(appLogger);
 * // Getting access to the service instance
 * const appLogger = container.get('appLogger');
 * @type {Provider}
 */
const appLogger = appLoggerWithOptions();

module.exports = {
  Logger,
  loggerWithOptions,
  logger,
  appLoggerWithOptions,
  appLogger,
};
