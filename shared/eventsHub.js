/**
 * @module shared/eventsHub
 */

/**
 * When there's a one time subscription, a wrapper function is created with a special
 * property to identify it and remove it once it gets triggered. The wrapper and the
 * original function are stored in case `off` is called before the wrapper gets triggered;
 * it will receive the original function, not the wrapper, so the class needs a way to map
 * them together.
 *
 * @typedef {Object} EventsHubWrapperInfo
 * @property {Function} wrapper   The wrapper function that was created for the
 *                                subscription.
 * @property {Function} original  The original listener that was sent.
 * @ignore
 */

/**
 * @callback EventsHubOnceWrapper
 * @param {...*} args  The parameters for the original listener.
 * @property {boolean} [once=true]  A flag so the class will identify the wrapper.
 * @returns {*}
 * @ignore
 */

/**
 * A minimal implementation of an events handler service.
 *
 * @parent module:shared/eventsHub
 * @tutorial eventsHub
 */
class EventsHub {
  constructor() {
    /**
     * A dictionary of the events and their listeners.
     *
     * @type {Object.<string, Function[]>}
     * @access protected
     * @ignore
     */
    this._events = {};
    /**
     * A dictionary of wrappers that were created for "one time subscriptions". This is
     * used by the {@link EventsHub#off}: if it doesn't find the subscriber as it is, it
     * will look for a wrapper and remove it.
     *
     * @type {Object.<string, EventsHubWrapperInfo[]>}
     * @access protected
     * @ignore
     */
    this._onceWrappers = {};
  }
  /**
   * Emits an event and call all its listeners.
   *
   * @param {string | string[]} event  An event name or a list of them.
   * @param {...*}              args   A list of parameters to send to the listeners.
   */
  emit(event, ...args) {
    const toClean = [];
    const events = Array.isArray(event) ? event : [event];
    events.forEach((name) => {
      this.subscribers(name).forEach((subscriber) => {
        subscriber(...args);
        if (subscriber.once) {
          toClean.push({
            event: name,
            fn: subscriber,
          });
        }
      });
    });

    toClean.forEach((info) => this.off(info.event, info.fn));
  }
  /**
   * Removes an event listener.
   *
   * @param {string | string[]} event  An event name or a list of them.
   * @param {Function}          fn     The listener function.
   * @returns {boolean | boolean[]} If `event` was a `string`, it will return whether or
   *                                not the listener was found and removed; but if `event`
   *                                was an `Array`, it will return a list of boolean
   *                                values.
   */
  off(event, fn) {
    const isArray = Array.isArray(event);
    const events = isArray ? event : [event];
    const result = events.map((name) => {
      const subscribers = this.subscribers(name);
      const onceSubscribers = this._onceWrappers[name];
      let found = false;
      let index = subscribers.indexOf(fn);
      if (index > -1) {
        found = true;
        /**
         * If the listener had the `once` flag, then it's a wrapper, so it needs to remove
         * it from the wrappers list too.
         *
         * @ignore
         */
        if (fn.once && onceSubscribers) {
          const wrapperIndex = onceSubscribers.findIndex((item) => item.wrapper === fn);
          onceSubscribers.splice(wrapperIndex, 1);
        }
        subscribers.splice(index, 1);
      } else if (this._onceWrappers[name]) {
        /**
         * If it couldn't found the subscriber, maybe it's because it's the original
         * listener of a wrapper.
         *
         * @ignore
         */
        index = onceSubscribers.findIndex((item) => item.original === fn);
        if (index > -1) {
          found = true;
          const originalIndex = subscribers.indexOf(onceSubscribers[index].original);
          subscribers.splice(originalIndex, 1);
          onceSubscribers.splice(index, 1);
        }
      }

      return found;
    });

    return isArray ? result : result[0];
  }
  /**
   * Adds a new event listener.
   *
   * @param {string | string[]} event  An event name or a list of them.
   * @param {Function}          fn     The listener function.
   * @returns {Function} An unsubscribe function to remove the listener or listeners.
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
   *
   * @param {string | string[]} event  An event name or a list of them.
   * @param {Function}          fn     The listener function.
   * @returns {Function} An unsubscribe function to remove the listener.
   */
  once(event, fn) {
    const events = Array.isArray(event) ? event : [event];
    // Try to find an existing wrapper.
    let wrapper = events.reduce((acc, name) => {
      let nextAcc;
      if (acc) {
        // A previous iteration found a wrapper, so `continue`.
        nextAcc = acc;
      } else if (this._onceWrappers[name]) {
        // A list of wrappers exists for the event, so, let's try an find one for this function.
        const existing = this._onceWrappers[name].find((item) => item.original === fn);
        if (existing) {
          nextAcc = existing.wrapper;
        } else {
          nextAcc = null;
        }
      } else {
        // The list didn't even exists, let's at least create it.
        this._onceWrappers[name] = [];
        nextAcc = null;
      }

      return nextAcc;
    }, null);
    // No wrapper was found, so let's create one.
    if (!wrapper) {
      /**
       * A simple wrapper for the original listener.
       *
       * @type {EventsHubOnceWrapper}
       */
      wrapper = (...args) => fn(...args);
      wrapper.once = true;
      events.forEach((name) => {
        this._onceWrappers[name].push({
          wrapper,
          original: fn,
        });
      });
    }

    return this.on(event, wrapper);
  }
  /**
   * Reduces a target using an event. It's like emit, but the events listener return a
   * modified (or not) version of the `target`.
   *
   * @param {string | string[]} event   An event name or a list of them.
   * @param {T}                 target  The variable to reduce with the listeners.
   * @param {...*}              args    A list of parameters to send to the listeners.
   * @returns {T} A version of the `target` processed by the listeners.
   * @template T
   */
  reduce(event, target, ...args) {
    const events = Array.isArray(event) ? event : [event];
    const toClean = [];
    const result = events.reduce(
      (eventAcc, eventName) =>
        this.subscribers(eventName).reduce((subAcc, subscriber) => {
          let useCurrent;
          if (Array.isArray(subAcc)) {
            useCurrent = subAcc.slice();
          } else if (typeof subAcc === 'object') {
            useCurrent = { ...subAcc };
          } else {
            useCurrent = subAcc;
          }

          const nextStep = subscriber(...[useCurrent, ...args]);
          if (subscriber.once) {
            toClean.push({
              event: eventName,
              fn: subscriber,
            });
          }

          return nextStep;
        }, eventAcc),
      target,
    );

    toClean.forEach((info) => this.off(info.event, info.fn));
    return result;
  }
  /**
   * Reduces a target using an event. It's like emit, but the events listener return a
   * modified (or not) version of the `target`. This is the version async of `reduce`.
   *
   * @param {string | string[]} event   An event name or a list of them.
   * @param {T}                 target  The variable to reduce with the listeners.
   * @param {...*}              args    A list of parameters to send to the listeners.
   * @returns {Promise<T>} A version of the `target` processed by the listeners.
   * @template T
   */
  reduceAsync(event, target, ...args) {
    const events = Array.isArray(event) ? event : [event];
    const toClean = [];
    return events
      .reduce(
        (eventAcc, eventName) =>
          eventAcc.then((eventCurrent) => {
            const subscribers = this.subscribers(eventName);
            return subscribers.reduce(
              (subAcc, subscriber) =>
                subAcc.then((subCurrent) => {
                  let useCurrent;
                  if (Array.isArray(subCurrent)) {
                    useCurrent = subCurrent.slice();
                  } else if (typeof subCurrent === 'object') {
                    useCurrent = { ...subCurrent };
                  } else {
                    useCurrent = subCurrent;
                  }

                  const nextStep = subscriber(...[useCurrent, ...args]);
                  if (subscriber.once) {
                    toClean.push({
                      event: eventName,
                      fn: subscriber,
                    });
                  }

                  return nextStep;
                }),
              Promise.resolve(eventCurrent),
            );
          }),
        Promise.resolve(target),
      )
      .then((result) => {
        toClean.forEach((info) => this.off(info.event, info.fn));
        return result;
      });
  }
  /**
   * Gets all the listeners for an event.
   *
   * @param {string} event  The name of the event.
   * @returns {Function[]}
   */
  subscribers(event) {
    if (!this._events[event]) {
      this._events[event] = [];
    }

    return this._events[event];
  }
}

module.exports = EventsHub;
