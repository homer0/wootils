const { provider } = require('jimple');
/**
 * An error handler that captures uncaught exceptions and unhandled rejections in order to log
 * them with detail.
 * @todo The `process.exit` should be configurable.
 */
class ErrorHandler {
  /**
   * Class constructor.
   * @param {Logger}  appLogger          To log the detail of the erros.
   * @param {boolean} [exitOnError=true] Whether or not to exit the process after receiving an
   *                                     error.
   */
  constructor(appLogger, exitOnError = true) {
    /**
     * A local reference for the `appLogger` service.
     * @type {Logger}
     */
    this.appLogger = appLogger;
    /**
     * Whether or not to exit the process after receiving an error.
     * @type {boolean}
     */
    this.exitOnError = exitOnError;
    /**
     * The list of events this handler will listen for in order to catch errors.
     * @type {Array}
     */
    this.eventsNames = [
      'uncaughtException',
      'unhandledRejection',
    ];
    /**
     * Bind the handler method so it can be used on the calls to `process`.
     * @ignore
     */
    this.handler = this.handle.bind(this);
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
  /**
   * This is called by the process listeners when an uncaught exception is thrown or a rejected
   * promise is not handled. It logs the error on detail.
   * The process exits when after logging an error.
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
      process.exit(1);
    }
  }
}
/**
 * Generates a `Provider` with an already defined flag to exit or not the process when after
 * handling an error.
 * @param {boolean} [exitOnError] Whether or not to exit the process after receiving an error.
 * @return {Provider}
 */
const errorHandlerWithOptions = (exitOnError) => provider((app) => {
  app.set('errorHandler', () => {
    let logger = null;
    try {
      logger = app.get('logger');
    } catch (ignore) {
      logger = app.get('appLogger');
    }

    return new ErrorHandler(
      logger,
      exitOnError
    );
  });
});
/**
 * The service provider that once registered on the app container will set an instance of
 * `ErrorHandler` as the `errorHandler` service.
 * @example
 * // Register it on the container
 * container.register(errorHandler);
 * // Getting access to the service instance
 * const errorHandler = container.get('errorHandler');
 * @type {Provider}
 */
const errorHandler = errorHandlerWithOptions();

module.exports = {
  ErrorHandler,
  errorHandlerWithOptions,
  errorHandler,
};
