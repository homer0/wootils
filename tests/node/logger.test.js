/* eslint-disable no-console */
jest.mock(
  'colors/safe',
  () =>
    new Proxy(
      {},
      {
        mocks: {},
        clear() {
          Object.keys(this.mocks).forEach((color) => {
            this.mocks[color].mockClear();
          });
        },
        get(target, name) {
          let result;
          if (this[name]) {
            result = this[name];
          } else {
            if (!this.mocks[name]) {
              this.mocks[name] = jest.fn((str) => str);
            }

            result = this.mocks[name];
          }

          return result;
        },
      },
    ),
);
jest.unmock('../../node/logger');
jest.unmock('../../shared/deepAssign');
jest.unmock('../../shared/jimpleFns');

const colors = require('colors/safe');
const { Logger, logger, appLogger } = require('../../node/logger');

const originalConsoleLog = console.log;

describe('Logger', () => {
  beforeEach(() => {
    console.log = originalConsoleLog;
    colors.clear();
  });

  it('should be able to be instantiated with a custom messages prefix', () => {
    // Given
    const prefix = 'myApp';
    const message = 'hello world';
    let sut = null;
    // When
    sut = new Logger(prefix);
    // Then
    expect(sut.messagesPrefix).toBe(prefix);
    expect(sut.prefix()).toBe(`[${prefix}]`);
    expect(sut.prefix(message)).toBe(`[${prefix}] ${message}`);
  });

  it('should be able to be instantiated with the flag to log the times as prefix', () => {
    // Given
    const prefix = 'myApp';
    const message = 'something';
    let sut = null;
    // When
    sut = new Logger(prefix, true);
    // Then
    expect(sut.showTime).toBe(true);
    expect(sut.prefix(message)).toMatch(/\[\w+\] \[\d+-\d+-\d+ \d+:\d+:\d+] \w+/);
  });

  it('should fallback to an empty string if a messages prefix is not set', () => {
    // Given
    const message = 'hello world';
    let sut = null;
    // When
    sut = new Logger();
    // Then
    expect(sut.messagesPrefix).toBe('');
    expect(sut.prefix()).toBe('');
    expect(sut.prefix(message)).toBe(message);
  });

  it('should log a message', () => {
    // Given
    const message = 'hello world';
    const log = jest.fn();
    jest.spyOn(console, 'log').mockImplementation(log);
    let sut = null;
    // When
    sut = new Logger();
    sut.log(message);
    // Then
    expect(log).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith(message);
  });

  it('should log a colored message', () => {
    // Given
    const message = 'hello world';
    const color = 'red';
    const log = jest.fn();
    jest.spyOn(console, 'log').mockImplementation(log);
    let sut = null;
    // When
    sut = new Logger();
    sut.log(message, color);
    // Then
    expect(log).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith(message);
    expect(colors[color]).toHaveBeenCalledTimes(1);
    expect(colors[color]).toHaveBeenCalledWith(message);
  });

  it('should log a list of messages', () => {
    // Given
    const messages = ['hello world', 'goodbye world'];
    const log = jest.fn();
    jest.spyOn(console, 'log').mockImplementation(log);
    let sut = null;
    // When
    sut = new Logger();
    sut.log(messages);
    // Then
    expect(log).toHaveBeenCalledTimes(messages.length);
    messages.forEach((message) => {
      expect(log).toHaveBeenCalledWith(message);
    });
  });

  it('should log a list of colored messages', () => {
    // Given
    const messages = ['hello world', 'goodbye world'];
    const color = 'blue';
    const log = jest.fn();
    jest.spyOn(console, 'log').mockImplementation(log);
    let sut = null;
    // When
    sut = new Logger();
    sut.log(messages, color);
    // Then
    expect(log).toHaveBeenCalledTimes(messages.length);
    expect(colors[color]).toHaveBeenCalledTimes(messages.length);
    messages.forEach((message) => {
      expect(log).toHaveBeenCalledWith(message);
      expect(colors[color]).toHaveBeenCalledWith(message);
    });
  });

  it('should log a list messages with different colors', () => {
    // Given
    const messages = [
      ['hello world', 'green'],
      ['goodbye world', 'yellow'],
    ];
    const log = jest.fn();
    jest.spyOn(console, 'log').mockImplementation(log);
    let sut = null;
    // When
    sut = new Logger();
    sut.log(messages);
    // Then
    expect(log).toHaveBeenCalledTimes(messages.length);
    messages.forEach((line) => {
      const [message, color] = line;
      expect(log).toHaveBeenCalledWith(message);
      expect(colors[color]).toHaveBeenCalledWith(message);
    });
  });

  it('should log a warning message (yellow)', () => {
    // Given
    const message = 'Something is not working';
    const color = 'yellow';
    const log = jest.fn();
    jest.spyOn(console, 'log').mockImplementation(log);
    let sut = null;
    // When
    sut = new Logger();
    sut.warning(message);
    // Then
    expect(log).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith(message);
    expect(colors[color]).toHaveBeenCalledTimes(1);
    expect(colors[color]).toHaveBeenCalledWith(message);
  });

  it('should log a warning message (yellow) using the `warn` alias', () => {
    // Given
    const message = 'Something is not working';
    const color = 'yellow';
    const log = jest.fn();
    jest.spyOn(console, 'log').mockImplementation(log);
    let sut = null;
    // When
    sut = new Logger();
    sut.warn(message);
    // Then
    expect(log).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith(message);
    expect(colors[color]).toHaveBeenCalledTimes(1);
    expect(colors[color]).toHaveBeenCalledWith(message);
  });

  it('should log a success message (green)', () => {
    // Given
    const message = 'Everything works!';
    const color = 'green';
    const log = jest.fn();
    jest.spyOn(console, 'log').mockImplementation(log);
    let sut = null;
    // When
    sut = new Logger();
    sut.success(message);
    // Then
    expect(log).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith(message);
    expect(colors[color]).toHaveBeenCalledTimes(1);
    expect(colors[color]).toHaveBeenCalledWith(message);
  });

  it('should log an informative message (grey)', () => {
    // Given
    const message = 'Be aware of the Batman';
    const color = 'grey';
    const log = jest.fn();
    jest.spyOn(console, 'log').mockImplementation(log);
    let sut = null;
    // When
    sut = new Logger();
    sut.info(message);
    // Then
    expect(log).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith(message);
    expect(colors[color]).toHaveBeenCalledTimes(1);
    expect(colors[color]).toHaveBeenCalledWith(message);
  });

  it('should log an error message (red)', () => {
    // Given
    const message = 'Something went terribly wrong';
    const color = 'red';
    const log = jest.fn();
    jest.spyOn(console, 'log').mockImplementation(log);
    let sut = null;
    // When
    sut = new Logger();
    sut.error(message);
    // Then
    expect(log).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith(message);
    expect(colors[color]).toHaveBeenCalledTimes(1);
    expect(colors[color]).toHaveBeenCalledWith(message);
  });

  it('should log an error message (red) and include an exception information', () => {
    // Given
    const message = 'Something went terribly wrong';
    const exception = 'ORDER 66';
    const color = 'red';
    const log = jest.fn();
    jest.spyOn(console, 'log').mockImplementation(log);
    let sut = null;
    // When
    sut = new Logger();
    sut.error(message, exception);
    // Then
    const twice = 2;
    expect(log).toHaveBeenCalledTimes(twice);
    expect(log).toHaveBeenCalledWith(message);
    expect(log).toHaveBeenCalledWith(exception);
    expect(colors[color]).toHaveBeenCalledTimes(1);
    expect(colors[color]).toHaveBeenCalledWith(message);
  });

  it('should log an error message (red) and include an error exception stack', () => {
    // Given
    const message = 'Something went terribly wrong';
    const exception = new Error('ORDER 66');
    const stack = exception.stack.split('\n').map((line) => line.trim());
    stack.splice(0, 1);
    const errorColor = 'red';
    const stackColor = 'grey';
    const log = jest.fn();
    jest.spyOn(console, 'log').mockImplementation(log);
    let sut = null;
    // When
    sut = new Logger();
    sut.error(message, exception);
    // Then
    expect(log).toHaveBeenCalledTimes(stack.length + 1);
    expect(log).toHaveBeenCalledWith(message);
    stack.forEach((line) => {
      expect(log).toHaveBeenCalledWith(line);
    });

    expect(colors[errorColor]).toHaveBeenCalledTimes(1);
    expect(colors[stackColor]).toHaveBeenCalledTimes(stack.length);
  });

  it('should log an exception error and its stack', () => {
    // Given
    const exception = new Error('ORDER 66');
    const stack = exception.stack.split('\n').map((line) => line.trim());
    stack.splice(0, 1);
    const errorColor = 'red';
    const stackColor = 'grey';
    const log = jest.fn();
    jest.spyOn(console, 'log').mockImplementation(log);
    let sut = null;
    // When
    sut = new Logger();
    sut.error(exception);
    // Then
    expect(log).toHaveBeenCalledTimes(stack.length + 1);
    expect(log).toHaveBeenCalledWith(exception.message);
    stack.forEach((line) => {
      expect(log).toHaveBeenCalledWith(line);
    });

    expect(colors[errorColor]).toHaveBeenCalledTimes(1);
    expect(colors[stackColor]).toHaveBeenCalledTimes(stack.length);
  });

  it('should include a provider for the DIC', () => {
    // Given
    const container = {
      set: jest.fn(),
    };
    let sut = null;
    let serviceName = null;
    let serviceFn = null;
    // When
    logger.register(container);
    [[serviceName, serviceFn]] = container.set.mock.calls;
    sut = serviceFn();
    // Then
    expect(serviceName).toBe('logger');
    expect(sut).toBeInstanceOf(Logger);
  });

  it('should allow custom options on its service provider', () => {
    // Given
    const container = {
      set: jest.fn(),
    };
    const options = {
      serviceName: 'myLogger',
      messagesPrefix: 'myPrefix',
      showTime: true,
    };
    let sut = null;
    let serviceName = null;
    let serviceFn = null;
    // When
    logger(options).register(container);
    [[serviceName, serviceFn]] = container.set.mock.calls;
    sut = serviceFn();
    // Then
    expect(serviceName).toBe(options.serviceName);
    expect(sut).toBeInstanceOf(Logger);
    expect(sut.messagesPrefix).toBe(options.messagesPrefix);
    expect(sut.showTime).toBe(options.showTime);
  });

  it('should include a provider for the DIC that uses the package name as prefix', () => {
    // Given
    const appName = 'MyApp';
    const container = {
      set: jest.fn(),
      get: jest.fn(() => ({ name: appName })),
    };
    let sut = null;
    let serviceName = null;
    let serviceFn = null;
    // When
    appLogger.register(container);
    [[serviceName, serviceFn]] = container.set.mock.calls;
    sut = serviceFn();
    // Then
    expect(serviceName).toBe('appLogger');
    expect(sut).toBeInstanceOf(Logger);
    expect(sut.messagesPrefix).toBe(appName);
  });

  it('should detect the nameForCLI when reading the package for the prefix', () => {
    // Given
    const appName = 'MyAppCLI';
    const container = {
      set: jest.fn(),
      get: jest.fn(() => ({ nameForCLI: appName })),
    };
    let sut = null;
    let serviceName = null;
    let serviceFn = null;
    // When
    appLogger.register(container);
    [[serviceName, serviceFn]] = container.set.mock.calls;
    sut = serviceFn();
    // Then
    expect(serviceName).toBe('appLogger');
    expect(sut).toBeInstanceOf(Logger);
    expect(sut.messagesPrefix).toBe(appName);
  });

  it('should support custom options on the appLogger provider', () => {
    // Given
    const packageInfo = {
      name: 'myApp!',
    };
    const options = {
      serviceName: 'MyAppLogger!',
      services: {
        packageInfo,
      },
      showTime: true,
    };
    const container = {
      set: jest.fn(),
      get: jest.fn(),
    };
    let sut = null;
    let serviceName = null;
    let serviceFn = null;
    // When
    appLogger(options).register(container);
    [[serviceName, serviceFn]] = container.set.mock.calls;
    sut = serviceFn();
    // Then
    expect(serviceName).toBe(options.serviceName);
    expect(sut).toBeInstanceOf(Logger);
    expect(sut.messagesPrefix).toBe(packageInfo.name);
    expect(sut.showTime).toBe(options.showTime);
    expect(container.get).toHaveBeenCalledTimes(0);
  });
});
