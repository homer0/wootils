/**
 * @module shared/deepAssign
 */

/**
 * @typedef {'merge'|'shallowMerge'|'concat'|'overwrite'} DeepAssignArrayMode
 * @enum {string}
 * @parent module:shared/deepAssign
 */

/**
 * @typedef {Object} DeepAssignOptions
 * @property {DeepAssignArrayMode} [arrayMode='merge']
 * Defines how array assignments should be handled.
 * @parent module:shared/deepAssign
 */

/**
 * A function that makes a deep merge (and copy) of a list of objects and/or arrays.
 *
 * @callback DeepAssignFn
 * @param {...*} targets  The objects to merge; if one of them is not an object nor an array, it
 *                        will be ignored.
 * @returns {Object|Array}
 * @parent module:shared/deepAssign
 */

/**
 * It allows for deep merge (and copy) of objects and arrays using native spread syntax.
 *
 * This class exists just to scope the different functionalities and options needed for
 * {@link DeepAssign#assign} method to work.
 *
 * @parent module:shared/deepAssign
 */
class DeepAssign {
  /**
   * @param {Partial<DeepAssignOptions>} options Custom options for how {@link DeepAssign#assign}
   *                                             it's going to work.
   * @throws {Error} If `options.arrayMode` is not a valid {@link DeepAssignArrayMode}.
   */
  constructor(options = {}) {
    if (
      options.arrayMode &&
      !['merge', 'concat', 'overwrite', 'shallowMerge'].includes(options.arrayMode)
    ) {
      throw new Error(`Invalid array mode received: \`${options.arrayMode}\``);
    }
    /**
     * The options that define how {@link DeepAssign#assign} works.
     *
     * @type {DeepAssignOptions}
     * @access protected
     * @ignore
     */
    this._options = {
      arrayMode: 'merge',
      ...options,
    };
    /**
     * @ignore
     */
    this.assign = this.assign.bind(this);
  }
  /**
   * Makes a deep merge of a list of objects and/or arrays.
   *
   * @param {...*} targets  The objects to merge; if one of them is not an object nor an array, it
   *                        will be ignored.
   * @returns {Object|Array}
   */
  assign(...targets) {
    let result;
    if (targets.length) {
      result = targets
      .filter((target) => this._isValidItem(target))
      .reduce(
        (acc, target) => (
          acc === null ?
            this._resolveFromEmpty(target, true) :
            this._resolve(acc, target, true)
        ),
        null,
      );
    } else {
      result = {};
    }

    return result;
  }
  /**
   * The options that define how {@link DeepAssign#assign} works.
   *
   * @type {Readonly<DeepAssignOptions>}
   */
  get options() {
    return Object.freeze(this._options);
  }
  /**
   * Checks if an object is a plain `Object` and not an instance of some class.
   *
   * @param {*} obj The object to validate.
   * @returns {boolean}
   * @access protected
   * @ignore
   */
  _isPlainObject(obj) {
    return obj !== null && Object.getPrototypeOf(obj).constructor.name === 'Object';
  }
  /**
   * Checks if an object can be used on a merge: only arrays and plain objects are supported.
   *
   * @param {*} obj The object to validate.
   * @returns {boolean}
   * @access protected
   * @ignore
   */
  _isValidItem(obj) {
    return Array.isArray(obj) || this._isPlainObject(obj);
  }
  /**
   * Merges two arrays into a new one. If the `concatArrays` option was set to `true` on the
   * constructor, the result will just be a concatenation with new references for the items; but
   * if the option was set to `false`, then the arrays will be merged over their indexes.
   *
   * @param {Array}               source The base array.
   * @param {Array}               target The array that will be merged on top of `source`.
   * @param {DeepAssignArrayMode} mode   The assignment strategy.
   * @returns {Array}
   * @access protected
   * @ignore
   */
  _mergeArrays(source, target, mode) {
    let result;
    if (mode === 'concat') {
      result = [...source, ...target]
      .map((targetItem) => this._resolveFromEmpty(targetItem));
    } else if (mode === 'overwrite') {
      result = target.slice().map((targetItem) => this._resolveFromEmpty(targetItem));
    } else if (mode === 'shallowMerge') {
      result = source.slice();
      target.forEach((targetItem, index) => {
        const resolved = this._resolveFromEmpty(targetItem);
        if (index < result.length) {
          result[index] = resolved;
        } else {
          result.push(this._resolveFromEmpty(targetItem));
        }
      });
    } else {
      result = source.slice();
      target.forEach((targetItem, index) => {
        if (index < result.length) {
          result[index] = this._resolve(result[index], targetItem);
        } else {
          result.push(this._resolveFromEmpty(targetItem));
        }
      });
    }

    return result;
  }
  /**
   * Merges two plain objects and their children.
   *
   * @param {Object} source The base object.
   * @param {Object} target The object which properties will be merged in top of `source`.
   * @returns {Object}
   * @access protected
   * @ignore
   */
  _mergeObjects(source, target) {
    const keys = [
      ...Object.getOwnPropertySymbols(target),
      ...Object.keys(target),
    ];

    const subMerge = keys.reduce(
      (acc, key) => ({
        ...acc,
        [key]: this._resolve(source[key], target[key]),
      }),
      {},
    );

    return { ...source, ...target, ...subMerge };
  }
  /**
   * This is the method the class calls when it has to merge two objects and it doesn't know
   * which types they are; the method takes care of validating compatibility and calling
   * either {@link DeepAssign#_mergeObjects} or {@link DeepAssign#_mergeArrays}. If the objects
   * are not compatible, or `source` is not defined, it will return a copy of `target`.
   *
   * @param {*}       source                  The base object.
   * @param {*}       target                  The object that will be merged in top of `source`.
   * @param {boolean} [ignoreArrayMode=false] Whether or not to ignore the option that tells the
   *                                          class how array assignments should be handled. This
   *                                          parameter exists because, when called directly from
   *                                          {@link DeepAssign#_assign}, it doesn't make sense to
   *                                          use a strategy different than 'merge'.
   * @returns {*}
   * @access protected
   * @ignore
   */
  _resolve(source, target, ignoreArrayMode = false) {
    let result;
    if (
      typeof target !== 'undefined' &&
      typeof source !== 'undefined'
    ) {
      if (Array.isArray(target) && Array.isArray(source)) {
        const { arrayMode } = this._options;
        const useMode = ignoreArrayMode && !['merge', 'shallowMerge'].includes(arrayMode) ?
          'merge' :
          arrayMode;
        result = this._mergeArrays(
          source,
          target,
          useMode,
        );
      } else if (this._isPlainObject(target) && this._isPlainObject(source)) {
        result = this._mergeObjects(source, target);
      } else {
        result = target;
      }
    } else {
      result = this._resolveFromEmpty(target);
    }

    return result;
  }
  /**
   * This method is a helper for {@link DeepAssign#_resolve}, and it's used for when the class
   * has the `target` but not the `source`: depending on the type of the `target`, it calls
   * resolves with an empty object of the same type; if the `target` can't be merged, it just
   * returns it as it was received, which means that is a type that doesn't hold references.
   *
   * @param {*}       target                  The target to copy.
   * @param {boolean} [ignoreArrayMode=false] Whether or not to ignore the option that tells the
   *                                          class how array assignments should be handled. This
   *                                          parameter exists because, when called directly from
   *                                          {@link DeepAssign#_assign}, it doesn't make sense to
   *                                          use a strategy different than 'merge'.
   * @returns {*}
   * @access protected
   * @ignore
   */
  _resolveFromEmpty(target, ignoreArrayMode = false) {
    let result;
    if (Array.isArray(target)) {
      result = this._resolve([], target, ignoreArrayMode);
    } else if (this._isPlainObject(target)) {
      result = this._resolve({}, target);
    } else {
      result = target;
    }

    return result;
  }
}

