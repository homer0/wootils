const { provider } = require('jimple');
/**
 * An error handler that captures uncaught exceptions and unhandled rejections in order to log
 * them with detail.
 * @todo The `process.exit` should be configurable.
 */
class ErrorHandler {
  /**
   * Class constructor.
   * @param {Logger} appLogger To log the detail of the erros.
   */
  constructor(appLogger) {
    /**
     * A local reference for the `appLogger` service.
     * @type {Logger}
     */
    this.appLogger = appLogger;
  }
  /**
   * Starts listening for unhandled errors.
   */
  listen() {
    const handler = this.handle.bind(this);
    process.on('uncaughtException', handler);
    process.on('unhandledRejection', handler);
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
    // Exit the process.
    process.exit(1);
  }
}
/**
 * The service provider that once registered on the app container will set an instance of
 * `ErrorHandler` as the `errorHandler` service.
 * @example
 * // Register it on the container
 * container.register(errorHandler);
 * // Getting access to the service instance
 * const errorHandler = container.get('errorHandler');
 * @type {Provider}
 * @todo It should fallback to `logger` if `appLogger` is not registered.
 */
const errorHandler = provider((app) => {
  app.set('errorHandler', () => new ErrorHandler(app.get('appLogger')));
});

module.exports = {
  ErrorHandler,
  errorHandler,
};
