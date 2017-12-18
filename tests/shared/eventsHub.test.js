jest.unmock('/shared/eventsHub');

require('jasmine-expect');
const EventsHub = require('/shared/eventsHub');

describe('EventsHub', () => {
  it('should allow new subscribers for events', () => {
    // Given
    const eventName = 'THE EVENT';
    const argOne = 'one';
    const argTwo = 'two';
    let unsubscribe = null;
    const subscriber = jest.fn();
    // When
    const sut = new EventsHub();
    unsubscribe = sut.on(eventName, subscriber);
    sut.emit(eventName, argOne, argTwo);
    unsubscribe();
    // Then
    expect(unsubscribe).toBeFunction();
    expect(subscriber).toHaveBeenCalledTimes(1);
    expect(subscriber).toHaveBeenCalledWith(argOne, argTwo);
  });

  it('should allow multiple new subscribers for events', () => {
    // Given
    const eventName = 'THE EVENT';
    let unsubscribeOne = null;
    let unsubscribeTwo = null;
    const subscriberOne = jest.fn();
    const subscriberTwo = jest.fn();
    // When
    const sut = new EventsHub();
    unsubscribeOne = sut.on(eventName, subscriberOne);
    unsubscribeTwo = sut.on(eventName, subscriberTwo);
    sut.emit(eventName);
    unsubscribeOne();
    unsubscribeTwo();
    // Then
    expect(unsubscribeOne).toBeFunction();
    expect(unsubscribeTwo).toBeFunction();
    expect(subscriberOne).toHaveBeenCalledTimes(1);
    expect(subscriberTwo).toHaveBeenCalledTimes(1);
  });

  it('shouldn\'t allow the same subscriber multiple times for the same event', () => {
    // Given
    const eventName = 'THE EVENT';
    let unsubscribeOne = null;
    let unsubscribeTwo = null;
    const subscriber = jest.fn();
    // When
    const sut = new EventsHub();
    unsubscribeOne = sut.on(eventName, subscriber);
    unsubscribeTwo = sut.on(eventName, subscriber);
    sut.emit(eventName);
    unsubscribeOne();
    unsubscribeTwo();
    // Then
    expect(unsubscribeOne).toBeFunction();
    expect(unsubscribeTwo).toBeFunction();
    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  it('shouldn\'t call the subscribers once the unsubscribe function was called', () => {
    // Given
    const eventName = 'THE EVENT';
    let unsubscribe = null;
    const subscriber = jest.fn();
    // When
    const sut = new EventsHub();
    unsubscribe = sut.on(eventName, subscriber);
    sut.emit(eventName);
    unsubscribe();
    sut.emit(eventName);
    // Then
    expect(unsubscribe).toBeFunction();
    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  it('should allow a subscribers that once executed get unsubscribed (`once`)', () => {
    // Given
    const eventName = 'THE EVENT';
    const subscriber = jest.fn();
    // When
    const sut = new EventsHub();
    sut.once(eventName, subscriber);
    sut.emit(eventName);
    sut.emit(eventName);
    // Then
    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  it('should allow new subscribers for reduced events (number)', () => {
    // Given
    const eventName = 'THE EVENT';
    const targetInitialValue = 0;
    const target = targetInitialValue;
    let result = null;
    let unsubscribe = null;
    const subscriber = jest.fn((toReduce) => (toReduce + 1));
    // When
    const sut = new EventsHub();
    unsubscribe = sut.on(eventName, subscriber);
    result = sut.reduce(eventName, target);
    unsubscribe();
    // Then
    expect(unsubscribe).toBeFunction();
    expect(subscriber).toHaveBeenCalledTimes(1);
    expect(result).toBe(1);
    expect(target).toBe(targetInitialValue);
  });

  it('should allow new subscribers for reduced events (array)', () => {
    // Given
    const eventName = 'THE EVENT';
    const targetInitialValue = ['one', 'two'];
    const target = targetInitialValue.slice();
    const newValue = 'three';
    let result = null;
    let unsubscribe = null;
    const subscriber = jest.fn((toReduce) => {
      toReduce.push(newValue);
      return toReduce;
    });
    // When
    const sut = new EventsHub();
    unsubscribe = sut.on(eventName, subscriber);
    result = sut.reduce(eventName, target);
    unsubscribe();
    // Then
    expect(unsubscribe).toBeFunction();
    expect(subscriber).toHaveBeenCalledTimes(1);
    expect(result).toEqual([...targetInitialValue, ...[newValue]]);
    expect(target).toEqual(targetInitialValue);
  });

  it('should allow new subscribers for reduced events (object)', () => {
    // Given
    const eventName = 'THE EVENT';
    const targetInitialValue = { one: 1, two: 2 };
    const target = Object.assign({}, targetInitialValue);
    const newValue = { three: 3 };
    let result = null;
    let unsubscribe = null;
    const subscriber = jest.fn((toReduce) => Object.assign({}, toReduce, newValue));
    // When
    const sut = new EventsHub();
    unsubscribe = sut.on(eventName, subscriber);
    result = sut.reduce(eventName, target);
    unsubscribe();
    // Then
    expect(unsubscribe).toBeFunction();
    expect(subscriber).toHaveBeenCalledTimes(1);
    expect(result).toEqual(Object.assign({}, targetInitialValue, newValue));
    expect(target).toEqual(targetInitialValue);
  });

  it('should allow a subscribers to unsubscribe after reducing an event once', () => {
    // Given
    const eventName = 'THE EVENT';
    const targetInitialValue = 0;
    const target = targetInitialValue;
    let result = null;
    let unsubscribe = null;
    const subscriber = jest.fn((toReduce) => (toReduce + 1));
    // When
    const sut = new EventsHub();
    unsubscribe = sut.once(eventName, subscriber);
    result = sut.reduce(eventName, target);
    result = sut.reduce(eventName, result);
    unsubscribe();
    // Then
    expect(unsubscribe).toBeFunction();
    expect(subscriber).toHaveBeenCalledTimes(1);
    expect(result).toBe(1);
    expect(target).toBe(targetInitialValue);
  });

  it('should return the original target of a reduced event if there are no subscribers', () => {
    // Given
    const eventName = 'THE EVENT';
    const target = 1;
    let result = null;
    // When
    const sut = new EventsHub();
    result = sut.reduce(eventName, target);
    // Then
    expect(result).toBe(target);
  });

  it('should allow subscribers to receive multiple arguments for reduced events', () => {
    // Given
    const eventName = 'THE EVENT';
    const targetInitialValue = 0;
    const target = targetInitialValue;
    const argOne = 1;
    const argTwo = 2;
    let result = null;
    let unsubscribe = null;
    const subscriber = jest.fn((toReduce, one, two) => (toReduce + one + two));
    // When
    const sut = new EventsHub();
    unsubscribe = sut.on(eventName, subscriber);
    result = sut.reduce(eventName, target, argOne, argTwo);
    unsubscribe();
    // Then
    expect(unsubscribe).toBeFunction();
    expect(subscriber).toHaveBeenCalledTimes(1);
    expect(subscriber).toHaveBeenCalledWith(targetInitialValue, argOne, argTwo);
    expect(result).toBe(targetInitialValue + argOne + argTwo);
    expect(target).toBe(targetInitialValue);
  });
});
