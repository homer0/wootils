const extend = require('extend');

/**
 * @typedef {Function} ObjectUtilsShouldFlatFn
 * @param {string} key
 * @param {Object} value
 * @returns {boolean} Whether or not the method should flat a sub object.
 */

/**
 * A small collection of utility methods to work with objects.
 */
class ObjectUtils {
  /**
   * Creates a deep copy of a given object.
   *
   * @param {Object} target The object to copy.
   * @returns {Object}
   */
  static copy(target) {
    return this.merge(target);
  }
  /**
   * A shorthand method for {@link ObjectUtils.formatKeys} that transforms the keys from
   * `dash-case` to `lowerCamelCase`.
   *
   * @param {Object} target              The object for format.
   * @param {Array}  [include=[]]        A list of keys or paths where the transformation will
   *                                     be made. If not specified, the method will use all the
   *                                     keys from the object.
   * @param {Array}  [exclude=[]]        A list of keys or paths where the transformation won't
   *                                     be made.
   * @param {string} [pathDelimiter='.'] The delimiter that will separate the path components
   *                                     for both `include` and `exclude`.
   * @returns {Object}
   */
  static dashToLowerCamelKeys(target, include = [], exclude = [], pathDelimiter = '.') {
    return this.formatKeys(
      target,
      /([a-z])-([a-z])/g,
      (fullMatch, firstLetter, secondLetter) => {
        const newSecondLetter = secondLetter.toUpperCase();
        return `${firstLetter}${newSecondLetter}`;
      },
      include,
      exclude,
      pathDelimiter,
    );
  }
  /**
   * A shorthand method for {@link ObjectUtils.formatKeys} that transforms the keys from
   * `dash-case` to `snake_case`.
   *
   * @param {Object} target              The object for format.
   * @param {Array}  [include=[]]        A list of keys or paths where the transformation will
   *                                     be made. If not specified, the method will use all the
   *                                     keys from the object.
   * @param {Array}  [exclude=[]]        A list of keys or paths where the transformation won't
   *                                     be made.
   * @param {string} [pathDelimiter='.'] The delimiter that will separate the path components
   *                                     for both `include` and `exclude`.
   * @returns {Object}
   */
  static dashToSnakeKeys(target, include = [], exclude = [], pathDelimiter = '.') {
    return this.formatKeys(
      target,
      /([a-z])-([a-z])/g,
      (fullMatch, firstLetter, secondLetter) => `${firstLetter}_${secondLetter}`,
      include,
      exclude,
      pathDelimiter,
    );
  }
  /**
   * Deletes a property of an object using a path.
   *
   * @example
   * const target = {
   *   propOne: {
   *     propOneSub: 'Charito!',
   *   },
   *   propTwo: '!!!',
   * };
   * console.log(ObjectUtils.delete(
   *   target,
   *   'propOne.propOneSub'
   * ));
   * // Will output { propTwo: '!!!' }
   *
   * @param {Object}  target                      The object from where the property will be
   *                                              removed.
   * @param {string}  objPath                     The path to the property.
   * @param {string}  [pathDelimiter='.']         The delimiter that will separate the path
   *                                              components.
   * @param {boolean} [cleanEmptyProperties=true] If this flag is `true` and after removing the
   *                                              property the parent object is empty, it will
   *                                              remove it recursively until a non empty parent
   *                                              object is found.
   * @param {boolean} [failWithError=false]       Whether or not to throw an error when the path
   *                                              is invalid. If this is `false`, the method will
   *                                              silently fail.
   * @returns {Object} A copy of the original object with the removed property/properties.
   */
  static delete(
    target,
    objPath,
    pathDelimiter = '.',
    cleanEmptyProperties = true,
    failWithError = false,
  ) {
    const parts = objPath.split(pathDelimiter);
    const last = parts.pop();
    let result = this.copy(target);
    if (parts.length) {
      const parentPath = parts.join(pathDelimiter);
      const parentObj = this.get(
        result,
        parentPath,
        pathDelimiter,
        failWithError,
      );
      delete parentObj[last];
      if (cleanEmptyProperties && !Object.keys(parentObj).length) {
        result = this.delete(
          result,
          parentPath,
          pathDelimiter,
          cleanEmptyProperties,
          failWithError,
        );
      }
    } else {
      delete result[last];
    }

    return result;
  }
  /**
   * Extracts a property or properties from an object in order to create a new one.
   *
   * @example
   * const target = {
   *   name: {
   *     first: 'Rosario',
   *   },
   *   age: 3,
   *   address: {
   *     planet: 'earth',
   *     something: 'else',
   *   },
   * };
   * console.log(ObjectUtils.set(obj, [
   *   { 'name': 'name.first'},
   *   'age',
   *   'address.planet'
   * ]));
   * // Will output { name: 'Rosario', age: 3, address: { planet: 'earth' } }
   * @param {Object}              target                The object from where the
   *                                                    property/properties will be extracted.
   * @param {Array|Object|string} objPaths              This can be a single path or a list of
   *                                                    them. And for this method, the paths are
   *                                                    not only strings but can also be an object
   *                                                    with a single key, the would be the path
   *                                                    to where to "do the extraction", and the
   *                                                    value the path on the target object.
   * @param {string}              [pathDelimiter='.']   The delimiter that will separate the
   *                                                    path components.
   * @param {boolean}             [failWithError=false] Whether or not to throw an error when the
   *                                                    path is invalid. If this is `false`, the
   *                                                    method will silently fail an empty object.
   * @returns {Object}
   */
  static extract(target, objPaths, pathDelimiter = '.', failWithError = false) {
    const copied = this.copy(target);
    let result = {};
    (Array.isArray(objPaths) ? objPaths : [objPaths])
    .reduce((acc, objPath) => {
      let destPath;
      let originPath;
      if (typeof objPath === 'object') {
        [destPath] = Object.keys(objPath);
        originPath = objPath[destPath];
      } else {
        destPath = objPath;
        originPath = objPath;
      }

      return [...acc, {
        origin: originPath,
        customDest: destPath.includes(pathDelimiter),
        dest: destPath,
      }];
    }, [])
    .some((pathInfo) => {
      let breakLoop = false;
      const value = this.get(copied, pathInfo.origin, pathDelimiter, failWithError);
      if (typeof value !== 'undefined') {
        if (pathInfo.customDest) {
          result = this.set(result, pathInfo.dest, value, pathDelimiter, failWithError);
          if (typeof result === 'undefined') {
            breakLoop = true;
          }
        } else {
          result[pathInfo.dest] = value;
        }
      }

      return breakLoop;
    });

    return result;
  }

