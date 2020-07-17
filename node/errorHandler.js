const { providerCreator } = require('../shared/jimpleFns');
const { deepAssignWithShallowMerge } = require('../shared/deepAssign');
/**
 * @module node/errorHandler
 */

/**
 * @typedef {import('./logger').Logger} Logger
 */

/**
 * @typedef {import('../shared/jimpleFns').ProviderCreatorWithOptions<O>}
 * ProviderCreatorWithOptions
 * @template O
 */

/**
 * @typedef {Object} ErrorHandlerServiceMap
 * @property {string[]|string|Logger} [logger]
 * A list of loggers' service names from which the service will try to find the first available,
 * a specific service name, or an instance of {@link Logger}.
 * @parent module:node/errorHandler
 */

/**
 * @typedef {Object} ErrorHandlerProviderOptions
 * @property {string} serviceName
 * The name that will be used to register an instance of {@link ErrorHandler}. Its default value
 * is `errorHandler`.
 * @property {boolean} exitOnError
 * Whether or not to exit the process after receiving an error.
 * @property {ErrorHandlerServiceMap} services
 * A dictionary with the services that need to be injected on the class.
 * @parent module:node/errorHandler
 */

/**
 * An error handler that captures uncaught exceptions and unhandled rejections in order to log
 * them with detail.
 *
 * @parent module:node/errorHandler
 * @tutorial errorHandler
 */
class ErrorHandler {
  /**
   * @param {Logger}  appLogger          To log the detail of the erros.
   * @param {boolean} [exitOnError=true] Whether or not to exit the process after receiving an
   *                                     error.
   */
  constructor(appLogger, exitOnError = true) {
    /**
     * A local reference for the `appLogger` service.
     *
     * @type {Logger}
     */
    this.appLogger = appLogger;
    /**
     * Whether or not to exit the process after receiving an error.
     *
     * @type {boolean}
     */
    this.exitOnError = exitOnError;
    /**
     * The list of events this handler will listen for in order to catch errors.
     *
     * @type {string[]}
     */
    this.eventsNames = [
      'uncaughtException',
      'unhandledRejection',
    ];
    /**
     * Bind the handler method so it can be used on the calls to `process`.
     *
     * @ignore
     */
    this.handler = this.handle.bind(this);
  }
  /**
   * This is called by the process listeners when an uncaught exception is thrown or a rejected
   * promise is not handled. It logs the error on detail.
   * The process exits when after logging an error.
   *
   * @param {Error} error The unhandled error.
   */
  handle(error) {
    // If the logger is configured to show the time...
    if (this.appLogger.showTime) {
      // ...just send the error.
      this.appLogger.error(error);
    } else {
      // ...otherwise, get the time on a readable format.
      const time = new Date()
      .toISOString()
      .replace(/T/, ' ')
      .replace(/\..+/, '');
      // Build the error message with the time.
      const message = `[${time}] ${error.message}`;
      // Log the new message with the exception.
      this.appLogger.error(message, error);
    }

    // Check if it should exit the process.
    if (this.exitOnError) {
      // eslint-disable-next-line no-process-exit
      process.exit(1);
    }
  }
  /**
   * Starts listening for unhandled errors.
   */
  listen() {
    this.eventsNames.forEach((eventName) => {
      process.on(eventName, this.handler);
    });
  }
  /**
   * Stops listening for unhandled errors.
   */
  stopListening() {
    this.eventsNames.forEach((eventName) => {
      process.removeListener(eventName, this.handler);
    });
  }
}
/**
 * The service provider to register an instance of {@link ErrorHandler} on the container.
 *
 * @throws {Error} If `services.logger` specifies a service that doesn't exist or if it's a falsy
 *                 value.
 * @type {ProviderCreatorWithOptions<ErrorHandlerProviderOptions>}
 * @tutorial errorHandler
 */
const errorHandler = providerCreator((options = {}) => (app) => {
  app.set(options.serviceName || 'errorHandler', () => {
    /**
     * @type {ErrorHandlerProviderOptions}
     * @ignore
     */
    const useOptions = deepAssignWithShallowMerge(
      {
        services: {
          logger: ['logger', 'appLogger'],
        },
      },
      options,
    );

    const { logger } = useOptions.services;
    /**
     * @type {?Logger}
     * @ignore
     */
    let useLogger;
    if (Array.isArray(logger)) {
      useLogger = logger.reduce(
        (acc, name) => {
          let nextAcc;
          if (acc) {
            nextAcc = acc;
          } else {
            try {
              nextAcc = app.get(name);
            } catch (ignore) {
              nextAcc = null;
            }
          }

          return nextAcc;
        },
        null,
      );
    } else if (typeof logger === 'string') {
      useLogger = app.get(logger);
    } else {
      useLogger = logger;
    }

    if (!useLogger) {
      throw new Error('No logger service was found');
    }

    return new ErrorHandler(useLogger, useOptions.exitOnError);
  });
});

module.exports.ErrorHandler = ErrorHandler;
module.exports.errorHandler = errorHandler;