/**
 * Shortcut method for `new DeepAssign().assign(...)`.
 *
 * @type {DeepAssignFn}
 * @see {@link DeepAssign#assign}
 */
const deepAssign = new DeepAssign().assign;
/**
 * Shortcut method for `new DeepAssign({ arrayMode: 'concat' }).assign(...)`.
 *
 * @type {DeepAssignFn}
 * @see {@link DeepAssign#assign}
 */
const deepAssignWithConcat = new DeepAssign({ arrayMode: 'concat' }).assign;
/**
 * Shortcut method for `new DeepAssign({ arrayMode: 'overwrite' }).assign(...)`.
 *
 * @type {DeepAssignFn}
 * @see {@link DeepAssign#assign}
 */
const deepAssignWithOverwrite = new DeepAssign({ arrayMode: 'overwrite' }).assign;
/**
 * Shortcut method for `new DeepAssign({ arrayMode: 'shallowMerge' }).assign(...)`.
 *
 * @type {DeepAssignFn}
 * @see {@link DeepAssign#assign}
 */
const deepAssignWithShallowMerge = new DeepAssign({ arrayMode: 'shallowMerge' }).assign;

module.exports.DeepAssign = DeepAssign;
module.exports.deepAssign = deepAssign;
module.exports.deepAssignWithConcat = deepAssignWithConcat;
module.exports.deepAssignWithOverwrite = deepAssignWithOverwrite;
module.exports.deepAssignWithShallowMerge = deepAssignWithShallowMerge;
