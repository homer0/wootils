jest.unmock('../../node/errorHandler.js');
jest.unmock('../../shared/deepAssign.js');
jest.unmock('../../shared/jimpleFns.js');

const {
  ErrorHandler,
  errorHandler,
} = require('../../node/errorHandler');

const originalProcessOn = process.on;
const originalProcessRemoveListener = process.removeListener;
const originalExit = process.exit;

describe('ErrorHandler', () => {
  afterEach(() => {
    process.on = originalProcessOn;
    process.removeListener = originalProcessRemoveListener;
    process.exit = originalExit;
  });

  it('should add the listeners for uncaught and rejected exceptions', () => {
    // Given
    const onMock = jest.fn();
    process.on = onMock;
    let sut = null;
    // When
    sut = new ErrorHandler();
    sut.listen();
    // Then
    expect(onMock).toHaveBeenCalledTimes(2);
    expect(onMock).toHaveBeenCalledWith(
      'uncaughtException',
      sut.handler,
    );
    expect(onMock).toHaveBeenCalledWith(
      'unhandledRejection',
      sut.handler,
    );
  });

  it('should add and remove the listeners for uncaught and rejected exceptions', () => {
    // Given
    const onMock = jest.fn();
    process.on = onMock;
    const removeListenerMock = jest.fn();
    process.removeListener = removeListenerMock;
    let sut = null;
    // When
    sut = new ErrorHandler();
    sut.listen();
    sut.stopListening();
    // Then
    expect(onMock).toHaveBeenCalledTimes(2);
    expect(onMock).toHaveBeenCalledWith(
      'uncaughtException',
      sut.handler,
    );
    expect(onMock).toHaveBeenCalledWith(
      'unhandledRejection',
      sut.handler,
    );
    expect(removeListenerMock).toHaveBeenCalledTimes(2);
    expect(removeListenerMock).toHaveBeenCalledWith(
      'uncaughtException',
      sut.handler,
    );
    expect(removeListenerMock).toHaveBeenCalledWith(
      'unhandledRejection',
      sut.handler,
    );
  });

  it('should log an uncaught exception as it is if the logger already shows time', () => {
    // Given
    const exitMock = jest.fn();
    process.exit = exitMock;
    const logMock = jest.fn();
    const appLogger = {
      showTime: true,
      error: logMock,
    };
    const exception = new Error('ORDER 66');
    let sut = null;
    // When
    sut = new ErrorHandler(appLogger);
    sut.handle(exception);
    // Then
    expect(logMock).toHaveBeenCalledTimes(1);
    expect(logMock).toHaveBeenCalledWith(exception);
    expect(exitMock).toHaveBeenCalledTimes(1);
    expect(exitMock).toHaveBeenCalledWith(1);
  });

  it('should log an uncaught exception with the time if the logger has it disabled', () => {
    // Given
    const exitMock = jest.fn();
    process.exit = exitMock;
    const logMock = jest.fn();
    const appLogger = {
      showTime: false,
      error: logMock,
    };
    const exception = new Error('ORDER 66');
    let sut = null;
    // When
    sut = new ErrorHandler(appLogger);
    sut.handle(exception);
    // Then
    expect(logMock).toHaveBeenCalledTimes(1);
    expect(logMock).toHaveBeenCalledWith(
      expect.stringMatching(/^\[\d+-\d+-\d+ \d+:\d+:\d+]/),
      exception,
    );
    expect(exitMock).toHaveBeenCalledTimes(1);
    expect(exitMock).toHaveBeenCalledWith(1);
  });

  it('shouldn\'t exit the process when handling an error', () => {
    // Given
    const exitMock = jest.fn();
    process.exit = exitMock;
    const logMock = jest.fn();
    const appLogger = {
      showTime: true,
      error: logMock,
    };
    const exception = new Error('ORDER 66');
    let sut = null;
    // When
    sut = new ErrorHandler(appLogger, false);
    sut.handle(exception);
    // Then
    expect(logMock).toHaveBeenCalledTimes(1);
    expect(logMock).toHaveBeenCalledWith(exception);
    expect(exitMock).toHaveBeenCalledTimes(0);
  });

  it('should include a provider for the DIC', () => {
    // Given
    const container = {
      set: jest.fn(),
      get: jest.fn((dependency) => dependency),
    };
    let sut = null;
    let serviceName = null;
    let serviceFn = null;
    // When
    errorHandler.register(container);
    [[serviceName, serviceFn]] = container.set.mock.calls;
    sut = serviceFn();
    // Then
    expect(serviceName).toBe('errorHandler');
    expect(sut).toBeInstanceOf(ErrorHandler);
    expect(container.get).toHaveBeenCalledTimes(1);
    expect(container.get).toHaveBeenCalledWith('logger');
  });

  it('should fallback to the appLogger if logger is not available on the container', () => {
    // Given
    const container = {
      set: jest.fn(),
      get: jest.fn((dependency) => {
        if (dependency === 'logger') {
          throw new Error();
        }

        return dependency;
      }),
    };
    let sut = null;
    let serviceName = null;
    let serviceFn = null;
    // When
    errorHandler.register(container);
    [[serviceName, serviceFn]] = container.set.mock.calls;
    sut = serviceFn();
    // Then
    expect(serviceName).toBe('errorHandler');
    expect(sut).toBeInstanceOf(ErrorHandler);
    expect(container.get).toHaveBeenCalledTimes(['logger', 'appLogger'].length);
    expect(container.get).toHaveBeenNthCalledWith(1, 'logger');
    expect(container.get).toHaveBeenNthCalledWith(2, 'appLogger');
  });

  it('should allow custom options on its service provider', () => {
    // Given
    const container = {
      set: jest.fn(),
      get: jest.fn((dependency) => dependency),
    };
    const options = {
      serviceName: 'myErrorHandler',
      services: {
        logger: 'MyLogger',
      },
      exitOnError: false,
    };
    let sut = null;
    let serviceName = null;
    let serviceFn = null;
    // When
    errorHandler(options).register(container);
    [[serviceName, serviceFn]] = container.set.mock.calls;
    sut = serviceFn();
    // Then
    expect(serviceName).toBe(options.serviceName);
    expect(sut).toBeInstanceOf(ErrorHandler);
    expect(sut.exitOnError).toBe(options.exitOnError);
    expect(container.get).toHaveBeenCalledTimes(1);
    expect(container.get).toHaveBeenCalledWith(options.services.logger);
  });

  it('should allow a custom logger on its service provider', () => {
    // Given
    const container = {
      set: jest.fn(),
      get: jest.fn(),
    };
    const options = {
      services: {
        logger: { hello: 'world' },
      },
    };
    let serviceFn = null;
    // When
    errorHandler(options).register(container);
    [[, serviceFn]] = container.set.mock.calls;
    serviceFn();
    // Then
    expect(container.get).toHaveBeenCalledTimes(0);
  });

  it('should throw an error if an invalid logger is provided', () => {
    // Given
    const container = {
      set: jest.fn(),
      get: jest.fn(),
    };
    const options = {
      services: {
        logger: null,
      },
    };
    let serviceFn = null;
    // When/Then
    errorHandler(options).register(container);
    [[, serviceFn]] = container.set.mock.calls;
    expect(() => serviceFn()).toThrow(/No logger service was found/i);
  });
});
