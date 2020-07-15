jest.mock('jimple', () => ({ provider: jest.fn(() => 'provider') }));
jest.unmock('../../node/errorHandler.js');

const { provider } = require('jimple');
const {
  ErrorHandler,
  errorHandlerWithOptions,
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

  it('should have a Jimple provider to register the service', () => {
    // Given
    const container = {
      set: jest.fn(),
      get: jest.fn((dependency) => dependency),
    };
    let sut = null;
    let serviceProvider = null;
    let serviceName = null;
    let serviceFn = null;
    // When
    [[serviceProvider]] = provider.mock.calls;
    serviceProvider(container);
    [[serviceName, serviceFn]] = container.set.mock.calls;
    sut = serviceFn();
    // Then
    expect(errorHandler).toBe('provider');
    expect(provider).toHaveBeenCalledTimes(1);
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
    let serviceProvider = null;
    let serviceName = null;
    let serviceFn = null;
    // When
    [[serviceProvider]] = provider.mock.calls;
    serviceProvider(container);
    [[serviceName, serviceFn]] = container.set.mock.calls;
    sut = serviceFn();
    // Then
    expect(errorHandler).toBe('provider');
    expect(provider).toHaveBeenCalledTimes(1);
    expect(serviceName).toBe('errorHandler');
    expect(sut).toBeInstanceOf(ErrorHandler);
    expect(container.get).toHaveBeenCalledTimes(['logger', 'appLogger'].length);
    expect(container.get).toHaveBeenCalledWith('appLogger');
  });

  it('should have a customizable Jimple provider to disable the `process.exit`', () => {
    // Given
    const container = {
      set: jest.fn(),
      get: jest.fn((dependency) => dependency),
    };
    const exitOnError = false;
    let sut = null;
    let registerResult = null;
    let serviceProvider = null;
    let serviceName = null;
    let serviceFn = null;
    // When
    registerResult = errorHandlerWithOptions(exitOnError);
    /**
     * The first one is the one for the default provider, the second one is
     * the one generated by this test.
     */
    [, [serviceProvider]] = provider.mock.calls;
    serviceProvider(container);
    [[serviceName, serviceFn]] = container.set.mock.calls;
    sut = serviceFn();
    // Then
    expect(registerResult).toBe('provider');
    expect(serviceName).toBe('errorHandler');
    expect(sut).toBeInstanceOf(ErrorHandler);
    expect(sut.exitOnError).toBe(exitOnError);
    expect(container.get).toHaveBeenCalledTimes(1);
    expect(container.get).toHaveBeenCalledWith('logger');
  });
});
