const colors = require('colors/safe');
const { provider } = require('jimple');

class Logger {
  constructor(messagesPrefix = '', showTime = false) {
    this.messagesPrefix = messagesPrefix;
    this.showTime = showTime;
  }
  /**
   * Logs a warning (yellow) message on the console.
   * @param {String} message.
   */
  warning(message) {
    this.log(message, 'yellow');
  }
  /**
   * Logs a success (green) message on the console.
   * @param {String} message.
   */
  success(message) {
    this.log(message, 'green');
  }
  /**
   * Logs an error message (red) on the console.
   * @param {String} message.
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
   * Logs an information message (grey) on the console.
   * @param {String} message.
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
   * @param {String|Array} message A text message to log or a list of them.
   * @param {String}       color   Optional. The color of the message (the default is 'white').
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

  prefix(text) {
    const parts = [];
    if (this.messagesPrefix) {
      parts.push(`[${this.messagesPrefix}]`);
    }

    if (this.showTime) {
      const time = new Date()
      .toISOString()
      .replace(/T/, ' ')
      .replace(/\..+/, '');

      parts.push(`[${time}]`);
    }

    parts.push(text);
    return parts.join(' ').trim();
  }
  /**
   * Get a function to modify the color of a string. The reason for this _"proxy method"_ is that
   * the `colors` module doesn't have a `raw` option and the alternative would've been adding a few
   * `if`s on the `log` method.
   *
   * @param {String} name The name of the color.
   * @return {Function} A function that receives a string and returns it colored.
   */
  _color(name) {
    return name === 'raw' ? ((str) => str) : colors[name];
  }
}

const loggerWithOptions = (messagesPrefix, showTime) => provider((app) => {
  app.set('logger', () => new Logger(messagesPrefix, showTime));
});

const logger = loggerWithOptions();

const appLoggerWithOptions = (showTime) => provider((app) => {
  app.set('appLogger', () => {
    const packageInfo = app.get('packageInfo');
    const prefix = packageInfo.nameForCLI || packageInfo.name;
    return new Logger(prefix, showTime);
  });
});

const appLogger = appLoggerWithOptions();

module.exports = {
  Logger,
  loggerWithOptions,
  logger,
  appLoggerWithOptions,
  appLogger,
};
