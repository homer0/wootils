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
   * @param {String}   event The name of the event.
   * @param {Function} fn    The listener function.
   * @return {Function} An unsubscribe function to remove the listener.
   */
  on(event, fn) {
    const subscribers = this.subscribers(event);
    if (!subscribers.includes(fn)) {
      subscribers.push(fn);
    }

    return () => this.off(event, fn);
  }
  /**
   * Adds an event listener that will only be executed once.
   * @param {String}   event The name of the event.
   * @param {Function} fn    The listener function.
   * @return {Function} An unsubscribe function to remove the listener.
   */
  once(event, fn) {
    // eslint-disable-next-line no-param-reassign
    fn.once = true;
    return this.on(event, fn);
  }
  /**
   * Removes an event listener.
   * @param {String}   event The name of the event.
   * @param {Function} fn    The listener function.
   * @return {Boolean} Whether or not the listener was found and removed.
   */
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
  /**
   * Emits an event and call all its listeners.
   * @param {String} event The name of the event.
   * @param {Array}  args  A list of parameters to send to the listeners.
   */
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
  /**
   * Reduce a target using an event. It's like emit, but the events listener return
   * a modified (or not) version of the `target`.
   * @param {String} event  The name of the event.
   * @param {*}      target The variable to reduce with the listeners.
   * @param {Array}  args   A list of parameters to send to the listeners.
   * @return {*} A version of the `target` processed by the listeners.
   */
  reduce(event, target, ...args) {
    const subscribers = this.subscribers(event);
    let result = target;
    if (subscribers.length) {
      const toClean = [];
      let processed;
      if (Array.isArray(target)) {
        processed = target.slice();
      } else if (typeof target === 'object') {
        processed = Object.assign({}, target);
      } else {
        processed = target;
      }

      this.subscribers(event).forEach((subscriber) => {
        processed = subscriber(...[processed, ...args]);
        if (subscriber.once) {
          toClean.push(subscriber);
        }
      });

      toClean.forEach((subscriber) => this.off(event, subscriber));
      result = processed;
    }

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
}

module.exports = EventsHub;
