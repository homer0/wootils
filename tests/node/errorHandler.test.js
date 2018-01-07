jest.unmock('/node/errorHandler.js');
jest.mock('jimple', () => ({ provider: jest.fn(() => 'provider') }));

require('jasmine-expect');
const {
  ErrorHandler,
  errorHandler,
} = require('/node/errorHandler');
const { provider } = require('jimple');

const originalProcessOn = process.on;
const originalExit = process.exit;

describe('ErrorHandler', () => {
  afterEach(() => {
    process.on = originalProcessOn;
    process.exit = originalExit;
  });

  it('should add the listener for uncaught and rejected exceptions', () => {
    // Given
    const onMock = jest.fn();
    process.on = onMock;
    let handler = null;
    // When
    handler = new ErrorHandler();
    handler.listen();
    // Then
    expect(onMock).toHaveBeenCalledTimes(2);
    expect(onMock).toHaveBeenCalledWith(
      'uncaughtException',
      expect.any(Function)
    );
    expect(onMock).toHaveBeenCalledWith(
      'unhandledRejection',
      expect.any(Function)
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
    let handler = null;
    // When
    handler = new ErrorHandler(appLogger);
    handler.handle(exception);
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
    let handler = null;
    // When
    handler = new ErrorHandler(appLogger);
    handler.handle(exception);
    // Then
    expect(logMock).toHaveBeenCalledTimes(1);
    expect(logMock).toHaveBeenCalledWith(
      expect.stringMatching(/^\[\d+-\d+-\d+ \d+:\d+:\d+]/),
      exception
    );
    expect(exitMock).toHaveBeenCalledTimes(1);
    expect(exitMock).toHaveBeenCalledWith(1);
  });

  it('should have a Jimple provider to register the service', () => {
    // Given
    const container = {
      set: jest.fn(),
      get: jest.fn((dependency) => dependency),
    };
    let service = null;
    // When
    provider.mock.calls[0][0](container);
    service = container.set.mock.calls[0][1]();
    // Then
    expect(errorHandler).toBe('provider');
    expect(provider).toHaveBeenCalledTimes(1);
    expect(container.set).toHaveBeenCalledTimes(1);
    expect(container.set.mock.calls[0][0]).toBe('errorHandler');
    expect(container.set.mock.calls[0][1]).toBeFunction();
    expect(container.get).toHaveBeenCalledTimes(1);
    expect(container.get).toHaveBeenCalledWith('appLogger');
    expect(service).toBeInstanceOf(ErrorHandler);
  });
});
