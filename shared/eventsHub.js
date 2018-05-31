/**
 * A minimal implementation of an events handler service.
 */
class EventsHub {
  /**
   * Class constructor.
   * @ignore
   */
  constructor() {
    /**
     * A dictionary of the events and their listeners.
     * @type {Object}
     * @ignore
     */
    this._events = {};
  }
  /**
   * Adds a new event listener.
   * @param {String|Array} event An event name or a list of them.
   * @param {Function}     fn    The listener function.
   * @return {Function} An unsubscribe function to remove the listener or listeners.
   */
  on(event, fn) {
    const events = Array.isArray(event) ? event : [event];
    events.forEach((name) => {
      const subscribers = this.subscribers(name);
      if (!subscribers.includes(fn)) {
        subscribers.push(fn);
      }
    });

    return () => this.off(event, fn);
  }
  /**
   * Adds an event listener that will only be executed once.
   * @param {String|Array} event An event name or a list of them.
   * @param {Function}     fn    The listener function.
   * @return {Function} An unsubscribe function to remove the listener.
   */
  once(event, fn) {
    const events = Array.isArray(event) ? event : [event];
    const once = {};
    events.forEach((name) => {
      once[name] = true;
    });

    // eslint-disable-next-line no-param-reassign
    fn.once = once;
    return this.on(event, fn);
  }
  /**
   * Removes an event listener.
   * @param {String|Array} event An event name or a list of them.
   * @param {Function}     fn    The listener function.
   * @return {Boolean|Array} If `event` was a `string`, it will return whether or not the listener
   *                         was found and removed; but if `event` was an `Array`, it will return
   *                         a list of boolean values.
   */
  off(event, fn) {
    const isArray = Array.isArray(event);
    const events = isArray ? event : [event];
    const result = events.map((name) => {
      const subscribers = this.subscribers(name);
      let found = false;
      const index = subscribers.indexOf(fn);
      if (index > -1) {
        found = true;
        subscribers.splice(index, 1);
      }

      return found;
    });

    return isArray ? result : result[0];
  }
  /**
   * Emits an event and call all its listeners.
   * @param {String|Array} event An event name or a list of them.
   * @param {Array}        args  A list of parameters to send to the listeners.
   */
  emit(event, ...args) {
    const toClean = [];
    const events = Array.isArray(event) ? event : [event];
    events.forEach((name) => {
      this.subscribers(name).forEach((subscriber) => {
        subscriber(...args);
        if (this._shouldRemoveSubscriber(name, subscriber) && !toClean.includes(subscriber)) {
          toClean.push(subscriber);
        }
      });
    });

    toClean.forEach((subscriber) => this.off(Object.keys(subscriber.once), subscriber));
  }
  /**
   * Reduce a target using an event. It's like emit, but the events listener return
   * a modified (or not) version of the `target`.
   * @param {String|Array} event  An event name or a list of them.
   * @param {*}            target The variable to reduce with the listeners.
   * @param {Array}        args   A list of parameters to send to the listeners.
   * @return {*} A version of the `target` processed by the listeners.
   */
  reduce(event, target, ...args) {
    const events = Array.isArray(event) ? event : [event];
    let result = target;
    events.forEach((name) => {
      const subscribers = this.subscribers(name);
      if (subscribers.length) {
        const toClean = [];
        let processed;
        if (Array.isArray(result)) {
          processed = result.slice();
        } else if (typeof result === 'object') {
          processed = Object.assign({}, result);
        } else {
          processed = result;
        }

        subscribers.forEach((subscriber) => {
          processed = subscriber(...[processed, ...args]);
          if (this._shouldRemoveSubscriber(name, subscriber)) {
            toClean.push(subscriber);
          }
        });

        toClean.forEach((subscriber) => this.off(Object.keys(subscriber.once), subscriber));
        result = processed;
      }
    });

    return result;
  }
  /**
   * Get all the listeners for an event.
   * @param {String} event The name of the event.
   * @return {Array}
   */
  subscribers(event) {
    if (!this._events[event]) {
      this._events[event] = [];
    }

    return this._events[event];
  }

  _shouldRemoveSubscriber(event, subscriber) {
    let should = false;
    if (subscriber.once) {
      // eslint-disable-next-line no-param-reassign
      subscriber.once[event] = false;
      should = !Object.keys(subscriber.once).some((name) => subscriber.once[name]);
    }
    return should;
  }
}

module.exports = EventsHub;