  /**
   * Flatterns an object properties into a single level dictionary.
   *
   * @example
   * const target = {
   *   propOne: {
   *     propOneSub: 'Charito!',
   *   },
   *   propTwo: '!!!',
   * };
   * console.log(ObjectUtils.flat(target);
   * // Will output { 'propOne.propOneSub': 'Charito!', propTwo: '!!!' }
   *
   * @param {Object}                  target                The object to transform.
   * @param {string}                  [pathDelimiter='.']   The delimiter that will separate the
   *                                                        path components.
   * @param {string}                  [prefix='']           A custom prefix to be added before the
   *                                                        name of the properties. This can be
   *                                                        used on custom cases and it's also
   *                                                        used when the method calls itself in
   *                                                        order to flattern a sub object.
   * @param {ObjectUtilsShouldFlatFn} [shouldFlattern=null] A custom function that can be used in
   *                                                        order to tell the method whether an
   *                                                        Object or an Array property should be
   *                                                        flattern or not. It will receive the
   *                                                        key for the property and the
   *                                                        Object/Array itself.
   * @returns {Object}
   */
  static flat(target, pathDelimiter = '.', prefix = '', shouldFlattern = null) {
    let result = {};
    const namePrefix = prefix ? `${prefix}${pathDelimiter}` : '';
    Object.keys(target).forEach((key) => {
      const name = `${namePrefix}${key}`;
      const value = target[key];
      const valueType = typeof value;
      const isObject = valueType === 'object' && value !== null;
      if (isObject && (!shouldFlattern || shouldFlattern(key, value))) {
        result = this.merge(result, this.flat(
          value,
          pathDelimiter,
          name,
          shouldFlattern,
        ));
      } else {
        result[name] = isObject ? this.copy(value) : value;
      }
    });

    return result;
  }
  /**
   * Formats all the keys on an object using a way similar to `.replace(regexp, ...)` but that
   * also works recursively and with _"object paths"_.
   *
   * @example
   * const target = {
   *   prop_one: 'Charito!',
   * };
   * console.log(ObjectUtils.formatKeys(
   *   target,
   *   // Find all the keys with snake case.
   *   /([a-z])_([a-z])/g,
   *   // Using the same .replace style callback, replace it with lower camel case.
   *   (fullMatch, firstLetter, secondLetter) => {
   *     const newSecondLetter = secondLetter.toUpperCase();
   *     return `${firstLetter}${newSecondLetter}`;
   *   }
   * ));
   * // Will output { propOne: 'Charito!}.
   *
   * @param {Object}   target              The object for format.
   * @param {RegExp}   searchExpression    The regular expression the method will use "match" the
   *                                       keys.
   * @param {Function} replaceWith         The callback the method will call when formatting a
   *                                       replace. Think of `searchExpression` and `replaceWith`
   *                                       as the parameters of a `.replace` call, where the
   *                                       object is the key.
   * @param {Array}    [include=[]]        A list of keys or paths where the transformation will
   *                                       be made. If not specified, the method will use all the
   *                                       keys from the object.
   * @param {Array}    [exclude=[]]        A list of keys or paths where the transformation won't
   *                                       be made.
   * @param {string}   [pathDelimiter='.'] The delimiter that will separate the path components
   *                                       for both `include` and `exclude`.
   * @returns {Object}
   */
  static formatKeys(
    target,
    searchExpression,
    replaceWith,
    include = [],
    exclude = [],
    pathDelimiter = '.',
  ) {
    // First of all, get all the keys from the target.
    const keys = Object.keys(target);
    /**
     * Then, check which keys are parent to other objects.
     * This is saved on a dictionary not only because it makes it easier to check if the method
     * should make a recursive call for a key, but also because when parsing the `exclude`
     * parameter, if one of items is a key (and not an specific path), the method won't make the
     * recursive call.
     */
    const hasChildrenByKey = {};
    keys.forEach((key) => {
      const value = target[key];
      hasChildrenByKey[key] = !!(
        value &&
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value) &&
        Object.keys(value)
      );
    });
    /**
     * Escape the path delimiter and create two regular expression: One that removes the path
     * delimiter from the start of a path and one that removes it from the end.
     * They are later used to normalize paths in order to avoid "incomplete paths" (paths that
     * end or start with the delimiter).
     */
    const escapedPathDelimiter = pathDelimiter.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    const cleanPathStartExpression = new RegExp(`^${escapedPathDelimiter}`, 'i');
    const cleanPathEndExpression = new RegExp(`${escapedPathDelimiter}$`, 'i');
    /**
     * This dictionary will be used to save the `include` parameter that will be sent for specific
     * keys on recursive calls.
     * If `include` has a path like `myKey.mySubKey`, `myKey` is not transformed, but `mySubKey`
     * is saved on this dictionary (`{ myKey: ['mySubKey']}`) and when the method applies the
     * formatting to the object, if `myKey` has an object, it will make a recursive all and
     * send `['mySubKey]` as its `include` parameter.
     */
    const subIncludeByKey = {};
    /**
     * This will be an array containing the final list of `keys` that should be tranformed.
     * To be clear, these keys will be from the top level, so, they won't be paths.
     * Thd following blocks will parse `include` and `exclude` in order to extract the real keys,
     * prepare the `include` and `exclude` for recursive calls, and save the actual keys
     * from the object "at the current level of this call" (no, it's not thinking about the
     * children :P).
     */
    let keysToFormat;
    // If the `include` parameter has paths/keys...
    if (include.length) {
      keysToFormat = include
      .map((includePath) => {
        // Normalize the path/key.
        const useIncludePath = includePath
        .replace(cleanPathStartExpression, '')
        .replace(cleanPathEndExpression, '');
        // Define the variable that will, eventually, have the real key.
        let key;
        // If the value is a path...
        if (useIncludePath.includes(pathDelimiter)) {
          // Split all its components.
          const pathParts = useIncludePath.split(pathDelimiter);
          // Get the first component, a.k.a. the real key.
          const pathKey = pathParts.shift();
          /**
           * This is very important: Since the path was specified with sub components (like
           * `myProp.mySubProp`), the method won't format the key, but the sub key(s)
           * (`mySubProp`).
           * The `key` is set to `false` so it will be later removed using `.filter`.
           */
          key = false;
          /**
           * If there's no array for the key on the "`include` dictionary for recursive calls",
           * create an empty one.
           */
          if (!subIncludeByKey[pathKey]) {
            subIncludeByKey[pathKey] = [];
          }
          // Save the rest of the path to be sent on the recursive call as `include`.
          subIncludeByKey[pathKey].push(pathParts.join(pathDelimiter));
        } else {
          // If the value wasn't a path, assume it's a key, and set it to be returned.
          key = useIncludePath;
        }

        return key;
      })
      // Remove any `false` keys.
      .filter((key) => key);
    } else {
      // There's nothing on the `include` parameter, so use all the keys.
      keysToFormat = keys;
    }
    /**
     * Similar to `subIncludeByKey`, this dictionary will be used to save the `exclude` parameter
     * that will be sent for specific keys on recursive calls.
     * If `exclude` has a path like `myKey.mySubKey`, `myKey` will be transformed, but `mySubKey`
     * is saved on this dictionary (`{ myKey: ['mySubKey']}`) and when the method applies the
     * formatting to the object, if `myKey` has an object, it will make a recursive all and
     * send `['mySubKey]` as its `exclude` parameter.
     */
    const subExcludeByKey = {};
    // If the `include` parameter has paths/keys...
    if (exclude.length) {
      /**
       * Create a dictionary of keys that should be removed from `keysToFormat`.
       * It's easier to have them on a list and use `.filter` than actually call `.splice` for
       * every key that should be removed.
       */
      const keysToRemove = [];
      exclude.forEach((excludePath) => {
        // Normalize the path/key.
        const useExcludePath = excludePath
        .replace(cleanPathStartExpression, '')
        .replace(cleanPathEndExpression, '');
        // If the value is a path...
        if (useExcludePath.includes(pathDelimiter)) {
          // Split all its components.
          const pathParts = useExcludePath.split(pathDelimiter);
          // Get the first component, a.k.a. the real key.
          const pathKey = pathParts.shift();
          /**
           * If there's no array for the key on the "`exclude` dictionary for recursive calls",
           * create an empty one.
           */
          if (!subExcludeByKey[pathKey]) {
            subExcludeByKey[pathKey] = [];
          }
          // Save the rest of the path to be sent on the recursive call as `exclude`.
          subExcludeByKey[pathKey].push(pathParts.join(pathDelimiter));
        } else {
          /**
           * If the value wasn't a path, assume it's a key, turn the flag on the "children
           * dictionary" to `false`, to prevent recursive calls, and add the key to the list
           * of keys that will be removed from `keysToFormat`.
           * Basically: If it's a key, don't format it and don't make recursive calls for it.
           */
          hasChildrenByKey[useExcludePath] = false;
          keysToRemove.push(useExcludePath);
        }
      });
      // Remove keys that should be excluded.
      keysToFormat = keysToFormat.filter((key) => !keysToRemove.includes(key));
    }
    // "Finally", reduce all the keys from the object and create the new one...
    return keys.reduce(
      (newObj, key) => {
        /**
         * Define the new key and value for the object property. Depending on the validations,
         * they may be replaced with formatted ones.
         */
        let newKey;
        let newValue;
        /**
         * Get the current value for the key, in case it's needed for a recursive call or just
         * to send it back because it didn't need any change.
         */
        const value = target[key];
        // If the key should be formatted, apply the formatting; otherwise, keep the original.
        if (keysToFormat.includes(key)) {
          newKey = key.replace(searchExpression, replaceWith);
        } else {
          newKey = key;
        }
        /**
         * If the paths/keys on `exclude` didn't modify the "children dictionary" for the key and
         * the value is another object, make a recursive call; otherwise, just use the original
         * value.
         */
        if (hasChildrenByKey[key]) {
          newValue = this.formatKeys(
            value,
            searchExpression,
            replaceWith,
            subIncludeByKey[key] || [],
            subExcludeByKey[key] || [],
            pathDelimiter,
          );
        } else {
          newValue = value;
        }
        // "Done", return the new object with the "new key" and the "new value".
        return { ...newObj, [newKey]: newValue };
      },
      {},
    );
  }
  /**
   * Returns the value of an object property using a path.
   *
   * @example
   * const obj = {
   *   propOne: {
   *     propOneSub: 'Charito!',
   *   },
   *   propTwo: '!!!',
   * };
   * console.log(ObjectUtils.get(
   *   obj,
   *   'propOne.propOneSub'
   * ));
   * // Will output 'Charito!'
   *
   * @param {Object}  target                The object from where the property will be read.
   * @param {string}  objPath               The path to the property.
   * @param {string}  [pathDelimiter='.']   The delimiter that will separate the path components.
   * @param {boolean} [failWithError=false] Whether or not to throw an error when the path is
   *                                        invalid. If this is `false`, the method will silently
   *                                        fail and return `undefined`.
   * @returns {*}
   * @throws {Error} If the path is invalid and `failWithError` is set to `true`.
   */
  static get(target, objPath, pathDelimiter = '.', failWithError = false) {
    const parts = objPath.split(pathDelimiter);
    const first = parts.shift();
    let currentElement = target[first];
    if (typeof currentElement === 'undefined') {
      if (failWithError) {
        throw new Error(`There's nothing on '${objPath}'`);
      }
    } else if (parts.length) {
      let currentPath = first;
      parts.some((currentPart) => {
        let breakLoop = false;
        currentPath += `${pathDelimiter}${currentPart}`;
        currentElement = currentElement[currentPart];
        if (typeof currentElement === 'undefined') {
          if (failWithError) {
            throw new Error(`There's nothing on '${currentPath}'`);
          } else {
            breakLoop = true;
          }
        }

        return breakLoop;
      });
    }

    return currentElement;
  }
  /**
   * A shorthand method for {@link ObjectUtils.formatKeys} that transforms the keys from
   * `lowerCamelCase` to `dash-case`.
   *
   * @param {Object} target              The object for format.
   * @param {Array}  [include=[]]        A list of keys or paths where the transformation will
   *                                     be made. If not specified, the method will use all the
   *                                     keys from the object.
   * @param {Array}  [exclude=[]]        A list of keys or paths where the transformation won't
   *                                     be made.
   * @param {string} [pathDelimiter='.'] The delimiter that will separate the path components
   *                                     for both `include` and `exclude`.
   * @returns {Object}
   */
  static lowerCamelToDashKeys(target, include = [], exclude = [], pathDelimiter = '.') {
    return this.formatKeys(
      target,
      /([a-z])([A-Z])/g,
      (fullMatch, firstLetter, secondLetter) => {
        const newSecondLetter = secondLetter.toLowerCase();
        return `${firstLetter}-${newSecondLetter}`;
      },
      include,
      exclude,
      pathDelimiter,
    );
  }
  /**
   * A shorthand method for {@link ObjectUtils.formatKeys} that transforms the keys from
   * `lowerCamelCase` to `snake_case`.
   *
   * @param {Object} target              The object for format.
   * @param {Array}  [include=[]]        A list of keys or paths where the transformation will
   *                                     be made. If not specified, the method will use all the
   *                                     keys from the object.
   * @param {Array}  [exclude=[]]        A list of keys or paths where the transformation won't
   *                                     be made.
   * @param {string} [pathDelimiter='.'] The delimiter that will separate the path components
   *                                     for both `include` and `exclude`.
   * @returns {Object}
   */
  static lowerCamelToSnakeKeys(target, include = [], exclude = [], pathDelimiter = '.') {
    return this.formatKeys(
      target,
      /([a-z])([A-Z])/g,
      (fullMatch, firstLetter, secondLetter) => {
        const newSecondLetter = secondLetter.toLowerCase();
        return `${firstLetter}_${newSecondLetter}`;
      },
      include,
      exclude,
      pathDelimiter,
    );
  }
  /**
   * This method makes a deep merge of a list of objects into a new one. The method also supports
   * arrays.
   *
   * @example
   * const objA = { a: 'first' };
   * const objB = { b: 'second' };
   * console.log(ObjectUtils.merge(objA, objB));
   * // Will output { a: 'first', b: 'second' }
   * @example
   * const arrA = [{ a: 'first' }];
   * const arrB = [{ b: 'second' }];
   * console.log(ObjectUtils.merge(objA, objB));
   * // Will output [{ a: 'first', b: 'second' }]
   * @param {...{Object}} targets The objects to merge.
   * @returns {Object}
   */
  static merge(...targets) {
    const [firstTarget] = targets;
    const base = Array.isArray(firstTarget) ? [] : {};
    return extend(true, base, ...targets);
  }
  /**
   * Sets a property on an object using a path. If the path doesn't exist, it will be created.
   *
   * @example
   * const target = {};
   * console.log(ObjectUtils.set(target, 'some.prop.path', 'some-value'));
   * // Will output { some: { prop: { path: 'some-value' } } }
   *
   * @param {Object}  target                The object where the property will be set.
   * @param {string}  objPath               The path for the property.
   * @param {*}       value                 The value to set on the property.
   * @param {string}  [pathDelimiter='.']   The delimiter that will separate the path components.
   * @param {boolean} [failWithError=false] Whether or not to throw an error when the path is
   *                                        invalid. If this is `false`, the method will silently
   *                                        fail and return `undefined`.
   * @returns {Object} A copy of the original object with the added property/properties.
   * @throws {Error} If one of the path components is for a non-object property and
   *                 `failWithError` is set to `true`.
   */
  static set(
    target,
    objPath,
    value,
    pathDelimiter = '.',
    failWithError = false,
  ) {
    let result = this.copy(target);
    if (objPath.includes(pathDelimiter)) {
      const parts = objPath.split(pathDelimiter);
      const last = parts.pop();
      let currentElement = result;
      let currentPath = '';
      parts.forEach((part) => {
        currentPath += `${pathDelimiter}${part}`;
        const element = currentElement[part];
        const elementType = typeof element;
        if (elementType === 'undefined') {
          currentElement[part] = {};
          currentElement = currentElement[part];
        } else if (elementType === 'object') {
          currentElement = currentElement[part];
        } else {
          const errorPath = currentPath.substr(pathDelimiter.length);
          if (failWithError) {
            throw new Error(
              `There's already an element of type '${elementType}' on '${errorPath}'`,
            );
          } else {
            result = undefined;
          }
        }
      });

      if (result) {
        currentElement[last] = value;
      }
    } else {
      result[objPath] = value;
    }

    return result;
  }
  /**
   * A shorthand method for {@link ObjectUtils.formatKeys} that transforms the keys from
   * `snake_case` to `dash-case`.
   *
   * @param {Object} target              The object for format.
   * @param {Array}  [include=[]]        A list of keys or paths where the transformation will
   *                                     be made. If not specified, the method will use all the
   *                                     keys from the object.
   * @param {Array}  [exclude=[]]        A list of keys or paths where the transformation won't
   *                                     be made.
   * @param {string} [pathDelimiter='.'] The delimiter that will separate the path components
   *                                     for both `include` and `exclude`.
   * @returns {Object}
   */
  static snakeToDashKeys(target, include = [], exclude = [], pathDelimiter = '.') {
    return this.formatKeys(
      target,
      /([a-z])_([a-z])/g,
      (fullMatch, firstLetter, secondLetter) => `${firstLetter}-${secondLetter}`,
      include,
      exclude,
      pathDelimiter,
    );
  }
  /**
   * A shorthand method for {@link ObjectUtils.formatKeys} that transforms the keys from
   * `snake_case` to `lowerCamelCase`.
   *
   * @param {Object} target              The object for format.
   * @param {Array}  [include=[]]        A list of keys or paths where the transformation will
   *                                     be made. If not specified, the method will use all the
   *                                     keys from the object.
   * @param {Array}  [exclude=[]]        A list of keys or paths where the transformation won't
   *                                     be made.
   * @param {string} [pathDelimiter='.'] The delimiter that will separate the path components
   *                                     for both `include` and `exclude`.
   * @returns {Object}
   */
  static snakeToLowerCamelKeys(target, include = [], exclude = [], pathDelimiter = '.') {
    return this.formatKeys(
      target,
      /([a-z])_([a-z])/g,
      (fullMatch, firstLetter, secondLetter) => {
        const newSecondLetter = secondLetter.toUpperCase();
        return `${firstLetter}${newSecondLetter}`;
      },
      include,
      exclude,
      pathDelimiter,
    );
  }
  /**
   * This method does the exact opposite from `flat`: It takes an already flattern object and
   * restores it structure.
   *
   * @example
   * const target = {
   *   'propOne.propOneSub': 'Charito!
   *   propTwo: '!!!',
   * };
   * console.log(ObjectUtils.unflat(target);
   * // Will output { propOne: { propOneSub: 'Charito!' }, 'propTwo': '!!!' }
   *
   * @param {Object} target                The object to transform.
   * @param {string} [pathDelimiter='.']   The delimiter that will separate the path components.
   * @returns {Object}
   */
  static unflat(target, pathDelimiter = '.') {
    return Object.keys(target).reduce(
      (current, key) => this.set(current, key, target[key], pathDelimiter),
      {},
    );
  }
  /**
   * @throws {Error} If instantiated. This class is meant to be have only static methods.
   * @ignore
   */
  constructor() {
    throw new Error('ObjectUtils is a static class');
  }
}

module.exports = ObjectUtils;
