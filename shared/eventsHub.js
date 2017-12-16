class EventsHub {
  constructor() {
    this._events = {};
  }

  on(event, fn) {
    const subscribers = this.subscribers(event);
    if (!subscribers.includes(fn)) {
      subscribers.push(fn);
    }

    return () => this.off(event, fn);
  }

  once(event, fn) {
    // eslint-disable-next-line no-param-reassign
    fn.once = true;
    return this.on(event, fn);
  }

  off(event, fn) {
    const subscribers = this.subscribers(event);
    const index = subscribers.indexOf(fn);
    let result = false;
    if (index > -1) {
      result = true;
      subscribers.splice(index, 1);
    }

    return result;
  }

  emit(event, ...args) {
    const toClean = [];
    this.subscribers(event).forEach((subscriber) => {
      subscriber(...args);
      if (subscriber.once) {
        toClean.push(subscriber);
      }
    });

    toClean.forEach((subscriber) => this.off(event, subscriber));
  }

  subscribers(event) {
    if (!this._events[event]) {
      this._events[event] = [];
    }

    return this._events[event];
  }
}

module.exports = EventsHub;
