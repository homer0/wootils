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
});
