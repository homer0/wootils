const { provider } = require('jimple');

class ErrorHandler {
  constructor(appLogger) {
    this.appLogger = appLogger;
  }

  listen() {
    const handler = this.handle.bind(this);
    process.on('uncaughtException', handler);
    process.on('unhandledRejection', handler);
  }

  handle(error) {
    if (this.appLogger.showTime) {
      this.appLogger.error(error);
    } else {
      const time = new Date()
      .toISOString()
      .replace(/T/, ' ')
      .replace(/\..+/, '');

      const message = `[${time}] ${error.message}`;
      this.appLogger.error(message, error);
    }

    process.exit(1);
  }
}

const errorHandler = provider((app) => {
  app.set('errorHandler', () => new ErrorHandler(app.get('appLogger')));
});

module.exports = {
  ErrorHandler,
  errorHandler,
};
